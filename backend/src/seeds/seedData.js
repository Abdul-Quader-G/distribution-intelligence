const mongoose = require('mongoose');
const User = require('../models/User');
const Location = require('../models/Location');
const SupplyRecord = require('../models/SupplyRecord');
const SalesRecord = require('../models/SalesRecord');
const Forecast = require('../models/Forecast');
const { generateAllLocationForecasts } = require('../services/forecastingService');

const seedDatabase = async () => {
  console.log('[Seed] Beginning data synchronization...');

  // 1. Clean existing collections
  await User.deleteMany({});
  await Location.deleteMany({});
  await SupplyRecord.deleteMany({});
  await SalesRecord.deleteMany({});
  await Forecast.deleteMany({});

  console.log('[Seed] Cleared existing data.');

  // 2. Create Business Owner / Admin
  const owner = await User.create({
    name: 'Elena Vance',
    email: 'admin@distribintel.com',
    password: 'admin123',
    role: 'owner',
    companyName: 'Apex Distribution Partners',
    productName: 'Apex Organic Greek Yogurt (500g)',
    productCategory: 'Perishable Dairy & Probiotics',
    defaultUnitCost: 4.5,
    defaultSellingPrice: 7.99,
    defaultLeadTimeDays: 7
  });

  console.log(`[Seed] Created admin account: ${owner.email} / admin123`);

  // 3. Create Locations
  const locationsData = [
    {
      name: 'Downtown Flagship Store',
      code: 'LOC-01',
      type: 'Flagship Retail',
      address: '450 Lexington Ave',
      city: 'New York',
      state: 'NY',
      contactPerson: 'Marcus Brody',
      contactPhone: '+1 (212) 555-0142',
      capacityUnits: 1800,
      minSafetyStock: 100
    },
    {
      name: 'Metro Distribution Hub East',
      code: 'LOC-02',
      type: 'Regional Hub',
      address: '88 Long Island Expressway',
      city: 'Queens',
      state: 'NY',
      contactPerson: 'Sarah Jenkins',
      contactPhone: '+1 (718) 555-0199',
      capacityUnits: 3200,
      minSafetyStock: 250
    },
    {
      name: 'Westfield Grand Kiosk',
      code: 'LOC-03',
      type: 'Supermarket Kiosk',
      address: '1000 Flatbush Ave Mall',
      city: 'Brooklyn',
      state: 'NY',
      contactPerson: 'David Chen',
      contactPhone: '+1 (347) 555-0187',
      capacityUnits: 950,
      minSafetyStock: 60
    },
    {
      name: 'Northridge Organic Mart',
      code: 'LOC-04',
      type: 'Convenience Store',
      address: '220 Central Park Ave',
      city: 'White Plains',
      state: 'NY',
      contactPerson: 'Amara Okafor',
      contactPhone: '+1 (914) 555-0164',
      capacityUnits: 1200,
      minSafetyStock: 75
    },
    {
      name: 'Harbor Point Market',
      code: 'LOC-05',
      type: 'Wholesale Outlet',
      address: '15 Harbor Point Blvd',
      city: 'Stamford',
      state: 'CT',
      contactPerson: 'Liam Gallagher',
      contactPhone: '+1 (203) 555-0131',
      capacityUnits: 2400,
      minSafetyStock: 180
    }
  ];

  const locations = await Location.insertMany(locationsData);
  console.log(`[Seed] Seeded ${locations.length} distribution locations.`);

  // 4. Generate 45 Days of Historical Daily Sales
  const salesToInsert = [];
  const now = new Date();
  const sellingPrice = 7.99;

  // Base sales profile per location
  const locProfiles = {
    'LOC-01': { base: 55, variance: 15, weekendBoost: 1.35 },
    'LOC-02': { base: 85, variance: 20, weekendBoost: 1.25 },
    'LOC-03': { base: 32, variance: 10, weekendBoost: 1.40 },
    'LOC-04': { base: 40, variance: 12, weekendBoost: 1.20 },
    'LOC-05': { base: 65, variance: 18, weekendBoost: 1.30 }
  };

  for (const loc of locations) {
    const profile = locProfiles[loc.code] || { base: 45, variance: 10, weekendBoost: 1.2 };

    for (let dayOffset = 45; dayOffset >= 1; dayOffset--) {
      const saleDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const dayOfWeek = saleDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;

      // Realistic pseudo-random sales with weekend patterns
      const randomNoise = (Math.sin(dayOffset * 0.7) * profile.variance) + ((Math.random() - 0.5) * 8);
      let dailyUnits = Math.round((profile.base + randomNoise) * (isWeekend ? profile.weekendBoost : 1.0));
      dailyUnits = Math.max(12, dailyUnits);

      salesToInsert.push({
        location: loc._id,
        date: saleDate,
        quantitySold: dailyUnits,
        unitPrice: sellingPrice,
        revenue: Number((dailyUnits * sellingPrice).toFixed(2)),
        notes: isWeekend ? 'Weekend retail surge' : 'Standard weekday delivery demand'
      });
    }
  }

  await SalesRecord.insertMany(salesToInsert);
  console.log(`[Seed] Seeded ${salesToInsert.length} historical daily sales records.`);

  // 5. Generate Supply Batches:
  // - Past batches that were supplied 30-40 days ago (some units expired to reflect historical loss)
  // - Batches supplied 15 days ago with short expiry (imminent 3-5 days expiry risk)
  // - Fresh batches supplied recently (with 14-21 days of safe shelf life)
  const unitCost = 4.5;
  const batchesToInsert = [];
  let batchCounter = 100;

  for (const loc of locations) {
    const locSalesTotal = salesToInsert
      .filter(s => s.location.toString() === loc._id.toString())
      .reduce((sum, s) => sum + s.quantitySold, 0);

    // Batch 1: Supplied 36 days ago, expired 6 days ago.
    // Leaves exactly 25 units unpurchased that expired past shelf life ($112.50 loss per location)
    batchCounter++;
    const batch1Qty = locSalesTotal + 25;
    batchesToInsert.push({
      batchNumber: `BAT-2026-${batchCounter}`,
      location: loc._id,
      quantity: batch1Qty,
      remainingQuantity: 25,
      supplyDate: new Date(now.getTime() - 36 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      unitCost,
      supplierName: 'Apex Organics Dairy Co.',
      notes: 'Initial cycle batch - past shelf life',
      status: 'expired'
    });

    // Batch 2: Supplied 14 days ago, expiring in 4 days (within 7-day forecast horizon)
    // Leaves exactly 110 units that need to be excluded from usable inventory
    batchCounter++;
    const batch2Qty = 110;
    batchesToInsert.push({
      batchNumber: `BAT-2026-${batchCounter}`,
      location: loc._id,
      quantity: batch2Qty,
      remainingQuantity: 110,
      supplyDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      unitCost,
      supplierName: 'Apex Organics Dairy Co.',
      notes: 'Mid-month supply - near-expiry warning window',
      status: 'active'
    });

    // Batch 3: Fresh certified batch supplied 3 days ago, safe for 18 days
    // Provides ~260-350 units of fresh usable stock
    batchCounter++;
    const freshUnits = loc.code === 'LOC-03' ? 180 : (loc.code === 'LOC-01' ? 320 : 380);
    batchesToInsert.push({
      batchNumber: `BAT-2026-${batchCounter}`,
      location: loc._id,
      quantity: freshUnits,
      remainingQuantity: freshUnits,
      supplyDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      unitCost,
      supplierName: 'Apex Organics Dairy Co.',
      notes: 'Latest certified cold-chain shipment',
      status: 'active'
    });
  }

  await SupplyRecord.insertMany(batchesToInsert);
  console.log(`[Seed] Seeded ${batchesToInsert.length} supply batches with realistic expiry profiles.`);

  // 6. Generate AI Forecasts for all locations
  await generateAllLocationForecasts(7);
  console.log('[Seed] Generated initial AI demand forecasts and procurement recommendations.');

  console.log('[Seed] Database initialization complete!');
};

// Execute if run directly from CLI
if (require.main === module) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
  const { connectDB, disconnectDB } = require('../config/db');

  connectDB()
    .then(async () => {
      await seedDatabase();
      await disconnectDB();
      console.log('[Seed] Finished seed script.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error seeding database:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
