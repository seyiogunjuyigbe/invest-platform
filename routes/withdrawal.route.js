const express = require('express');

const router = express.Router();
const Transaction = require('../controllers/transactions.controller');
const isAuthenticated = require('../middlewares/is-authenticated');
const isInvestor = require('../middlewares/is-investor');
const hasFinanceAccess = require('../middlewares/has-finance-access');

router.post('/', isAuthenticated, isInvestor, Transaction.initiateWithdrawal);
router.get(
  '/:transactionId/process',
  isAuthenticated,
  hasFinanceAccess,
  Transaction.processWithdrawal
);
module.exports = router;
