const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const authMiddleware = require('../middleware/auth');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get GridFS bucket
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'notesFiles'
  });
});

// Upload note
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { department, semester, subject, tag } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File is required' });

    // Upload file to GridFS
    const readableStream = Readable.from(req.file.buffer);
    const uploadStream = gfsBucket.openUploadStream(req.file.originalname);
    readableStream.pipe(uploadStream)
      .on('error', (err) => res.status(500).json({ error: err.message }))
      .on('finish', async (file) => {
        // Save note metadata in MongoDB
        const note = new Note({
          department,
          semester,
          subject,
          tag,
          fileId: file._id,
          filename: file.filename,
          uploadedBy: req.user._id
        });
        await note.save();
        res.status(200).json({ message: 'Upload successful', note });
      });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get notes by subject
router.get('/subject/:subject', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ subject: req.params.subject })
      .populate('uploadedBy', 'name');
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// View/download note
router.get('/view/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const downloadStream = gfsBucket.openDownloadStream(note.fileId);
    res.set('Content-Disposition', `attachment; filename="${note.filename}"`);
    downloadStream.pipe(res).on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: 'Error reading file' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    // Delete file from GridFS
    gfsBucket.delete(note.fileId, async (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete file' });
      await note.deleteOne();
      res.json({ message: 'Note deleted successfully' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
