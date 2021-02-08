const mongoose = require('mongoose');

const { Schema } = mongoose;
const verificationSchema = new Schema(
  {
    category: {
      type: String,
      enum: ['bvn', 'document'],
    },
    documentNumber: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    document: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
      default: 'pending',
    },
    actionBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model('Verification', verificationSchema);
