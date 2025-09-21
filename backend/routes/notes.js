// ✅ Get all notes
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find()
      .populate("uploadedBy", "username email") // get uploader info
      .sort({ createdAt: -1 }); // latest first
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Get single note by ID
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("uploadedBy", "username email");
    if (!note) return res.status(404).json({ msg: "Note not found" });
    res.json(note);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Get notes by semester
router.get("/semester/:sem", async (req, res) => {
  try {
    const notes = await Note.find({ semester: req.params.sem })
      .populate("uploadedBy", "username email");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Get notes by subject
router.get("/subject/:subject", async (req, res) => {
  try {
    const notes = await Note.find({ subject: req.params.subject })
      .populate("uploadedBy", "username email");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});
