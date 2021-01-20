const express = require('express');
const router = express.Router();

const UserRoutes = require('./users.route');
const AuthRoutes = require('./auth.route');

router.use('/user', UserRoutes);
router.use('/auth', AuthRoutes);

module.exports = router;
