const express = require('express');

const router = express.Router();
const WithdrawCtrl = require('../controllers/withdrawal.controller');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/', isAuthenticated, WithdrawCtrl.initiateWithdrawal);
router.get('/', isAuthenticated, WithdrawCtrl.fetchWithdrawalequests);
router.get('/flw-callback/:transactionId', WithdrawCtrl.transactionCallback);
router.get(
  '/:transactionId',
  isAuthenticated,
  WithdrawCtrl.fetchWithdrawalequest
);
module.exports = router;
