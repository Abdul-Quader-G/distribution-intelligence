const Location = require('../models/Location');
const SupplyRecord = require('../models/SupplyRecord');
const SalesRecord = require('../models/SalesRecord');
const { calculateLocationInventory } = require('../services/inventoryService');

// @desc    Get all locations with live inventory and capacity stats
// @route   GET /api/locations
// @access  Private
const getAllLocations = async (req, res, next) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });

    // Calculate quick stats for each location
    const locationsWithStats = await Promise.all(
      locations.map(async (loc) => {
        const inv = await calculateLocationInventory(loc._id, 7);
        const capacityUtilization = loc.capacityUnits > 0
          ? Number(((inv.physicalInventory / loc.capacityUnits) * 100).toFixed(1))
          : 0;

        return {
          ...loc.toObject(),
          physicalInventory: inv.physicalInventory,
          usableInventory: inv.usableInventory,
          expiringInventory: inv.expiringInventory,
          expiredInventory: inv.expiredInventory,
          totalSuppliedUnits: inv.totalSuppliedUnits,
          totalUnitsSold: inv.totalUnitsSold,
          capacityUtilization: Math.min(100, capacityUtilization),
          batchCount: inv.batches.length
        };
      })
    );

    res.status(200).json({
      success: true,
      count: locationsWithStats.length,
      data: locationsWithStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single location
// @route   GET /api/locations/:id
// @access  Private
const getLocationById = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const inventory = await calculateLocationInventory(location._id, 7);

    res.status(200).json({
      success: true,
      data: {
        ...location.toObject(),
        inventory
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new location
// @route   POST /api/locations
// @access  Private
const createLocation = async (req, res, next) => {
  try {
    const { name, code, type, address, city, state, contactPerson, contactPhone, capacityUnits, minSafetyStock } = req.body;

    const existingCode = await Location.findOne({ code: code?.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Location code ${code} is already in use.`
      });
    }

    const location = await Location.create({
      name,
      code: code.toUpperCase(),
      type: type || 'Flagship Retail',
      address,
      city,
      state,
      contactPerson,
      contactPhone,
      capacityUnits: Number(capacityUnits) || 1500,
      minSafetyStock: Number(minSafetyStock) || 50
    });

    res.status(201).json({
      success: true,
      data: location
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private
const updateLocation = async (req, res, next) => {
  try {
    let location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

    location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: location
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private
const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    // Check if there are active supplies
    const supplyCount = await SupplyRecord.countDocuments({ location: req.params.id });
    if (supplyCount > 0) {
      // Instead of hard deleting, toggle active flag or delete with cascade warning
      location.active = false;
      await location.save();
      return res.status(200).json({
        success: true,
        message: 'Location has historical records. Marked as inactive to preserve auditing.',
        data: location
      });
    }

    await Location.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Location successfully deleted.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};
