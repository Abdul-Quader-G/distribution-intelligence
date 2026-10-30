const express = require('express');
const router = express.Router();
const {
  getAllSales,
  getSaleById,
  createSale,
  createBulkSales,
  updateSale,
  deleteSale
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllSales)
  .post(createSale);

router.post('/bulk', createBulkSales);

router.route('/:id')
  .get(getSaleById)
  .put(updateSale)
  .delete(deleteSale);

module.exports = router;
