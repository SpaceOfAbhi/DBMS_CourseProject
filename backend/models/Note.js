const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  semester: String,
  subject: String,
  title: String,
  tags: [String],
  fileUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      stars: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Note", NoteSchema);
