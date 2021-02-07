const mongoose = require('mongoose');

const { Schema } = mongoose;
const verificationSchema = new Schema(
  {
    title: String,
    type: {
      type: String,
      enum: ['bvn', 'document'],
    },
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
  },
  { timestamps: true }
);
module.exports = mongoose.model('Verification', verificationSchema);
