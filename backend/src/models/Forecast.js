const mongoose = require('mongoose');

const forecastSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required']
    },
    forecastDate: {
      type: Date,
      default: Date.now
    },
    targetPeriodDays: {
      type: Number,
      default: 7, // Default 7-day replenishment cycle
      min: 1
    },
    predictedDailyDemand: {
      type: Number,
      required: true,
      min: 0
    },
    predictedTotalDemand: {
      type: Number,
      required: true,
      min: 0
    },
    physicalInventory: {
      type: Number,
      required: true,
      min: 0
    },
    expiringInventory: {
      type: Number,
      required: true,
      min: 0,
      description: 'Stock expiring before the forecast period ends'
    },
    usableInventory: {
      type: Number,
      required: true,
      min: 0,
      description: 'Physical inventory minus stock expiring before or during cycle'
    },
    recommendedSupply: {
      type: Number,
      required: true,
      min: 0,
      description: 'max(0, Predicted Demand - Usable Inventory)'
    },
    projectedStockoutRisk: {
      type: String,
      enum: ['High', 'Moderate', 'Low', 'None'],
      default: 'Low'
    },
    projectedLossWithoutAction: {
      type: Number,
      default: 0,
      description: 'Estimated financial loss from stockouts and unmanaged expiry'
    },
    projectedSavings: {
      type: Number,
      default: 0,
      description: 'Estimated financial gain from recommended replenishment vs oversupply/stockout'
    },
    method: {
      type: String,
      default: 'Weighted Moving Average + Day-of-Week Seasonality'
    },
    confidenceScore: {
      type: Number,
      default: 92,
      min: 0,
      max: 100
    },
    calculationDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'dismissed', 'ordered'],
      default: 'pending_review'
    }
  },
  { timestamps: true }
);

forecastSchema.index({ location: 1, forecastDate: -1 });

module.exports = mongoose.model('Forecast', forecastSchema);
