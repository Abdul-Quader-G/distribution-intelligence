const SalesRecord = require('../models/SalesRecord');
const Location = require('../models/Location');
const User = require('../models/User');

// @desc    Get sales records
// @route   GET /api/sales
// @access  Private
const getAllSales = async (req, res, next) => {
  try {
    const { location, startDate, endDate, limit = 100 } = req.query;
    const filter = {};

    if (location && location !== 'all') {
      filter.location = location;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const sales = await SalesRecord.find(filter)
      .populate('location', 'name code city state')
      .sort({ date: -1 })
      .limit(Number(limit));

    const totalRevenue = sales.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalUnitsSold = sales.reduce((sum, item) => sum + (item.quantitySold || 0), 0);

    res.status(200).json({
      success: true,
      count: sales.length,
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalUnitsSold
      },
      data: sales
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single sales record
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res, next) => {
  try {
    const sale = await SalesRecord.findById(req.params.id).populate('location');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sales record not found' });
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Record daily sales for a location
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res, next) => {
  try {
    let { location, date, quantitySold, unitPrice, notes } = req.body;

    const locationDoc = await Location.findById(location);
    if (!locationDoc) {
      return res.status(400).json({ success: false, message: 'Specified location does not exist.' });
    }

    // Default unit price from business owner profile if omitted
    if (unitPrice === undefined || unitPrice === null || unitPrice === '') {
      const user = await User.findOne();
      unitPrice = user?.defaultSellingPrice || 7.99;
    }

    const saleDate = date ? new Date(date) : new Date();
    const parsedQty = Number(quantitySold);
    const parsedPrice = Number(unitPrice);
    const revenue = Number((parsedQty * parsedPrice).toFixed(2));

    const newSale = await SalesRecord.create({
      location,
      date: saleDate,
      quantitySold: parsedQty,
      unitPrice: parsedPrice,
      revenue,
      notes: notes || ''
    });

    const populated = await SalesRecord.findById(newSale._id).populate('location', 'name code city');

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Batch log daily sales across multiple locations
// @route   POST /api/sales/bulk
// @access  Private
const createBulkSales = async (req, res, next) => {
  try {
    const { entries, date } = req.body; // Array of { locationId, quantitySold, notes }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'No sales entries provided' });
    }

    const user = await User.findOne();
    const defaultPrice = user?.defaultSellingPrice || 7.99;
    const saleDate = date ? new Date(date) : new Date();

    const createdRecords = [];

    for (const entry of entries) {
      if (entry.quantitySold !== undefined && entry.quantitySold !== null) {
        const qty = Number(entry.quantitySold);
        const price = Number(entry.unitPrice || defaultPrice);
        const rec = await SalesRecord.create({
          location: entry.locationId,
          date: saleDate,
          quantitySold: qty,
          unitPrice: price,
          revenue: Number((qty * price).toFixed(2)),
          notes: entry.notes || 'Batch daily entry'
        });
        createdRecords.push(rec);
      }
    }

    res.status(201).json({
      success: true,
      count: createdRecords.length,
      data: createdRecords
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update sales record
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res, next) => {
  try {
    let sale = await SalesRecord.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sales record not found' });
    }

    const updateData = { ...req.body };
    if (updateData.quantitySold !== undefined || updateData.unitPrice !== undefined) {
      const qty = updateData.quantitySold !== undefined ? Number(updateData.quantitySold) : sale.quantitySold;
      const price = updateData.unitPrice !== undefined ? Number(updateData.unitPrice) : sale.unitPrice;
      updateData.revenue = Number((qty * price).toFixed(2));
    }

    sale = await SalesRecord.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('location', 'name code city');

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete sales record
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = async (req, res, next) => {
  try {
    const sale = await SalesRecord.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sales record not found' });
    }

    await SalesRecord.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Sales record deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSales,
  getSaleById,
  createSale,
  createBulkSales,
  updateSale,
  deleteSale
};
