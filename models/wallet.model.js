const mongoose = require('mongoose');
const createError = require('http-errors');

const {
  currCalc,
  createReference,
  formatAmountToCurrency,
} = require('../utils/app');
const WalletHistory = require('./wallet.history.model');
const Transaction = require('./transaction.model');
const {
  sendPushNotification,
  createNotification,
} = require('../services/notification.service');

const { Schema } = mongoose;

const walletSchema = new Schema(
  {
    balance: {
      type: Number,
      default: 0.0,
    },
    previousBalance: {
      type: Number,
      default: 0.0,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

walletSchema.methods.canWithdraw = async function canWithdraw(amount) {
  return this.balance >= amount;
};

walletSchema.methods.fundInvestment = async function fundInvestment(
  investment,
  amount
) {
  const hasEnoughBalance = this.canWithdraw(amount);
  if (!hasEnoughBalance) {
    throw createError(422, 'insufficient wallet balance');
  }

  const transaction = await Transaction.create({
    amount,
    type: 'fund',
    status: 'successful',
    reference: createReference('fund'),
    processor: 'wallet',
    paymentType: 'wallet',
    user: investment.user,
    description: `fund for investment(${investment.id})`,
    sourceType: 'Wallet',
    sourceId: this.id,
    destinationType: 'Investment',
    destinationId: investment.id,
    portfolio: investment.portfolio,
    investment: investment.id,
  });

  await this.debit(transaction);

  // eslint-disable-next-line
  const User = require('./user.model');

  const user =
    investment.user && investment.user.name
      ? investment.user
      : await User.findById(investment.user);

  user.portfolios.addToSet(investment.portfolio);

  await user.save();

  return investment.credit(amount);
};

walletSchema.methods.credit = async function credit(transaction) {
  const newBalance = currCalc(this.balance, '+', transaction.amount);

  await this.updateOne({
    balance: newBalance,
    previousBalance: this.balance,
  });
  const walletHistory = await WalletHistory.create({
    amount: transaction.amount,
    type: 'credit',
    balance: newBalance,
    previousBalance: this.balance,
    transaction: transaction.id,
    description: `credit from transaction(${transaction.id})`,
    wallet: this.id,
    user: this.user,
  });
  if (transaction.type === 'deposit' && this.user.fundWalletAlert) {
    const title = 'Wallet Credit';
    const message = `${formatAmountToCurrency(
      transaction.amount
    )} was credited to your wallet`;
    await createNotification([this.user], title, message, true);
    await sendPushNotification([this.user._id], title, message);
  }

  return walletHistory;
};

walletSchema.methods.debit = async function debit(transaction) {
  const newBalance = currCalc(this.balance, '-', transaction.amount);

  if (newBalance < 0) {
    throw createError(422, 'insufficient wallet balance');
  }

  await this.updateOne({
    balance: newBalance,
    previousBalance: this.balance,
  });
  const walletHistory = await WalletHistory.create({
    amount: transaction.amount,
    type: 'debit',
    balance: newBalance,
    previousBalance: this.balance,
    transaction: transaction.id,
    description: `debit from transaction(${transaction.id})`,
    wallet: this.id,
    user: this.user,
  });
  if (transaction.type === 'withdrawal' && this.user.withdrawalAlert) {
    const title = 'Wallet Debit';
    const message = `${formatAmountToCurrency(
      transaction.amount
    )} was debited from your wallet`;
    await createNotification([this.user], title, message, true);
    await sendPushNotification([this.user._id], title, message);
  }
  return walletHistory;
};

module.exports = mongoose.model('Wallet', walletSchema);
