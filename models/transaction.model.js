const mongoose = require('mongoose');

const Flutterwave = require('../services/flutterwave.service');
const User = require('./user.model');

const flutterwave = Flutterwave.getInstance();

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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
    },
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
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

TransactionSchema.methods.verify = async function verify() {
  const payment = await flutterwave.verifyTransaction(this);

  if (payment && payment.success) {
    await this.updateOne({
      status: 'successful',
      paymentType: payment.tnx && payment.tnx.payment_type,
    });
  } else {
    await this.updateOne({
      status: 'failed',
    });
  }

  return payment && payment.success;
};

TransactionSchema.methods.processPayment = async function processPayment() {
  switch (this.type) {
    case 'deposit':
      // eslint-disable-next-line
      const isSuccessful = await this.verify();

      if (isSuccessful) {
        const user =
          this.user && this.user.name
            ? this.user
            : await User.findById(this.user);
        const wallet = await user.getWallet();
        await wallet.credit(this);

        await this.updateOne({
          sourceType: 'Transaction',
          sourceId: this.id,
          destinationType: 'Wallet',
          destinationId: wallet.id,
        });
      }

      return isSuccessful;

    default:
      break;
  }
};

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
