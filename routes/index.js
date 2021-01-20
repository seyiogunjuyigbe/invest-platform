const express = require('express');
const router = express.Router();

const UserRoutes = require('./users.route');

router.use('/user', UserRoutes);

module.exports = router;
