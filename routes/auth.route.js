const express = require('express');

const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const isAuthenticated = require('../middlewares/is-authenticated');

router.post('/login', AuthController.login);
router.post('/change-password', isAuthenticated, AuthController.changePassword);
router.get('/verify/:otp', AuthController.verifyEmail);
router.post("/recover-password", AuthController.requestPasswordReset)
router.post("/reset-password/:otp", AuthController.resetPassword)
router.post('/resend-verification', AuthController.resendVerificationToken);

module.exports = router;
