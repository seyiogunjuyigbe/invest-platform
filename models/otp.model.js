const mongoose = require('mongoose');

const { Schema } = mongoose;
const otpSchema = new Schema(
  {
    otp: String,
    type: {
      type: String,
      enum: ['reset-password', 'verify-email'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expiry: Date,
    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Otp', otpSchema);
