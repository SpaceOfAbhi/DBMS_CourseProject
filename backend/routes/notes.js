// backend/routes/notes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Note = require('../models/Note');
const authMiddleware = require('../middleware/auth'); // Make sure you have this

// 1️⃣ Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// 2️⃣ Upload note
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { department, semester, subject, tag } = req.body;

    if (!req.file) return res.status(400).json({ error: 'File is required' });

    const note = new Note({
      department,
      semester,
      subject,
      tag,
      filePath: req.file.path,
      uploadedBy: req.user._id
    });

    await note.save();
    res.status(200).json({ message: 'Upload successful', note });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Get notes by subject
router.get('/subject/:subject', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ subject: req.params.subject });

    const notesWithUrl = notes.map(note => ({
      ...note._doc,
      fileUrl: `${req.protocol}://${req.get('host')}/${note.filePath.replace(/\\/g,'/')}`
    }));

    res.json(notesWithUrl);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// 4️⃣ Delete note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // ✅ Handle notes without uploader field
    if (note.uploadedBy && note.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete file from uploads folder
    if (note.filePath) {
      const filePath = path.join(__dirname, '..', note.filePath);
      fs.unlink(filePath, err => {
        if (err) console.error('File deletion error:', err);
      });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
