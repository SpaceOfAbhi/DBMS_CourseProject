const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  subject: { type: String, required: true },
  tag: { type: String },
  filePath: { type: String, required: true }, // This is the uploaded file path
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Note', NoteSchema);
