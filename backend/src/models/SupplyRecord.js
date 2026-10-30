const mongoose = require('mongoose');

const supplyRecordSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Supply quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    remainingQuantity: {
      type: Number,
      default: function () {
        return this.quantity;
      },
      min: 0
    },
    supplyDate: {
      type: Date,
      required: [true, 'Supply date is required'],
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: [0, 'Unit cost cannot be negative']
    },
    supplierName: {
      type: String,
      default: 'Apex Organics Dairy Co.'
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'depleted', 'expired'],
      default: 'active'
    }
  },
  { timestamps: true }
);

// Index for efficient earliest-expiry querying by location
supplyRecordSchema.index({ location: 1, expiryDate: 1 });
supplyRecordSchema.index({ batchNumber: 1 });

module.exports = mongoose.model('SupplyRecord', supplyRecordSchema);
