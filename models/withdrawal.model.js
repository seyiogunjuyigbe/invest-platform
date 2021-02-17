const mongoose = require('mongoose');

const { Schema } = mongoose;
const withdrawalSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    bankAccount: {
      type: Schema.Types.ObjectId,
      ref: 'bankAccount',
    },
    ref: String,
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Withdrawal', withdrawalSchema);
