const multer = require('multer');
const path = require('path');


const { Readable } = require('stream');

const storage = multer.memoryStorage();
const upload = multer({ storage });




// File filter (only pdf, jpg, png allowed)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpg|jpeg|png/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only .pdf, .jpg, .jpeg, .png files are allowed!'));
  }
};



module.exports = upload;
