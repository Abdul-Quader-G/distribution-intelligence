const { generateForecastForLocation, generateAllLocationForecasts } = require('../services/forecastingService');
const Forecast = require('../models/Forecast');
const SupplyRecord = require('../models/SupplyRecord');
const User = require('../models/User');

// @desc    Get all current AI forecasts and procurement recommendations
// @route   GET /api/procurement
// @access  Private
const getAllProcurementRecommendations = async (req, res, next) => {
  try {
    const horizonDays = Number(req.query.horizonDays) || 7;
    // Always ensure fresh calculations
    const forecasts = await generateAllLocationForecasts(horizonDays);

    const totals = forecasts.reduce(
      (acc, f) => {
        acc.totalPredictedDemand += f.predictedTotalDemand || 0;
        acc.totalPhysicalInventory += f.physicalInventory || 0;
        acc.totalExpiringInventory += f.expiringInventory || 0;
        acc.totalUsableInventory += f.usableInventory || 0;
        acc.totalRecommendedSupply += f.recommendedSupply || 0;
        acc.totalProjectedSavings += f.projectedSavings || 0;
        acc.totalProjectedLossWithoutAction += f.projectedLossWithoutAction || 0;
        return acc;
      },
      {
        totalPredictedDemand: 0,
        totalPhysicalInventory: 0,
        totalExpiringInventory: 0,
        totalUsableInventory: 0,
        totalRecommendedSupply: 0,
        totalProjectedSavings: 0,
        totalProjectedLossWithoutAction: 0
      }
    );

    totals.totalProjectedSavings = Number(totals.totalProjectedSavings.toFixed(2));
    totals.totalProjectedLossWithoutAction = Number(totals.totalProjectedLossWithoutAction.toFixed(2));

    res.status(200).json({
      success: true,
      meta: {
        forecastHorizonDays: horizonDays,
        methodology: 'Weighted Moving Average + Day-of-Week Seasonality + Earliest-Expiry-First (EEFO) Inventory Deduction',
        disclaimer: 'Projected savings are mathematical estimates based on current margin models and prevented stockout/spoilage risks, not realized actuals.'
      },
      summary: totals,
      data: forecasts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Recalculate forecast for a specific location
// @route   POST /api/procurement/recalculate/:locationId
// @access  Private
const recalculateLocationForecast = async (req, res, next) => {
  try {
    const horizonDays = Number(req.body.horizonDays) || 7;
    const forecast = await generateForecastForLocation(req.params.locationId, horizonDays);

    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve and generate replenishment supply order from recommendation
// @route   POST /api/procurement/approve/:forecastId
// @access  Private
const approveProcurementOrder = async (req, res, next) => {
  try {
    const forecast = await Forecast.findById(req.params.forecastId).populate('location');
    if (!forecast) {
      return res.status(404).json({ success: false, message: 'Forecast recommendation not found' });
    }

    if (forecast.recommendedSupply <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No supply quantity recommended for this location (inventory is sufficient).'
      });
    }

    const user = await User.findOne();
    const unitCost = user?.defaultUnitCost || 4.5;

    // Generate batch number
    const count = await SupplyRecord.countDocuments();
    const year = new Date().getFullYear();
    const batchNumber = `AI-ORD-${year}-${String(count + 1).padStart(4, '0')}`;

    // Fresh batch gets 21 days expiry standard shelf-life
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

    const supplyOrder = await SupplyRecord.create({
      batchNumber,
      location: forecast.location._id,
      quantity: forecast.recommendedSupply,
      remainingQuantity: forecast.recommendedSupply,
      supplyDate: now,
      expiryDate,
      unitCost,
      supplierName: 'Apex Organics Dairy Co. (Auto-Replenish)',
      notes: `Generated via AI Procurement recommendation for ${forecast.targetPeriodDays}-day cycle.`,
      status: 'active'
    });

    forecast.status = 'ordered';
    await forecast.save();

    res.status(201).json({
      success: true,
      message: `Purchase order ${batchNumber} for ${forecast.recommendedSupply} units successfully created and booked into supply!`,
      data: supplyOrder
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllProcurementRecommendations,
  recalculateLocationForecast,
  approveProcurementOrder
};
