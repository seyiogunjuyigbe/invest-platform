const express = require('express');

const router = express.Router();
const InvestmentsController = require('../controllers/investments.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post(
  '/',
  adminRoute(),
  isAuthenticated,
  InvestmentsController.createInvestment
);
router.post(
  '/create-and-fund',
  isAuthenticated,
  InvestmentsController.createAndFundInvestment
);
router.post('/fund', isAuthenticated, InvestmentsController.fundInvestment);
router.get('/', isAuthenticated, InvestmentsController.listInvestments);
router.get(
  '/:investmentId',
  isAuthenticated,
  InvestmentsController.fetchInvestment
);
router.put(
  '/:investmentId',
  isAuthenticated,
  InvestmentsController.updateInvestment
);
router.delete(
  '/:investmentId',
  isAuthenticated,
  adminRoute({ type: 'superadmin' }),
  InvestmentsController.deleteInvestment
);

module.exports = router;
