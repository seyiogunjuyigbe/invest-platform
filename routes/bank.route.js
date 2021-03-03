const express = require('express');

const router = express.Router();
const BankCtrl = require('../controllers/bank-accounts.controller');
const isAuthenticated = require('../middlewares/is-authenticated');
const isAdmin = require('../middlewares/admin');

router.post('/', isAuthenticated, BankCtrl.addBankAccount);
router.post('/add-multiple', isAuthenticated, BankCtrl.addMultipleBankAccounts);
router.get('/', isAuthenticated, BankCtrl.fetchAllAccounts);
router.get('/fetch-banks', isAuthenticated, BankCtrl.fetchBanks);
router.get('/:bankAccountId', isAuthenticated, BankCtrl.fetchBankAccount);
router.delete('/:bankAccountId', isAuthenticated, BankCtrl.removeBankAccount);
router.get(
  '/:bankAccountId/set-default',
  isAuthenticated,
  BankCtrl.setDefaultAcct
);
router.post(
  '/:bankAccountId/verify',
  isAuthenticated,
  isAdmin(),
  BankCtrl.verifyBankAccount
);
module.exports = router;
