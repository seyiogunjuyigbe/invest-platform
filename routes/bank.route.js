const express = require('express');

const router = express.Router();
const BankCtrl = require('../controllers/bank-accounts.controller');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/', isAuthenticated, BankCtrl.addBankAccount);
router.get('/', isAuthenticated, BankCtrl.fetchAllAccounts);
router.get('/:bankId', isAuthenticated, BankCtrl.fetchBankAccount);
router.delete('/:bankId', isAuthenticated, BankCtrl.removeBankAccount);
router.get('/:bankId/set-default', isAuthenticated, BankCtrl.setDefaultAcct);
module.exports = router;
