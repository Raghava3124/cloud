const express = require('express');
const Folder = require('../models/Folder');
const File = require('../models/File');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new folder
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, parentFolderId } = req.body;
        
        if (!name) return res.status(400).json({ error: 'Folder name is required' });

        const folder = new Folder({
            name,
            userEmail: req.user.email,
            parentFolderId: parentFolderId || null
        });

        await folder.save();
        res.status(201).json(folder);
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Server error creating folder' });
    }
});

// Get folders in a specific directory
router.get('/', authMiddleware, async (req, res) => {
    try {
        const parentFolderId = req.query.parentId || null;
        
        // Find folders for this user in the specified parent directory
        const query = { userEmail: req.user.email, parentFolderId };
        
        // Ensure null and "null" string are handled correctly
        if (parentFolderId === 'null' || !parentFolderId) {
            query.parentFolderId = null;
        }

        const folders = await Folder.find(query).sort({ name: 1 });
        res.json(folders);
    } catch (error) {
        console.error('Fetch folders error:', error);
        res.status(500).json({ error: 'Server error fetching folders' });
    }
});

// Delete a folder (and cascade delete or move files? We will just move files to recycle bin for simplicity if they are inside, or prevent delete if not empty)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const folder = await Folder.findOne({ _id: req.params.id, userEmail: req.user.email });
        if (!folder) return res.status(404).json({ error: 'Folder not found' });

        // Check if folder contains files or subfolders
        const subFolders = await Folder.countDocuments({ parentFolderId: folder._id });
        const files = await File.countDocuments({ folderId: folder._id, isDeleted: false });

        if (subFolders > 0 || files > 0) {
            return res.status(400).json({ error: 'Folder is not empty. Delete all contents first.' });
        }

        await Folder.deleteOne({ _id: folder._id });
        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ error: 'Server error deleting folder' });
    }
});

module.exports = router;
