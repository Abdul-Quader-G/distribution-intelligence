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
    name: 'Rajesh Varma',
    email: 'admin@distribintel.com',
    password: 'admin123',
    role: 'owner',
    companyName: 'Apex Dairy Distribution',
    productName: 'Apex Fresh Paneer 200g',
    productCategory: 'Fresh Dairy & Paneer',
    defaultUnitCost: 75.0, // Wholesale procurement cost (INR)
    defaultSellingPrice: 105.0, // Retail MRP (INR)
    defaultLeadTimeDays: 7
  });

  console.log(`[Seed] Created admin account: ${owner.email} / admin123`);

  // 3. Create Hyderabad Distribution Locations
  const locationsData = [
    {
      name: 'Gachibowli Flagship Outlet',
      code: 'LOC-01',
      type: 'Flagship Retail',
      address: 'Plot 22, Financial District, Gachibowli',
      city: 'Hyderabad',
      state: 'Telangana',
      contactPerson: 'Rahul Sharma',
      contactPhone: '+91 98490 12345',
      capacityUnits: 1800,
      minSafetyStock: 120
    },
    {
      name: 'Madhapur Distribution Hub',
      code: 'LOC-02',
      type: 'Regional Hub',
      address: 'Plot 88, Hitec City Main Rd, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      contactPerson: 'Priya Varma',
      contactPhone: '+91 98490 23456',
      capacityUnits: 3200,
      minSafetyStock: 250
    },
    {
      name: 'Kondapur Fresh Kiosk',
      code: 'LOC-03',
      type: 'Supermarket Kiosk',
      address: 'Botanical Garden Rd, Kondapur',
      city: 'Hyderabad',
      state: 'Telangana',
      contactPerson: 'Venkat Rao',
      contactPhone: '+91 98490 34567',
      capacityUnits: 950,
      minSafetyStock: 70
    },
    {
      name: 'Kukatpally Supermarket Outlet',
      code: 'LOC-04',
      type: 'Convenience Store',
      address: 'Road No 1, KPHB Colony Phase 3, Kukatpally',
      city: 'Hyderabad',
      state: 'Telangana',
      contactPerson: 'Ananya Reddy',
      contactPhone: '+91 98490 45678',
      capacityUnits: 1400,
      minSafetyStock: 90
    },
    {
      name: 'Secunderabad Wholesale Point',
      code: 'LOC-05',
      type: 'Wholesale Outlet',
      address: '15 Rashtrapati Road, Secunderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      contactPerson: 'Mohammed Farooq',
      contactPhone: '+91 98490 56789',
      capacityUnits: 2400,
      minSafetyStock: 180
    }
  ];

  const locations = await Location.insertMany(locationsData);
  console.log(`[Seed] Seeded ${locations.length} Hyderabad distribution locations.`);

  // 4. Generate 45 Days of Historical Daily Sales (INR 105 per pack)
  const salesToInsert = [];
  const now = new Date();
  const sellingPrice = 105.0; // INR

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
        notes: isWeekend ? 'Weekend retail dairy surge' : 'Daily dairy counter demand'
      });
    }
  }

  await SalesRecord.insertMany(salesToInsert);
  console.log(`[Seed] Seeded ${salesToInsert.length} historical daily sales records.`);

  // 5. Generate Supply Batches:
  // - Past batches that were supplied 36 days ago (25 units expired to reflect historical loss)
  // - Batches supplied 14 days ago with short expiry (imminent 4 days expiry risk)
  // - Fresh batches supplied recently (with 14 days of safe shelf life for fresh paneer)
  const unitCost = 75.0; // INR Wholesale Procurement Cost
  const batchesToInsert = [];
  let batchCounter = 100;

  for (const loc of locations) {
    const locSalesTotal = salesToInsert
      .filter(s => s.location.toString() === loc._id.toString())
      .reduce((sum, s) => sum + s.quantitySold, 0);

    // Batch 1: Supplied 36 days ago, expired 6 days ago.
    // Leaves exactly 25 units unpurchased that expired past shelf life (₹1,875 loss per location)
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
      supplierName: 'Apex Dairy Farms, Shamshabad',
      notes: 'Initial cycle batch - past shelf life (spoilage)',
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
      supplierName: 'Apex Dairy Farms, Shamshabad',
      notes: 'Mid-month supply - near-expiry warning window',
      status: 'active'
    });

    // Batch 3: Fresh certified paneer batch supplied 3 days ago, safe for 14 days
    // Provides fresh usable stock
    batchCounter++;
    const freshUnits = loc.code === 'LOC-03' ? 180 : (loc.code === 'LOC-01' ? 320 : 380);
    batchesToInsert.push({
      batchNumber: `BAT-2026-${batchCounter}`,
      location: loc._id,
      quantity: freshUnits,
      remainingQuantity: freshUnits,
      supplyDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      unitCost,
      supplierName: 'Apex Dairy Farms, Shamshabad',
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
