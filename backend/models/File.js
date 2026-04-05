const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    telegramFileId: {
        type: String,
        required: true
    },
    telegramMessageId: {
        type: Number,
        required: false
    },
    userEmail: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
});

// Create a TTL index that applies ONLY to documents where deletedAt is set.
// 2592000 seconds = 30 days
fileSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('File', fileSchema);
