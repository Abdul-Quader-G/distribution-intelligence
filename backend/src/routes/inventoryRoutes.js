const express = require('express');
const router = express.Router();
const { getInventorySummary, getLocationInventory } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getInventorySummary);
router.get('/location/:id', getLocationInventory);

module.exports = router;
