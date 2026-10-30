const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getDashboardOverview);

module.exports = router;
