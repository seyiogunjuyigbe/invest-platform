const mongoose = require('mongoose');

const { Schema } = mongoose;

const TransactionSchema = new Schema(
  {
    type: {
      type: String,
      default: 'deposit',
      enum: ['deposit', 'withdrawal', 'fund'],
    },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'successful', 'cancelled', 'failed', 'processing'],
    },
    reference: {
      type: String,
      required: true,
    },
    processor: {
      type: String,
      default: 'flutterwave',
    },
    processorReference: {
      type: String,
    },
    currency: {
      type: String,
      default: 'ngn',
    },
    paymentType: {
      type: String,
      default: 'card',
    },
    amount: {
      type: Number,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
    },
    sourceType: String,
    sourceId: String,
    destinationType: String,
    destinationId: String,
  },
  {
    timestamps: true,
  }
);
const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;

// const
