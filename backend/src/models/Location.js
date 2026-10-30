const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Location code is required (e.g. LOC-01)'],
      trim: true,
      uppercase: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['Flagship Retail', 'Regional Hub', 'Supermarket Kiosk', 'Wholesale Outlet', 'Convenience Store'],
      default: 'Flagship Retail'
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      default: 'Metropolis'
    },
    state: {
      type: String,
      default: 'NY'
    },
    contactPerson: {
      type: String,
      default: 'Operations Manager'
    },
    contactPhone: {
      type: String,
      default: '+1 (555) 019-2834'
    },
    capacityUnits: {
      type: Number,
      required: true,
      default: 1500,
      min: 0
    },
    minSafetyStock: {
      type: Number,
      default: 50,
      min: 0
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', locationSchema);
