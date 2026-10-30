const Location = require('../models/Location');
const SupplyRecord = require('../models/SupplyRecord');
const SalesRecord = require('../models/SalesRecord');
const Forecast = require('../models/Forecast');
const { getGlobalInventorySummary } = require('../services/inventoryService');
const { generateAllLocationForecasts } = require('../services/forecastingService');

// @desc    Get complete dashboard overview data
// @route   GET /api/dashboard
// @access  Private
const getDashboardOverview = async (req, res, next) => {
  try {
    const locations = await Location.find({ active: true });
    const totalLocations = locations.length;

    // 1. Inventory Summary with Earliest-Expiry-First calculation
    const inventorySummary = await getGlobalInventorySummary(7);

    // 2. Ensure forecasts are current
    const forecasts = await generateAllLocationForecasts(7);
    const totalProjectedSavings = forecasts.reduce((acc, f) => acc + (f.projectedSavings || 0), 0);
    const highRiskLocationsCount = forecasts.filter(f => f.projectedStockoutRisk === 'High').length;

    // 3. Sales Trends: Group sales by date over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await SalesRecord.find({
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    const recentSupplies = await SupplyRecord.find({
      supplyDate: { $gte: thirtyDaysAgo }
    }).sort({ supplyDate: 1 });

    // Build day-by-day trend data
    const trendMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      trendMap[dateKey] = {
        date: dateKey,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        unitsSold: 0,
        revenue: 0,
        unitsSupplied: 0
      };
    }

    recentSales.forEach(sale => {
      const dateKey = new Date(sale.date).toISOString().split('T')[0];
      if (trendMap[dateKey]) {
        trendMap[dateKey].unitsSold += sale.quantitySold;
        trendMap[dateKey].revenue += sale.revenue || 0;
      }
    });

    recentSupplies.forEach(supply => {
      const dateKey = new Date(supply.supplyDate).toISOString().split('T')[0];
      if (trendMap[dateKey]) {
        trendMap[dateKey].unitsSupplied += supply.quantity;
      }
    });

    const salesTrends = Object.values(trendMap).map(t => ({
      ...t,
      revenue: Number(t.revenue.toFixed(2))
    }));

    // 4. Location Performance Cards & Chart data
    const locationPerformance = inventorySummary.locationBreakdown.map(lb => {
      const loc = locations.find(l => l._id.toString() === lb.locationId.toString());
      const fc = forecasts.find(f => f.location._id?.toString() === lb.locationId.toString() || f.location.toString() === lb.locationId.toString());

      const capacity = loc?.capacityUnits || 1500;
      const capacityPct = Number(((lb.physicalInventory / capacity) * 100).toFixed(1));

      return {
        locationId: lb.locationId,
        name: loc?.name || 'Store Location',
        code: loc?.code || 'LOC',
        city: loc?.city || 'Metropolis',
        unitsSold: lb.totalUnitsSold,
        unitsSupplied: lb.totalSuppliedUnits,
        physicalInventory: lb.physicalInventory,
        usableInventory: lb.usableInventory,
        expiringInventory: lb.expiringInventory,
        expiredLossCost: lb.expiredLossCost,
        capacityUnits: capacity,
        capacityUtilization: Math.min(100, capacityPct),
        stockoutRisk: fc?.projectedStockoutRisk || 'Low',
        predictedDemand: fc?.predictedTotalDemand || 0,
        recommendedSupply: fc?.recommendedSupply || 0,
        projectedSavings: fc?.projectedSavings || 0
      };
    });

    // 5. Critical Batches Expiring in <= 7 Days
    const urgentExpiringBatches = [];
    inventorySummary.locationBreakdown.forEach(lb => {
      const loc = locations.find(l => l._id.toString() === lb.locationId.toString());
      lb.batches.forEach(b => {
        if (b.isExpiringSoon && b.remainingQuantity > 0) {
          urgentExpiringBatches.push({
            ...b,
            locationName: loc?.name || 'Location'
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      kpis: {
        totalLocations,
        unitsSupplied: inventorySummary.totalSuppliedUnits,
        unitsSold: inventorySummary.totalUnitsSold,
        currentInventory: inventorySummary.physicalInventory,
        usableInventory: inventorySummary.usableInventory,
        expiringInventory: inventorySummary.expiringInventory,
        expiredInventory: inventorySummary.expiredInventory,
        estimatedLosses: inventorySummary.expiredLossCost,
        projectedSavings: Number(totalProjectedSavings.toFixed(2)),
        highRiskLocationsCount,
        inventoryValuation: inventorySummary.totalStockCostValue
      },
      salesTrends,
      locationPerformance,
      urgentExpiringBatches: urgentExpiringBatches.slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardOverview
};
