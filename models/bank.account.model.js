const mongoose = require('mongoose');

const { Schema } = mongoose;
const bankAccountSchema = new Schema(
  {
    accountName: String,
    accountNumber: String,
    bankName: String,
    bankCode: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankAccount', bankAccountSchema);
