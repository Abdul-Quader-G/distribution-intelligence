const SupplyRecord = require('../models/SupplyRecord');
const SalesRecord = require('../models/SalesRecord');
const Location = require('../models/Location');

/**
 * Re-evaluates and synchronizes inventory for a location using Earliest-Expiry-First (EEFO/FIFO).
 * Applies historical sales sequentially against batches ordered by expiry date.
 */
const calculateLocationInventory = async (locationId, horizonDays = 7) => {
  const now = new Date();
  const horizonDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  // Get all supply batches for this location ordered by expiryDate ASC (Earliest Expiry First)
  const batches = await SupplyRecord.find({
    location: locationId,
    quantity: { $gt: 0 }
  }).sort({ expiryDate: 1, supplyDate: 1 });

  // Get total historical sales for this location
  const sales = await SalesRecord.find({ location: locationId });
  const totalUnitsSold = sales.reduce((acc, curr) => acc + (curr.quantitySold || 0), 0);

  // Apply Earliest-Expiry-First allocation: sales consume oldest expiry first
  let remainingSalesToDeduct = totalUnitsSold;
  let physicalInventory = 0;
  let expiringInventory = 0;
  let expiredInventory = 0;
  let totalSuppliedUnits = 0;
  let totalStockCostValue = 0;
  let expiredLossCost = 0;

  const processedBatches = batches.map(batch => {
    totalSuppliedUnits += batch.quantity;
    let currentRemaining = batch.quantity;

    if (remainingSalesToDeduct >= currentRemaining) {
      remainingSalesToDeduct -= currentRemaining;
      currentRemaining = 0;
    } else {
      currentRemaining -= remainingSalesToDeduct;
      remainingSalesToDeduct = 0;
    }

    const expiry = new Date(batch.expiryDate);
    const isAlreadyExpired = expiry < now;
    const isExpiringSoon = !isAlreadyExpired && expiry <= horizonDate;

    let batchStatus = 'active';
    if (currentRemaining === 0) {
      batchStatus = 'depleted';
    } else if (isAlreadyExpired) {
      batchStatus = 'expired';
      expiredInventory += currentRemaining;
      expiredLossCost += currentRemaining * (batch.unitCost || 0);
    } else if (isExpiringSoon) {
      expiringInventory += currentRemaining;
      physicalInventory += currentRemaining;
      totalStockCostValue += currentRemaining * (batch.unitCost || 0);
    } else {
      physicalInventory += currentRemaining;
      totalStockCostValue += currentRemaining * (batch.unitCost || 0);
    }

    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    return {
      _id: batch._id,
      batchNumber: batch.batchNumber,
      supplyDate: batch.supplyDate,
      expiryDate: batch.expiryDate,
      originalQuantity: batch.quantity,
      remainingQuantity: currentRemaining,
      unitCost: batch.unitCost,
      supplierName: batch.supplierName,
      daysUntilExpiry,
      status: batchStatus,
      isExpired: isAlreadyExpired,
      isExpiringSoon
    };
  });

  // Usable inventory: physical inventory on hand that will NOT expire before the forecast horizon
  const usableInventory = Math.max(0, physicalInventory - expiringInventory);

  return {
    locationId,
    totalSuppliedUnits,
    totalUnitsSold,
    physicalInventory,
    expiringInventory,
    expiredInventory,
    usableInventory,
    totalStockCostValue: Number(totalStockCostValue.toFixed(2)),
    expiredLossCost: Number(expiredLossCost.toFixed(2)),
    batches: processedBatches
  };
};

/**
 * Calculates global inventory across all locations.
 */
const getGlobalInventorySummary = async (horizonDays = 7) => {
  const locations = await Location.find({ active: true });
  const summaries = await Promise.all(
    locations.map(loc => calculateLocationInventory(loc._id, horizonDays))
  );

  const globalSummary = summaries.reduce(
    (acc, curr) => {
      acc.totalSuppliedUnits += curr.totalSuppliedUnits;
      acc.totalUnitsSold += curr.totalUnitsSold;
      acc.physicalInventory += curr.physicalInventory;
      acc.expiringInventory += curr.expiringInventory;
      acc.expiredInventory += curr.expiredInventory;
      acc.usableInventory += curr.usableInventory;
      acc.totalStockCostValue += curr.totalStockCostValue;
      acc.expiredLossCost += curr.expiredLossCost;
      return acc;
    },
    {
      totalSuppliedUnits: 0,
      totalUnitsSold: 0,
      physicalInventory: 0,
      expiringInventory: 0,
      expiredInventory: 0,
      usableInventory: 0,
      totalStockCostValue: 0,
      expiredLossCost: 0
    }
  );

  globalSummary.totalStockCostValue = Number(globalSummary.totalStockCostValue.toFixed(2));
  globalSummary.expiredLossCost = Number(globalSummary.expiredLossCost.toFixed(2));
  globalSummary.locationBreakdown = summaries;

  return globalSummary;
};

module.exports = {
  calculateLocationInventory,
  getGlobalInventorySummary
};
