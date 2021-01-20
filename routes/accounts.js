const express = require('express');

const router = express.Router();
const accounts = require('../controllers/accounts');
/* GET home page. */
router.get('/', accounts);

module.exports = router;
