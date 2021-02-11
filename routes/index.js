const express = require('express');

const router = express.Router();

const UserRoutes = require('./users.route');
const AuthRoutes = require('./auth.route');
const WalletRoutes = require('./wallets.route');
const PortfolioRoutes = require('./portfolios.route');
const TransactionRoutes = require('./transactions.route');
const DocumentRoutes = require('./document.route');

router.use('/users', UserRoutes);
router.use('/auth', AuthRoutes);
router.use('/wallets', WalletRoutes);
router.use('/portfolios', PortfolioRoutes);
router.use('/transactions', TransactionRoutes);
router.use('/documents', DocumentRoutes);
module.exports = router;
