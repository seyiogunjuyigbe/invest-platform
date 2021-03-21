const mongoose = require('mongoose');

const { Schema } = mongoose;
const portfolioSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['forex', 'real-estate', 'mutual-funds'],
    },
    disbursementType: {
      type: String,
      enum: ['monthly', 'maturity'],
    },
    description: String,
    roi: { type: Number, required: true },
    duration: { type: Number, required: true },
    risk: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
    },
    startDate: Date,
    endDate: Date,
    minInvestment: Number,
    maxInvestment: Number,
    image: String,
    memorandum: String,
    localPath: String,
  },
  { timestamps: true }
);

portfolioSchema.methods.getInvestorCount = async function getInvestorCount() {
  // eslint-disable-next-line
  const User = require('./user.model');

  return User.countDocuments({
    type: 'investor',
    portfolios: this.id,
  });
};
module.exports = mongoose.model('Portfolio', portfolioSchema);
