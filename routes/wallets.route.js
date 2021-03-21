const express = require('express');

const router = express.Router();
const WalletsController = require('../controllers/wallets.controller');
const adminRoute = require('../middlewares/admin');
const isAuthenticated = require('../middlewares/is-authenticated');

router.get('/', isAuthenticated, adminRoute(), WalletsController.listWallets);
router.get('/:walletId', isAuthenticated, WalletsController.fetchWallet);
router.get(
  '/:walletId/histories',
  isAuthenticated,
  WalletsController.fetchWalletHistories
);

module.exports = router;
