const express = require('express');

const router = express.Router();
const WithdrawCtrl = require('../controllers/withdrawal.controller');
const isAuthenticated = require('../middlewares/is-authenticated');
const isAdmin = require('../middlewares/admin');

router.post('/', isAuthenticated, WithdrawCtrl.initiateWithdrawal);
router.get('/', isAuthenticated, WithdrawCtrl.fetchWithdrawalRequests);
router.get('/flw-callback/:transactionId', WithdrawCtrl.transactionCallback);
router.get(
  '/:transactionId',
  isAuthenticated,
  WithdrawCtrl.fetchWithdrawalRequest
);
router.get(
  '/:transactionId/process',
  isAuthenticated,
  isAdmin(),
  WithdrawCtrl.processWithdrawal
);
module.exports = router;
