const mongoose = require('mongoose');

const { Schema } = mongoose;
const documentSchema = new Schema(
  {
    documentNumber: String,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    documentUrl: String,
    status: {
      type: String,
      enum: ['pending', 'verified', 'declined'],
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
module.exports = mongoose.model('Document', documentSchema);
