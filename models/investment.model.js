const mongoose = require('mongoose');
const createError = require('http-errors');

const Transaction = require('./transaction.model');
const Wallet = require('./wallet.model');
const { currCalc, createReference } = require('../utils/app');

const { Schema } = mongoose;
const investmentSchema = new Schema(
  {
    name: String,
    duration: { type: Number, required: true },
    liquidationDate: { type: Date, default: null },
    maturityDate: { type: Date, default: null },
    capital: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    totalFunded: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    isClosed: { type: Number, default: false },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    portfolio: {
      type: Schema.Types.ObjectId,
      ref: 'Portfolio',
    },
  },
  { timestamps: true }
);

investmentSchema.methods.credit = async function credit(amount) {
  const newBalance = currCalc(this.currentBalance, '+', amount);
  const newTotalFunded = currCalc(this.totalFunded, '+', amount);

  return this.updateOne({
    currentBalance: newBalance,
    totalFunded: newTotalFunded,
  });
};

investmentSchema.methods.debit = async function debit(amount) {
  const newBalance = currCalc(this.currentBalance, '-', amount);
  const newTotalPaidOut = currCalc(this.totalPaidOut, '+', amount);

  if (newBalance < 0) {
    throw createError('Insufficient investment balance');
  }

  return this.updateOne({
    currentBalance: newBalance,
    totalPaidOut: newTotalPaidOut,
  });
};

investmentSchema.methods.withdrawToWallet = async function withdrawToWallet(
  amount,
  type = 'withdrawal'
) {
  const newBalance = currCalc(this.currentBalance, '-', amount);
  const newTotalPaidOut = currCalc(this.totalPaidOut, '+', amount);

  if (newBalance < 0) {
    throw createError('Insufficient investment balance');
  }

  const wallet = await Wallet.findOne({ user: this.user });

  const transaction = await Transaction.create({
    amount,
    type,
    status: 'successful',
    reference: createReference(type),
    processor: 'wallet',
    paymentType: 'wallet',
    user: this.user,
    description: `${type} to wallet from investment(${this.id})`,
    sourceType: 'Investment',
    sourceId: this.id,
    destinationType: 'Wallet',
    destinationId: wallet.id,
  });

  await wallet.credit(transaction);

  return this.updateOne({
    currentBalance: newBalance,
    totalPaidOut: newTotalPaidOut,
  });
};

investmentSchema.methods.payout = async function payout() {
  await this.withdrawToWallet(this.currentBalance, 'payout');

  return this.updateOne({
    isClosed: true,
  });
};

module.exports = mongoose.model('Investment', investmentSchema);
