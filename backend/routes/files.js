const express = require('express');
const multer = require('multer');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const os = require('os');
const path = require('path');
const File = require('../models/File');
const authMiddleware = require('../middleware/authMiddleware');
const bigInt = require('big-integer');

const router = express.Router();

// A global map to hold upload progress percentages. Maps uploadId -> percentage
const uploadProgressMap = new Map();

// Use disk storage instead of memory to support files up to 2GB without crashing the server
const uploadDest = path.join(os.tmpdir(), 'telecloud-uploads');
if (!fs.existsSync(uploadDest)) {
    fs.mkdirSync(uploadDest, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

let client;
const getClient = async () => {
    if (!client) {
        const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
        const apiHash = process.env.TELEGRAM_API_HASH;
        
        if (!apiId || !apiHash || apiId.toString() === 'NaN') {
             console.error("TELEGRAM_API_ID or TELEGRAM_API_HASH is missing or invalid in .env");
             return null;
        }

        try {
            client = new TelegramClient(new StringSession(''), apiId, apiHash, {
                connectionRetries: 5,
            });
            await client.start({
                botAuthToken: process.env.TELEGRAM_BOT_TOKEN,
            });
            console.log("MTProto Telegram Client Connected!");
        } catch (err) {
            console.error('Error initializing Telegram MTProto Client:', err);
            client = null;
        }
    }
    return client;
};

// Connect client asynchronously when the file loads so it's ready quicker
getClient();

// --- SSE Progress Endpoint ---
router.get('/progress/:uploadId', (req, res) => {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const uploadId = req.params.uploadId;
    
    // Periodically check map and send updates
    const interval = setInterval(() => {
        let currentProgress = uploadProgressMap.get(uploadId);
        
        if (currentProgress !== undefined) {
             res.write(`data: ${JSON.stringify({ status: 'uploading', progress: currentProgress })}\n\n`);
             
             // If marked 100, we consider it done via the map.
             // We won't close instantly so the frontend catches the 100 ping. 
             // But we clean the map later in the file upload route.
        } else {
             // Either it completed, or hasn't started yet.
             res.write(`data: ${JSON.stringify({ status: 'waiting' })}\n\n`);
        }
    }, 500); // 500ms for smooth real-time progress update

    req.on('close', () => {
        clearInterval(interval);
    });
});
// -----------------------------

// Upload a file
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        uploadedFilePath = req.file.path;
        const uploadId = req.body.uploadId; // Sent from frontend Dashboard
        
        if (uploadId) {
            uploadProgressMap.set(uploadId, 0); // Initialize progress tracking
        }

        const caption = `Uploaded by: ${req.user.email} (#${req.user.email})`;

        const currentClient = await getClient();
        if (!process.env.TELEGRAM_CHAT_ID || !currentClient) {
            if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
            return res.status(500).json({ error: 'Telegram bot not configured yet.' });
        }

        const chatId = Number(process.env.TELEGRAM_CHAT_ID);

        // Upload using MTProto
        const msg = await currentClient.sendFile(chatId, {
            file: uploadedFilePath,
            caption: caption,
            forceDocument: true, // Prevents media compression
            workers: 16,          // <--- Massively Speeds up large uploads by creating 16 parallel streams!
            progressCallback: (progOrUpload, total) => {
                if (!uploadId) return;
                let percentage = 0;
                if (total === undefined) {
                    const progressFloat = Number(progOrUpload);
                    percentage = progressFloat <= 1 && progressFloat >= 0 ? Math.floor(progressFloat * 100) : Math.floor(progressFloat);
                } else if (total.toString() !== '0') {
                    const up = Number(progOrUpload.toString());
                    const tot = Number(total.toString());
                    if (tot > 0) percentage = Math.floor((up / tot) * 100);
                }
                uploadProgressMap.set(uploadId, percentage);
            }
        });

        // Ensure 100% hits listeners before cleanup
        if (uploadId) {
            uploadProgressMap.set(uploadId, 100);
        }

        // Cleanup temporary disk file
        if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);

        const newFile = new File({
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            telegramFileId: msg.id.toString(), 
            telegramMessageId: msg.id,         
            userEmail: req.user.email
        });

        await newFile.save();

        // Clear tracking from RAM afterwards
        if (uploadId) {
            setTimeout(() => uploadProgressMap.delete(uploadId), 3000); 
        }

        res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (error) {
        console.error('Upload error:', error);
        if (req.body.uploadId) {
            uploadProgressMap.delete(req.body.uploadId);
        }
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
        res.status(500).json({ error: 'Server error during file upload', details: error.message });
    }
});

// Get user's active files
router.get('/', authMiddleware, async (req, res) => {
    try {
        const files = await File.find({ userEmail: req.user.email, isDeleted: false }).sort({ uploadDate: -1 });
        res.json(files);
    } catch (error) {
        console.error('Fetch files error:', error);
        res.status(500).json({ error: 'Server error fetching files' });
    }
});

// Get user's trashed files
router.get('/trashed', authMiddleware, async (req, res) => {
    try {
        const files = await File.find({ userEmail: req.user.email, isDeleted: true }).sort({ deletedAt: -1 });
        res.json(files);
    } catch (error) {
        console.error('Fetch trashed files error:', error);
        res.status(500).json({ error: 'Server error fetching trashed files' });
    }
});

// Get total storage used by user (active + trashed)
router.get('/storage', authMiddleware, async (req, res) => {
    try {
        const storageData = await File.aggregate([
            { $match: { userEmail: req.user.email } },
            { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } }
        ]);

        const totalBytes = storageData.length > 0 ? storageData[0].totalBytes : 0;
        res.json({ totalBytes });
    } catch (error) {
        console.error('Fetch storage error:', error);
        res.status(500).json({ error: 'Server error fetching storage' });
    }
});

// Soft delete file (Move to recycle bin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOneAndUpdate(
            { _id: req.params.id, userEmail: req.user.email },
            { isDeleted: true, deletedAt: Date.now() },
            { new: true }
        );

        if (!file) return res.status(404).json({ error: 'File not found or unauthorized' });

        if (file.telegramMessageId && process.env.TELEGRAM_CHAT_ID) {
            const currentClient = await getClient();
            if (currentClient) {
                const newCaption = `Uploaded by: ${file.userEmail} (#${file.userEmail})\n\n[🗑️ MOVED TO RECYCLE BIN]`;
                try {
                    await currentClient.editMessage(Number(process.env.TELEGRAM_CHAT_ID), {
                        message: file.telegramMessageId,
                        text: newCaption
                    });
                } catch (botErr) {
                    console.error('Failed to edit telegram caption on delete:', botErr.message);
                }
            }
        }

        res.json({ message: 'File moved to recycle bin', file });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Server error deleting file' });
    }
});

// Restore soft-deleted file
router.put('/restore/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOneAndUpdate(
            { _id: req.params.id, userEmail: req.user.email },
            { isDeleted: false, deletedAt: null },
            { new: true }
        );

        if (!file) return res.status(404).json({ error: 'File not found or unauthorized' });

        if (file.telegramMessageId && process.env.TELEGRAM_CHAT_ID) {
            const currentClient = await getClient();
            if (currentClient) {
                const originalCaption = `Uploaded by: ${file.userEmail} (#${file.userEmail})\n\n[✅ RESTORED]`;
                try {
                    await currentClient.editMessage(Number(process.env.TELEGRAM_CHAT_ID), {
                        message: file.telegramMessageId,
                        text: originalCaption
                    });
                } catch (botErr) {
                    console.error('Failed to edit telegram caption on restore:', botErr.message);
                }
            }
        }

        res.json({ message: 'File restored successfully', file });
    } catch (error) {
        console.error('Restore file error:', error);
        res.status(500).json({ error: 'Server error restoring file' });
    }
});

// Permanent delete file (Hard Delete)
router.delete('/permanent/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOneAndDelete({ _id: req.params.id, userEmail: req.user.email });
        if (!file) return res.status(404).json({ error: 'File not found or unauthorized' });

        if (file.telegramMessageId && process.env.TELEGRAM_CHAT_ID) {
            const currentClient = await getClient();
            if (currentClient) {
                const newCaption = `Uploaded by: ${file.userEmail} (#${file.userEmail})\n\n[❌ DELETED PERMANENTLY]`;
                try {
                    await currentClient.editMessage(Number(process.env.TELEGRAM_CHAT_ID), {
                        message: file.telegramMessageId,
                        text: newCaption
                    });
                } catch (botErr) {
                    console.error('Failed to edit telegram caption on permanent delete:', botErr.message);
                }
            }
        }

        res.json({ message: 'File permanently deleted' });
    } catch (error) {
        console.error('Permanent delete file error:', error);
        res.status(500).json({ error: 'Server error permanently deleting file' });
    }
});

// Download/Stream a file directly via MTProto
router.get('/download/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });

        const currentClient = await getClient();
        if (!currentClient || !process.env.TELEGRAM_CHAT_ID) {
            return res.status(500).json({ error: 'Telegram MTProto client not configured yet.' });
        }

        const chatId = Number(process.env.TELEGRAM_CHAT_ID);
        
        const messages = await currentClient.getMessages(chatId, {
            ids: [file.telegramMessageId]
        });

        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).json({ error: 'Media not found in Telegram' });
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        res.setHeader('Content-Type', file.fileType);

        const iter = currentClient.iterDownload({
            file: messages[0].media,
            requestSize: 1024 * 1024,
        });

        for await (const chunk of iter) {
            res.write(chunk);
        }
        res.end();
    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Server error during file download' });
        } else {
            res.end(); 
        }
    }
});

// Stream a file via HTTP 206 Partial Content (Ideal for Video/Audio buffering)
router.get('/stream/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });

        const currentClient = await getClient();
        if (!currentClient || !process.env.TELEGRAM_CHAT_ID) {
            return res.status(500).json({ error: 'Telegram MTProto client not configured.' });
        }

        const messages = await currentClient.getMessages(Number(process.env.TELEGRAM_CHAT_ID), {
            ids: [file.telegramMessageId]
        });

        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).json({ error: 'Media not found in Telegram' });
        }

        const range = req.headers.range;
        const fileSize = file.fileSize;

        if (!range) {
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Content-Type', file.fileType);
            res.status(200);
            const iter = currentClient.iterDownload({
                file: messages[0].media,
                requestSize: 1024 * 1024,
            });
            for await (const chunk of iter) res.write(chunk);
            return res.end();
        }

        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        res.setHeader('Content-Type', file.fileType);

        // Tell MTProto exactly which byte boundary to start downloading from 
        const iter = currentClient.iterDownload({
            file: messages[0].media,
            offset: bigInt(start),
            requestSize: 1024 * 512, // 512kb chunks for smoother video buffering
        });

        let pumpedBytes = 0;
        for await (const chunk of iter) {
             if (pumpedBytes + chunk.length > chunksize) {
                  const overflow = chunksize - pumpedBytes;
                  res.write(chunk.slice(0, overflow));
                  break; // we reached the exact byte the browser requested
             } else {
                  res.write(chunk);
                  pumpedBytes += chunk.length;
             }
        }
        res.end();
    } catch (error) {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Server error during file streaming' });
        } else {
            res.end(); 
        }
    }
});

// Extract text from Office Documents via HTTP
router.get('/preview-text/:id', async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });

        const currentClient = await getClient();
        if (!currentClient || !process.env.TELEGRAM_CHAT_ID) {
            return res.status(500).json({ error: 'Telegram MTProto client not configured yet.' });
        }

        const chatId = Number(process.env.TELEGRAM_CHAT_ID);
        
        const messages = await currentClient.getMessages(chatId, {
            ids: [file.telegramMessageId]
        });

        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).json({ error: 'Media not found in Telegram' });
        }

        const buffer = await currentClient.downloadMedia(messages[0].media, {
            workers: 1,
        });

        const op = require('officeparser');
        try {
            const text = await op.parseOffice(buffer);
            res.json({ text: text });
        } catch (parseError) {
            console.error('OfficeParser error:', parseError);
            res.status(500).json({ error: 'Failed to extract text from document.' });
        }
    } catch (error) {
        console.error('Text extraction error:', error);
        res.status(500).json({ error: 'Server error during text extraction' });
    }
});

module.exports = router;
