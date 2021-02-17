const express = require('express');

const router = express.Router();
const InvestmentsController = require('../controllers/investments.controller');
const adminRoute = require('../middlewares/admin');
const hasFinanceAccess = require('../middlewares/has-finance-access');
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
router.post(
  '/:investmentId/fund',
  isAuthenticated,
  hasFinanceAccess,
  InvestmentsController.fundInvestment
);
router.post(
  '/:investmentId/credit-return',
  isAuthenticated,
  adminRoute(),
  InvestmentsController.creditInvestmentReturn
);
router.get('/', isAuthenticated, InvestmentsController.listInvestments);
router.get(
  '/:investmentId',
  isAuthenticated,
  InvestmentsController.fetchInvestment
);
router.get(
  '/:investmentId/list-returns',
  isAuthenticated,
  hasFinanceAccess,
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
