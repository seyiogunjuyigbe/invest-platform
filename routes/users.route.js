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
router.get('/:userId', isAuthenticated, UsersController.fetchUser);
router.put('/:userId', isAuthenticated, UsersController.updateUser);
router.delete(
  '/:userId',
  isAuthenticated,
  adminRoute({ type: 'superadmin' }),
  UsersController.deleteUser
);

module.exports = router;
