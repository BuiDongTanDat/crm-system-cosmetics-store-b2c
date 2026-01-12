const express = require('express');
const multer = require('multer');
const ProductController = require('../Controller/ProductController');
const permissionRoute = require('../Middleware/permissionMiddleware');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const protectedRoute = require('../Middleware/authMiddleware');
//Public route
router.get('/get-all-for-show', ProductController.getAll); // Lấy tất cả sản phẩm để hiển thị công khai
router.get('/public/:id', ProductController.getById); // Lấy sản phẩm công khai theo ID

router.use(protectedRoute);
//Private
router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
router.post('/', permissionRoute('product', 'update'), ProductController.create);
router.put('/:id', permissionRoute('product', 'update'), ProductController.update);
router.delete('/:id', permissionRoute('product', 'delete'), ProductController.delete);

// Import CSV
router.post('/import', permissionRoute('product', 'import'), function (req, res, next) {
	upload.single('file')(req, res, function (err) {
		if (err) {
			const status = err instanceof multer.MulterError ? 400 : 400;
			return res.status(status).json({ error: `File upload lỗi: ${err.message}` });
		}
		next();
	});
}, ProductController.importCSV);

// Export CSV
router.get('/export/csv', permissionRoute('product', 'export'), ProductController.exportCSV);


module.exports = router;
