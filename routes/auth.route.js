const express = require('express');

const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/login', AuthController.login);
router.post('/change-password', isAuthenticated, AuthController.changePassword);
router.get('/verify/:otp', AuthController.verifyEmail);
router.get('/recover-password', AuthController.requestPasswordReset);
router.post('/reset-password/:otp', AuthController.resetPassword);
router.get('/resend-verification', AuthController.resendVerificationToken);
router.get('/profile', isAuthenticated, AuthController.fetchProfile);

module.exports = router;
