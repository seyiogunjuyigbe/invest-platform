const express = require('express');

const router = express.Router();
const TransactionsController = require('../controllers/transactions.controller');
const hasFinanceAccess = require('../middlewares/has-finance-access');
const isInvestor = require('../middlewares/is-investor');
const isAuthenticated = require('../middlewares/is-authenticated');
const isAdmin = require('../middlewares/admin');

router.get(
  '/',
  isAuthenticated,
  hasFinanceAccess,
  TransactionsController.fetchTransactions
);
router.get(
  '/:transactionId',
  isAuthenticated,
  hasFinanceAccess,
  TransactionsController.fetchTransaction
);
router.post(
  '/initiate',
  isAuthenticated,
  isInvestor,
  TransactionsController.initiateTransaction
);
router.post(
  '/:transactionId/verify',
  isAuthenticated,
  hasFinanceAccess,
  TransactionsController.verifyTransaction
);
router.post(
  '/withdraw',
  isAuthenticated,
  isInvestor,
  TransactionsController.initiateWithdrawal
);
router.get(
  '/:transactionId/process-withdrawal',
  isAuthenticated,
  isAdmin(),
  TransactionsController.processWithdrawal
);
module.exports = router;
