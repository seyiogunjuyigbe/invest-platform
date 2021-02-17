const mongoose = require('mongoose');

const { Schema } = mongoose;
const investmentReturnSchema = new Schema(
  {
    amount: { type: Number, required: true },
    capital: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    capitalGains: { type: Number, default: 0 },
    previousBalance: { type: Number, default: 0 },
    totalFunded: { type: Number, default: 0 },
    totalPaidOut: { type: Number, default: 0 },
    creditedBy: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    investment: {
      type: Schema.Types.ObjectId,
      ref: 'Investment',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InvestmentReturn', investmentReturnSchema);
