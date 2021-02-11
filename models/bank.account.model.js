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
  },
  { timestamps: true }
);
bankAccountSchema.options.toJSON = {
  transform(doc, ret) {
    delete ret.bvn;
    return ret;
  },
};

module.exports = mongoose.model('BankAccount', bankAccountSchema);
