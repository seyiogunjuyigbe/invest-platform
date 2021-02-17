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
  },
  { timestamps: true }
);
module.exports = mongoose.model('Portfolio', portfolioSchema);
