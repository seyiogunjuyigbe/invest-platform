const mongoose = require('mongoose');

const { Schema } = mongoose;
const portfolioSchema = new Schema(
    {
        title: String,
        description: String,

    },
    { timestamps: true }
);
module.exports = mongoose.model('Portfolio', portfolioSchema);
