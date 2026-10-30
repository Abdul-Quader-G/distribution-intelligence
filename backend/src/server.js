const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const seedDatabase = require('./seeds/seedData');
const User = require('./models/User');

// Import routes
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const supplyRoutes = require('./routes/supplyRoutes');
const salesRoutes = require('./routes/salesRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const savingsRoutes = require('./routes/savingsRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Distribution Intelligence API',
    version: '1.0.0'
  });
});

// Demo Data Reset Endpoint (Ideal for live presentations)
app.post('/api/seed/reset', async (req, res, next) => {
  try {
    await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Demo dataset successfully refreshed and re-synchronized!'
    });
  } catch (err) {
    next(err);
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/supplies', supplyRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/savings', savingsRoutes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
connectDB()
  .then(async () => {
    // Check if initial seed is needed
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding realistic business records...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Distribution Intelligence API running on port ${PORT}`);
      console.log(`📍 Endpoint: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Demo Login: admin@distribintel.com / admin123`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('Fatal: Failed to connect to database', err);
    process.exit(1);
  });

module.exports = app;
