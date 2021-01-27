const express = require('express');

const router = express.Router();
const UsersController = require('../controllers/users.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/', isAuthenticated, adminRoute(), UsersController.createUser);
router.post('/signup', UsersController.createUser);
router.get('/', isAuthenticated, adminRoute(), UsersController.listUsers);
router.get('/:userId', isAuthenticated, UsersController.fetchUser);
router.get('/get-wallet', isAuthenticated, UsersController.getWallet);
router.put('/:userId', isAuthenticated, UsersController.updateUser);
router.delete(
  '/:userId',
  isAuthenticated,
  adminRoute({ type: 'superadmin' }),
  UsersController.updateUser,
);

module.exports = router;
