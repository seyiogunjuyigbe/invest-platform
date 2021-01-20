const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    type: {
      type: String,
      default: 'investor',
      enum: ['investor', 'admin'],
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model('Account', userSchema);

module.exports = userModel;
