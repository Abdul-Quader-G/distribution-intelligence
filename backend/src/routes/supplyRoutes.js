const express = require('express');
const router = express.Router();
const {
  getAllSupplies,
  getSupplyById,
  createSupply,
  updateSupply,
  deleteSupply
} = require('../controllers/supplyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllSupplies)
  .post(createSupply);

router.route('/:id')
  .get(getSupplyById)
  .put(updateSupply)
  .delete(deleteSupply);

module.exports = router;
