const Wallet = require('../models/wallet.model');
const WalletHistory = require('../models/wallet.history.model');
const { findOne, find } = require('../utils/query');

class WalletsController {
  static async fetchWallet(req, res, next) {
    try {
      const wallet = req.user.type === 'superadmin'
        ? await findOne(Wallet, req)
        : await req.user.getWallet();

      return res.status(200).json({
        message: 'wallet retrieved successfully',
        data: wallet,
      })
    } catch (error) {
      next(error);
    }
  }

  static async fetchWalletHistories(req, res, next) {
    try {
      const conditions = req.user.type === 'superadmin'
        ? { wallet: req.params.walletId }
        : { user: req.user.id };

      const histories = await find(WalletHistory, req, conditions);

      return res.status(200).json({
        message: 'wallet histories retrieved successfully',
        data: histories,
      })
    } catch (error) {
      next(error);
    }
  }

  static async listWallets(req, res, next) {
    try {
      const wallets = await find(Wallet, req);

      return res.status(200).json({
        message: 'wallets retrieved successfully',
        data: wallets,
      })
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WalletsController;
