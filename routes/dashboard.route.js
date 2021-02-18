const express = require('express');

const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');

router.get(
  '/investment-data',
  isAuthenticated,
  adminRoute(),
  DashboardController.getInvestmentsData
);

module.exports = router;
