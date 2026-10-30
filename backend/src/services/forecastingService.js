const SalesRecord = require('../models/SalesRecord');
const Location = require('../models/Location');
const Forecast = require('../models/Forecast');
const User = require('../models/User');
const { calculateLocationInventory } = require('./inventoryService');

/**
 * Generate AI Demand Forecast and Procurement Recommendation for a location.
 * Implements Weighted Moving Average with Day-of-Week Seasonality and Earliest-Expiry-First inventory deduction.
 */
const generateForecastForLocation = async (locationId, targetPeriodDays = 7) => {
  const location = await Location.findById(locationId);
  if (!location) {
    throw new Error('Location not found');
  }

  // Fetch unit economics from user or fallback
  const user = await User.findOne();
  const unitCost = user?.defaultUnitCost || 75.0; // INR
  const unitPrice = user?.defaultSellingPrice || 105.0; // INR
  const unitMargin = Math.max(0, unitPrice - unitCost);

  // Fetch historical sales for this location (last 60 days)
  const salesHistory = await SalesRecord.find({ location: locationId })
    .sort({ date: -1 })
    .limit(60);

  let predictedDailyDemand = 0;
  let predictedTotalDemand = 0;
  let confidenceScore = 90;
  const dayOfWeekMultipliers = { 0: 1.1, 1: 0.85, 2: 0.9, 3: 0.95, 4: 1.05, 5: 1.25, 6: 1.3 }; // Sun-Sat typical retail cycle
  const dailyProjections = [];

  if (salesHistory.length >= 7) {
    // 1. Calculate Day-of-Week historical averages
    const dayBuckets = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    let totalSalesSum = 0;

    salesHistory.forEach(sale => {
      const day = new Date(sale.date).getDay();
      dayBuckets[day].push(sale.quantitySold);
      totalSalesSum += sale.quantitySold;
    });

    const overallAverageDaily = totalSalesSum / salesHistory.length;

    // Refine day multipliers if we have historical day data
    for (let day = 0; day < 7; day++) {
      if (dayBuckets[day].length > 0) {
        const bucketAvg = dayBuckets[day].reduce((a, b) => a + b, 0) / dayBuckets[day].length;
        if (overallAverageDaily > 0) {
          const ratio = bucketAvg / overallAverageDaily;
          // Clamp multiplier between 0.6 and 1.6 to avoid extreme anomalies
          dayOfWeekMultipliers[day] = Number(Math.max(0.6, Math.min(1.6, ratio)).toFixed(2));
        }
      }
    }

    // 2. Weighted Moving Average (Last 7 days weight 3, days 8-14 weight 2, days 15+ weight 1)
    let weightedSum = 0;
    let totalWeight = 0;

    salesHistory.forEach((sale, index) => {
      let weight = 1;
      if (index < 7) weight = 3;
      else if (index < 14) weight = 2;

      weightedSum += sale.quantitySold * weight;
      totalWeight += weight;
    });

    const baseWMA = weightedSum / totalWeight;

    // 3. Project daily demand across targetPeriodDays
    const now = new Date();
    for (let i = 1; i <= targetPeriodDays; i++) {
      const forecastDay = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = forecastDay.getDay();
      const multiplier = dayOfWeekMultipliers[dayOfWeek] || 1.0;
      const expectedUnits = Math.max(5, Math.round(baseWMA * multiplier));

      dailyProjections.push({
        dayNumber: i,
        date: forecastDay.toISOString().split('T')[0],
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
        multiplier,
        predictedUnits: expectedUnits
      });

      predictedTotalDemand += expectedUnits;
    }

    predictedDailyDemand = Number((predictedTotalDemand / targetPeriodDays).toFixed(1));
    confidenceScore = salesHistory.length >= 30 ? 94 : 88;
  } else {
    // Fallback heuristic based on location capacity
    const estimatedDaily = Math.max(15, Math.round((location.capacityUnits || 1000) * 0.035));
    predictedDailyDemand = estimatedDaily;
    predictedTotalDemand = estimatedDaily * targetPeriodDays;
    confidenceScore = 75;

    const now = new Date();
    for (let i = 1; i <= targetPeriodDays; i++) {
      const forecastDay = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      dailyProjections.push({
        dayNumber: i,
        date: forecastDay.toISOString().split('T')[0],
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][forecastDay.getDay()],
        multiplier: 1.0,
        predictedUnits: estimatedDaily
      });
    }
  }

  // 4. Calculate Inventory: Physical, Expiring, Usable
  const inventoryData = await calculateLocationInventory(locationId, targetPeriodDays);
  const physicalInventory = inventoryData.physicalInventory;
  const expiringInventory = inventoryData.expiringInventory;
  const usableInventory = inventoryData.usableInventory;

  // 5. Procurement Formula:
  // Recommended quantity = max(0, Forecast demand - Usable inventory)
  const recommendedSupply = Math.max(0, predictedTotalDemand - usableInventory);

  // 6. Stockout Risk Assessment
  let projectedStockoutRisk = 'Low';
  const coverageRatio = usableInventory / (predictedTotalDemand || 1);
  if (coverageRatio < 0.3) {
    projectedStockoutRisk = 'High';
  } else if (coverageRatio < 0.75) {
    projectedStockoutRisk = 'Moderate';
  } else if (coverageRatio >= 1.5) {
    projectedStockoutRisk = 'None';
  }

  // 7. Projected Savings and Loss Estimates:
  // - Loss without AI action: expiring stock waste + lost revenue from unmet demand
  const potentialStockoutUnits = Math.max(0, predictedTotalDemand - physicalInventory);
  const lostMarginFromStockout = potentialStockoutUnits * unitMargin;
  const imminentExpiryLoss = expiringInventory * unitCost;
  const projectedLossWithoutAction = Number((lostMarginFromStockout + imminentExpiryLoss).toFixed(2));

  // Projected savings: Avoided stockout margin + avoided waste by not over-supplying
  const projectedSavings = Number(
    (
      lostMarginFromStockout * 0.95 + // Recovered margin by supplying exact deficit
      (expiringInventory > 0 ? imminentExpiryLoss * 0.5 : 0) + // Early markdown/salvage value
      (recommendedSupply > 0 ? 450.0 : 200.0) // Operational logistics & batch order efficiency (INR)
    ).toFixed(2)
  );

  // 8. Save or update Forecast record
  const forecastRecord = await Forecast.findOneAndUpdate(
    { location: locationId },
    {
      location: locationId,
      forecastDate: new Date(),
      targetPeriodDays,
      predictedDailyDemand,
      predictedTotalDemand,
      physicalInventory,
      expiringInventory,
      usableInventory,
      recommendedSupply,
      projectedStockoutRisk,
      projectedLossWithoutAction,
      projectedSavings,
      method: 'Weighted Moving Average + Day-of-Week Seasonality',
      confidenceScore,
      calculationDetails: {
        unitCost,
        unitPrice,
        unitMargin,
        dailyProjections,
        coverageRatio: Number(coverageRatio.toFixed(2)),
        batchesAnalysed: inventoryData.batches.length,
        notes: 'Usable inventory excludes batches expiring before the forecast period ends.'
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('location', 'name code type city state capacityUnits');

  return forecastRecord;
};

/**
 * Generate forecasts for all active locations
 */
const generateAllLocationForecasts = async (targetPeriodDays = 7) => {
  const locations = await Location.find({ active: true });
  const forecasts = await Promise.all(
    locations.map(loc => generateForecastForLocation(loc._id, targetPeriodDays))
  );
  return forecasts;
};

module.exports = {
  generateForecastForLocation,
  generateAllLocationForecasts
};
