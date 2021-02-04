const mongoose = require('mongoose');

const { Schema } = mongoose;
const portfolioSchema = new Schema(
    {
        title: { type: String, required: true },
        category: {
            type: String,
            enum: ['forex', 'real-estate', 'mutual-funds']
        },
        description: String,
        roi: Number,
        risk: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        startDate: Date,
        endDate: Date,
        minInvestment: Number,
        maxInvestment: Number,
        image: String,
        memorandum: String

    },
    { timestamps: true }
);
module.exports = mongoose.model('Portfolio', portfolioSchema);
