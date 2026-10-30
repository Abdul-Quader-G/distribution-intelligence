const express = require('express');
const router = express.Router();
const { getSavingsAnalytics } = require('../controllers/savingsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSavingsAnalytics);

module.exports = router;
