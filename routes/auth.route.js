const express = require('express');

const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/login', AuthController.login);
router.post('/change-password', isAuthenticated, AuthController.changePassword);

module.exports = router;
