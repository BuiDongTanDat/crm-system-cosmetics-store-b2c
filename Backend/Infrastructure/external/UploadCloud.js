const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Lưu file tạm vào /temp_uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tmp_uploads/'); 
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn kích thước file 10MB
});

// Filter loại file
function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('File không hợp lệ'), false);
  }
  cb(null, true);
}

cloudinary.config();


const upload = multer({
  storage,
  fileFilter
});

module.exports = upload;
