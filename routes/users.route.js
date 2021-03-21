const express = require('express');

const router = express.Router();
const UsersController = require('../controllers/users.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');
const upload = require('../middlewares/multer');

router.post('/', isAuthenticated, adminRoute(), UsersController.createUser);
router.post('/signup', UsersController.createUser);
router.get('/', isAuthenticated, adminRoute(), UsersController.listUsers);
router.get('/get-wallet', isAuthenticated, UsersController.getWallet);
router.get(
  '/get-wallet-histories',
  isAuthenticated,
  UsersController.getWalletHistories
);
router.post('/bvn', isAuthenticated, UsersController.verifyBvn);
router.get(
  '/verify-bvn',
  isAuthenticated,
  adminRoute(),
  UsersController.verifyUserBvnAsAdmin
);
router.get('/:userId', isAuthenticated, UsersController.fetchUser);
router.put(
  '/:userId',
  isAuthenticated,
  upload.single('avatar'),
  UsersController.updateUser
);
router.delete(
  '/:userId',
  isAuthenticated,
  adminRoute({ type: 'superadmin' }),
  UsersController.deleteUser
);

module.exports = router;
