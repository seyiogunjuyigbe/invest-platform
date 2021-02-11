const express = require('express');

const router = express.Router();
const BankCtrl = require('../controllers/bank-accounts.controller');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/', isAuthenticated, BankCtrl.addBankAccount);
router.get('/', isAuthenticated, BankCtrl.fetchAllAccounts);
router.get('/:bankAccountId', isAuthenticated, BankCtrl.fetchBankAccount);
router.delete('/:bankAccountId', isAuthenticated, BankCtrl.removeBankAccount);
router.get(
  '/:bankAccountId/set-default',
  isAuthenticated,
  BankCtrl.setDefaultAcct
);
module.exports = router;
