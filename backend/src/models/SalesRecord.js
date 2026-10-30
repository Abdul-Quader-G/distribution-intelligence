const mongoose = require('mongoose');

const salesRecordSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required']
    },
    date: {
      type: Date,
      required: [true, 'Sales date is required'],
      default: Date.now
    },
    quantitySold: {
      type: Number,
      required: [true, 'Quantity sold is required'],
      min: [0, 'Quantity sold cannot be negative']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit selling price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    revenue: {
      type: Number,
      default: function () {
        return (this.quantitySold || 0) * (this.unitPrice || 0);
      }
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// Compound index for querying sales by location and date range
salesRecordSchema.index({ location: 1, date: -1 });

// Ensure revenue is computed if not provided
salesRecordSchema.pre('save', function (next) {
  if (this.quantitySold != null && this.unitPrice != null) {
    this.revenue = Number((this.quantitySold * this.unitPrice).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('SalesRecord', salesRecordSchema);
