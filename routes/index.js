const express = require('express');

const router = express.Router();

const UserRoutes = require('./users.route');
const AuthRoutes = require('./auth.route');
const WalletRoutes = require('./wallets.route');
const PortfolioRoutes = require('./portfolios.route');
const TransactionRoutes = require('./transactions.route');
const DocumentRoutes = require('./document.route');
const BankRoutes = require('./bank.route');
const InvestmentRoutes = require('./investments.route');
const DashboardRoutes = require('./dashboard.route');
const WebhookRoutes = require('./webhook.route');
const NotificationRoutes = require('./notification.route');

router.use('/users', UserRoutes);
router.use('/auth', AuthRoutes);
router.use('/wallets', WalletRoutes);
router.use('/portfolios', PortfolioRoutes);
router.use('/transactions', TransactionRoutes);
router.use('/documents', DocumentRoutes);
router.use('/bank-accounts', BankRoutes);
router.use('/investments', InvestmentRoutes);
router.use('/dashboard', DashboardRoutes);
router.use('/hooks', WebhookRoutes);
router.use('/notifications', NotificationRoutes);
module.exports = router;
