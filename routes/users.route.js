const express = require('express');

const router = express.Router();
const UsersController = require('../controllers/users.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/', isAuthenticated, adminRoute(), UsersController.createUser);
router.post('/signup', UsersController.createUser);
router.get('/', isAuthenticated, adminRoute(), UsersController.listUsers);
router.get('/get-wallet', isAuthenticated, UsersController.getWallet);
router.get(
  '/get-wallet-histories',
  isAuthenticated,
  UsersController.getWalletHistories
);
router.post('/bank-accounts', isAuthenticated, UsersController.addBankAccount);
router.get('/bank-accounts', isAuthenticated, UsersController.fetchAllAccounts);
router.get(
  '/bank-accounts/:bankId',
  isAuthenticated,
  UsersController.fetchBankAccount
);
router.delete(
  '/bank-accounts/:bankId',
  isAuthenticated,
  UsersController.removeBankAccount
);
router.get(
  '/bank-accounts/:bankId/set-default',
  isAuthenticated,
  UsersController.setDefaultAcct
);
router.post('/bvn', isAuthenticated, UsersController.verifyBvn);
router.get(
  '/verify-bvn',
  isAuthenticated,
  adminRoute(),
  UsersController.verifyUserBvnAsAdmin
);
router.get('/:userId', isAuthenticated, UsersController.fetchUser);
router.put('/:userId', isAuthenticated, UsersController.updateUser);
router.delete(
  '/:userId',
  isAuthenticated,
  adminRoute({ type: 'superadmin' }),
  UsersController.updateUser
);

module.exports = router;
