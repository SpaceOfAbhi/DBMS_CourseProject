const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  subject: { type: String, required: true },
  tag: { type: String },
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file ID
  filename: { type: String, required: true }, // Original file name for display
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
