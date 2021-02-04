const mongoose = require('mongoose');
const createError = require('http-errors');

const { currCalc } = require('../utils/app');
const WalletHistory = require('./wallet.history.model');

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

walletSchema.methods.credit = async function credit(transaction) {
  const newBalance = currCalc(this.balance, '+', transaction.amount);

  await this.updateOne({
    balance: newBalance,
    previousBalance: this.balance,
  });

  return WalletHistory.create({
    amount: transaction.amount,
    type: 'credit',
    balance: newBalance,
    previousBalance: this.balance,
    transaction: transaction.id,
    description: `credit from transaction(${transaction.id})`,
    wallet: this.id,
    user: this.user,
  });
};

walletSchema.methods.debit = async function debit(transaction) {
  const newBalance = currCalc(this.balance, '-', transaction.amount);

  if (newBalance < 0) {
    throw createError('Insufficient balance');
  }

  await this.updateOne({
    balance: newBalance,
    previousBalance: this.balance,
  });

  return WalletHistory.create({
    amount: transaction.amount,
    type: 'debit',
    balance: newBalance,
    previousBalance: this.balance,
    transaction: transaction.id,
    description: `debit from transaction(${transaction.id})`,
    wallet: this.id,
    user: this.user,
  });
};

module.exports = mongoose.model('Wallet', walletSchema);
