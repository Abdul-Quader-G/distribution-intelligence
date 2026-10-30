const SupplyRecord = require('../models/SupplyRecord');
const Location = require('../models/Location');
const User = require('../models/User');

// Helper to generate unique batch code
const generateBatchCode = async () => {
  const count = await SupplyRecord.countDocuments();
  const year = new Date().getFullYear();
  const padded = String(count + 1).padStart(4, '0');
  return `BAT-${year}-${padded}`;
};

// @desc    Get all supply records
// @route   GET /api/supplies
// @access  Private
const getAllSupplies = async (req, res, next) => {
  try {
    const { location, status } = req.query;
    const filter = {};

    if (location && location !== 'all') {
      filter.location = location;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const supplies = await SupplyRecord.find(filter)
      .populate('location', 'name code city state')
      .sort({ expiryDate: 1, supplyDate: -1 });

    const now = new Date();
    const formatted = supplies.map(s => {
      const expiry = new Date(s.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return {
        ...s.toObject(),
        daysUntilExpiry,
        isExpired: daysUntilExpiry < 0,
        isExpiringSoon: daysUntilExpiry >= 0 && daysUntilExpiry <= 7
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single supply batch
// @route   GET /api/supplies/:id
// @access  Private
const getSupplyById = async (req, res, next) => {
  try {
    const supply = await SupplyRecord.findById(req.params.id).populate('location');
    if (!supply) {
      return res.status(404).json({ success: false, message: 'Supply record not found' });
    }

    res.status(200).json({
      success: true,
      data: supply
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new supply record
// @route   POST /api/supplies
// @access  Private
const createSupply = async (req, res, next) => {
  try {
    let { batchNumber, location, quantity, supplyDate, expiryDate, unitCost, supplierName, notes } = req.body;

    // Validate location
    const locationExists = await Location.findById(location);
    if (!locationExists) {
      return res.status(400).json({ success: false, message: 'Specified location does not exist.' });
    }

    // Auto-generate batch code if empty
    if (!batchNumber || batchNumber.trim() === '') {
      batchNumber = await generateBatchCode();
    } else {
      batchNumber = batchNumber.toUpperCase().trim();
    }

    // Default unit cost from user if not specified
    if (unitCost === undefined || unitCost === null || unitCost === '') {
      const user = await User.findOne();
      unitCost = user?.defaultUnitCost || 4.5;
    }

    const newSupply = await SupplyRecord.create({
      batchNumber,
      location,
      quantity: Number(quantity),
      remainingQuantity: Number(quantity),
      supplyDate: supplyDate ? new Date(supplyDate) : new Date(),
      expiryDate: new Date(expiryDate),
      unitCost: Number(unitCost),
      supplierName: supplierName || 'Apex Organics Dairy Co.',
      notes: notes || '',
      status: 'active'
    });

    const populated = await SupplyRecord.findById(newSupply._id).populate('location', 'name code city');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update supply record
// @route   PUT /api/supplies/:id
// @access  Private
const updateSupply = async (req, res, next) => {
  try {
    let supply = await SupplyRecord.findById(req.params.id);
    if (!supply) {
      return res.status(404).json({ success: false, message: 'Supply record not found' });
    }

    if (req.body.batchNumber) {
      req.body.batchNumber = req.body.batchNumber.toUpperCase().trim();
    }

    supply = await SupplyRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('location', 'name code city');

    res.status(200).json({
      success: true,
      data: supply
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete supply record
// @route   DELETE /api/supplies/:id
// @access  Private
const deleteSupply = async (req, res, next) => {
  try {
    const supply = await SupplyRecord.findById(req.params.id);
    if (!supply) {
      return res.status(404).json({ success: false, message: 'Supply record not found' });
    }

    await SupplyRecord.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Supply batch removed successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSupplies,
  getSupplyById,
  createSupply,
  updateSupply,
  deleteSupply
};
