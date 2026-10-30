const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      default: 'Business Owner'
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'owner'],
      default: 'owner'
    },
    companyName: {
      type: String,
      default: 'Apex Dairy Distribution'
    },
    productName: {
      type: String,
      default: 'Apex Fresh Paneer 200g'
    },
    productCategory: {
      type: String,
      default: 'Fresh Dairy & Paneer'
    },
    defaultUnitCost: {
      type: Number,
      default: 75.0 // INR (Wholesale production & procurement cost)
    },
    defaultSellingPrice: {
      type: Number,
      default: 105.0 // INR (Retail MRP)
    },
    defaultLeadTimeDays: {
      type: Number,
      default: 7
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
