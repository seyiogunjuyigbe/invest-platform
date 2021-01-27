const mongoose = require('mongoose');

const { Schema } = mongoose;

const walletHistorySchema = new Schema(
  {
    balance: Number,
    previousBalance: Number,
    amount: Number,
    type: {
      type: String,
      enum: ['credit', 'debit'],
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    description: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WalletHistory', walletHistorySchema);
