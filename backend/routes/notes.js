const express = require('express');
const router = express.Router();
const multer = require('multer');
const Note = require('../models/Note');
const authMiddleware = require('../middleware/auth');

// Multer memory storage (no disk storage needed)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -------------------- Upload Note (BLOB Storage) --------------------
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { department, semester, subject, tag } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    console.log("📤 Uploading file:", {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Create note with file stored as binary data
    const note = new Note({
      department,
      semester: parseInt(semester),
      subject,
      tag,
      filename: req.file.originalname,
      fileData: {
        data: req.file.buffer,      // The actual file content
        contentType: req.file.mimetype // MIME type
      },
      fileSize: req.file.size,
      uploadedBy: req.user.id
    });

    await note.save();
    console.log("✅ Note saved with file data:", note._id);

    res.status(200).json({ 
      message: 'Upload successful', 
      note: {
        _id: note._id,
        filename: note.filename,
        subject: note.subject,
        fileSize: note.fileSize
      }
    });

  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Get all notes --------------------
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Get notes by subject --------------------
router.get('/subject/:subject', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ subject: req.params.subject }).sort({ createdAt: -1 });
    res.status(200).json(notes);
  } catch (err) {
    console.error('Fetch notes by subject error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Stream file (BLOB) --------------------
router.get('/file/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note || !note.fileData || !note.fileData.data) {
      return res.status(404).json({ error: 'File not found' });
    }

    console.log("📄 Serving file:", note.filename, "Type:", note.fileData.contentType);

    // Set appropriate headers
    res.set('Content-Type', note.fileData.contentType);
    res.set('Content-Disposition', `inline; filename="${note.filename}"`);
    res.set('Content-Length', note.fileSize);

    // Send the binary data
    res.send(note.fileData.data);

  } catch (err) {
    console.error('View file error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Public file view (no auth required) --------------------
router.get('/public/file/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note || !note.fileData || !note.fileData.data) {
      return res.status(404).json({ error: 'File not found' });
    }

    console.log("📄 Public file access:", note.filename);

    // Set appropriate headers for browser display
    res.set('Content-Type', note.fileData.contentType);
    res.set('Content-Disposition', `inline; filename="${note.filename}"`);
    res.set('Content-Length', note.fileSize);

    // Send the binary data
    res.send(note.fileData.data);

  } catch (err) {
    console.error('Public view file error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Delete note --------------------
// -------------------- Delete note (Only uploader can delete) --------------------
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    console.log("🗑️ Delete attempt - User:", req.user.id, "Note uploader:", note.uploadedBy);

    // Check if the current user is the uploader
    if (!note.uploadedBy) {
      console.log("❌ Note has no uploader information");
      return res.status(403).json({ error: 'Cannot delete: No uploader information' });
    }

    if (note.uploadedBy.toString() !== req.user.id.toString()) {
      console.log("❌ Unauthorized delete attempt");
      return res.status(403).json({ 
        error: 'Not authorized to delete this note. You can only delete your own uploads.' 
      });
    }

    console.log("✅ Authorized - Deleting note:", note._id, note.filename);

    // Delete the note (file data is automatically deleted with the note)
    await Note.findByIdAndDelete(req.params.id);
    
    console.log("✅ Note deleted successfully");
    res.json({ message: 'Note deleted successfully' });

  } catch (err) {
    console.error('❌ Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------- Debug: Check database storage --------------------
router.get('/debug/storage-info', async (req, res) => {
  try {
    const notes = await Note.find().select('filename fileSize createdAt');
    const totalSize = notes.reduce((sum, note) => sum + (note.fileSize || 0), 0);
    
    res.json({
      totalNotes: notes.length,
      totalStorage: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
      averageSize: `${(totalSize / (notes.length || 1) / 1024).toFixed(2)} KB`,
      notes: notes.map(note => ({
        id: note._id,
        filename: note.filename,
        size: `${(note.fileSize / 1024).toFixed(2)} KB`,
        uploaded: note.createdAt
      }))
    });
  } catch (err) {
    console.error('Storage info error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;