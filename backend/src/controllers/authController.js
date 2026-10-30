const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'distrib_intel_jwt_super_secret_dev_key_2026';
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        productName: user.productName,
        productCategory: user.productCategory,
        defaultUnitCost: user.defaultUnitCost,
        defaultSellingPrice: user.defaultSellingPrice,
        defaultLeadTimeDays: user.defaultLeadTimeDays
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register a new admin/owner user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, companyName, productName, defaultUnitCost, defaultSellingPrice } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const user = await User.create({
      name: name || 'Business Owner',
      email: email.toLowerCase(),
      password,
      companyName: companyName || 'Apex Dairy Distribution',
      productName: productName || 'Apex Fresh Paneer 200g',
      defaultUnitCost: defaultUnitCost || 75.0,
      defaultSellingPrice: defaultSellingPrice || 105.0
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        productName: user.productName,
        defaultUnitCost: user.defaultUnitCost,
        defaultSellingPrice: user.defaultSellingPrice
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update business/product settings
// @route   PUT /api/auth/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      companyName: req.body.companyName,
      productName: req.body.productName,
      productCategory: req.body.productCategory,
      defaultUnitCost: req.body.defaultUnitCost,
      defaultSellingPrice: req.body.defaultSellingPrice,
      defaultLeadTimeDays: req.body.defaultLeadTimeDays
    };

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  register,
  getMe,
  updateSettings
};
