const express = require('express');
const router = express.Router();
const {
  getAllProcurementRecommendations,
  recalculateLocationForecast,
  approveProcurementOrder
} = require('../controllers/procurementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAllProcurementRecommendations);
router.post('/recalculate/:locationId', recalculateLocationForecast);
router.post('/approve/:forecastId', approveProcurementOrder);

module.exports = router;
