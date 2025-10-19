const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  subject: { type: String, required: true },
  tag: { type: String },
  filename: { type: String, required: true },
  fileData: { 
    data: Buffer,           // The actual file content
    contentType: String     // MIME type like 'application/pdf'
  },
  fileSize: { type: Number }, // File size in bytes
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);