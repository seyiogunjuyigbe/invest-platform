const mongoose = require('mongoose');

const { Schema } = mongoose;
const notificationSchema = new Schema(
    {
        title: String,
        message: String,
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        isRead: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model('Notification', notificationSchema);
