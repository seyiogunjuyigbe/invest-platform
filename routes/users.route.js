const express = require('express');

const router = express.Router();
const UsersController = require('../controllers/users.controller');
const adminRoute = require('../middlewares/admin');

router.post('/', adminRoute(), UsersController.createUser);
router.post('/signup', UsersController.createUser);
router.get('/', adminRoute(), UsersController.listUsers);
router.get('/:userId', UsersController.fetchUser);
router.put('/:userId', UsersController.updateUser);
router.delete(
  '/:userId',
  adminRoute({ type: 'superadmin' }),
  UsersController.updateUser,
);

module.exports = router;
