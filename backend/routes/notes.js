const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const Note = require('../models/Note');
const authMiddleware = require('../middleware/auth');

// 🧠 Multer setup — temporarily store files before upload
const upload = multer({ dest: 'uploads/' });

// ☁️ Cloudinary configuration (from your .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📤 Upload note
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { department, semester, subject, tag } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File is required' });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'notes_uploads',
      resource_type: 'auto', // supports pdf, images, etc.
    });

    // Delete local temp file
    fs.unlinkSync(req.file.path);

    // Save note in DB
    const note = new Note({
      department,
      semester,
      subject,
      tag,
      filePath: result.secure_url, // now stores the Cloudinary URL
      uploadedBy: req.user._id,
      cloudinaryId: result.public_id,
    });

    await note.save();
    res.status(200).json({ message: 'Upload successful', note });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📥 Get notes by subject
router.get('/subject/:subject', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ subject: req.params.subject });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// ❌ Delete note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Only uploader can delete
    if (!note.uploadedBy.equals(decoded.id))
      return res.status(403).json({ error: 'Not authorized' });

    // Delete from Cloudinary if it exists
    if (note.cloudinaryId) {
      await cloudinary.uploader.destroy(note.cloudinaryId, { resource_type: 'auto' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
