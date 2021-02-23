const mongoose = require('mongoose');
const m = require('moment');
const createError = require('http-errors');

const Transaction = require('./transaction.model');
const Portfolio = require('./portfolio.model');
const InvestmentReturn = require('./investment.return.model');
const Wallet = require('./wallet.model');
const { currCalc, createReference } = require('../utils/app');

const { Schema } = mongoose;
const investmentSchema = new Schema(
  {
    name: String,
    liquidationDate: { type: Date, default: null },
    maturityDate: { type: Date, default: null },
    lastReturnDate: { type: Date, default: null },
    nextReturnDate: { type: Date, default: null },
    capital: { type: Number, default: 0 },
    capitalGains: { type: Number, default: 0 },
    returnsPayable: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    totalFunded: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    isClosed: { type: Boolean, default: false },
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

investmentSchema.pre('save', async function setReturnsPayableAndMaturity(next) {
  if (!this.isNew) return next();

  const portfolio = await Portfolio.findById(this.portfolio);

  if (!portfolio) return next();

  this.returnsPayable = currCalc(
    currCalc(portfolio.roi, '/', 100),
    '*',
    this.capital
  );

  this.maturityDate = m
    .utc()
    .add(portfolio.duration, 'months')
    .add(1, 'day')
    .startOf('day')
    .toDate();

  this.nextReturnDate =
    portfolio.disbursementType === 'monthly'
      ? m.utc().add(1, 'month').startOf('day').toDate()
      : m.utc().add(portfolio.duration, 'months').add(1, 'day').toDate();

  return next();
});

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
    liquidationDate: m.utc().toDate(),
  });
};

investmentSchema.methods.getCurrentReturnsDue = async function getCurrentReturnsDue() {
  const portfolio =
    this.portfolio && this.portfolio.title
      ? this.portfolio
      : await Portfolio.findById(this.portfolio);

  if (!portfolio) return;

  const monthsPerformed = m.utc().diff(m.utc(this.createdAt), 'months');
  const unitRoi = currCalc(
    currCalc(portfolio.roi, '/', 100),
    '/',
    portfolio.duration
  );
  const roiDue = currCalc(monthsPerformed, '*', unitRoi);
  console.log({ monthsPerformed, unitRoi, roiDue });

  return Math.min(currCalc(this.capital, '*', roiDue), this.returnsPayable);
};

investmentSchema.methods.creditReturn = async function creditReturn(
  amount,
  creditedBy = 'system'
) {
  if (amount <= 0) return;

  const newBalance = currCalc(this.currentBalance, '+', amount);
  const newCapitalGains = currCalc(this.capitalGains, '+', amount);

  await this.updateOne({
    currentBalance: newBalance,
    capitalGains: newCapitalGains,
  });

  const invReturn = await InvestmentReturn.create({
    amount,
    creditedBy,
    currentBalance: newBalance,
    capitalGains: newCapitalGains,
    totalFunded: this.totalFunded,
    totalPaidOut: this.totalPaidOut,
    capital: this.capital,
    previousBalance: this.currentBalance,
    investment: this.id,
    user: this.user,
  });

  return Transaction.create({
    amount,
    type: 'return',
    status: 'successful',
    reference: createReference('return'),
    processor: 'system',
    paymentType: 'return',
    user: this.user,
    description: `Return for investment(${this.id})`,
    sourceType: 'InvestmentReturn',
    sourceId: invReturn.id,
    destinationType: 'Investment',
    destinationId: this.id,
  });
};

module.exports = mongoose.model('Investment', investmentSchema);
