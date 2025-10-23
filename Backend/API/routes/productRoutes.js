const express = require('express');
const multer = require('multer');
const ProductController = require('../Controller/ProductController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Thư mục tạm để lưu file upload
                                             // Nếu nữa ko cần luu thì khỏi cần cấu hình dest

// Nào ko muốn lưu thì đôi cách khai báo này nhen
// const storage = multer.memoryStorage(); // lưu file trong RAM, không ghi ra ổ cứng
// const upload = multer({ storage });


router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

// Import CSV
router.post('/import', function (req, res, next) {
	upload.single('file')(req, res, function (err) {
		if (err) {
			// MulterError or other upload error -> return JSON error instead of crashing
			const status = err instanceof multer.MulterError ? 400 : 400;
			return res.status(status).json({ error: `File upload lỗi: ${err.message}` });
		}
		next();
	});
}, ProductController.importCSV);

// Export CSV
router.get('/export/csv', ProductController.exportCSV);


module.exports = router;
