const mongoose = require('mongoose');

const { Schema } = mongoose;

const walletSchema = new Schema(
  {
    balance: {
      type: Number,
      default: 0.00,
    },
    previousBalance: {
      type: Number,
      default: 0.00,
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

module.exports = mongoose.model('Wallet', walletSchema);
