const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/locationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAllLocations)
  .post(createLocation);

router.route('/:id')
  .get(getLocationById)
  .put(updateLocation)
  .delete(deleteLocation);

module.exports = router;
