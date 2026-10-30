const { calculateLocationInventory, getGlobalInventorySummary } = require('../services/inventoryService');
const Location = require('../models/Location');

// @desc    Get global inventory summary and all location summaries
// @route   GET /api/inventory
// @access  Private
const getInventorySummary = async (req, res, next) => {
  try {
    const horizonDays = Number(req.query.horizonDays) || 7;
    const summary = await getGlobalInventorySummary(horizonDays);

    // Populate location details in locationBreakdown
    const populatedBreakdown = await Promise.all(
      summary.locationBreakdown.map(async (item) => {
        const location = await Location.findById(item.locationId).select('name code type city state capacityUnits');
        const capacityUtilization = location?.capacityUnits
          ? Number(((item.physicalInventory / location.capacityUnits) * 100).toFixed(1))
          : 0;

        return {
          ...item,
          location,
          capacityUtilization: Math.min(100, capacityUtilization)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        locationBreakdown: populatedBreakdown
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed inventory and batch status for a specific location
// @route   GET /api/inventory/location/:id
// @access  Private
const getLocationInventory = async (req, res, next) => {
  try {
    const horizonDays = Number(req.query.horizonDays) || 7;
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const inventoryData = await calculateLocationInventory(location._id, horizonDays);

    res.status(200).json({
      success: true,
      data: {
        location,
        ...inventoryData
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInventorySummary,
  getLocationInventory
};
