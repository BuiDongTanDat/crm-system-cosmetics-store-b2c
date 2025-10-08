const express = require('express');
const multer = require('multer');
const ProductController = require('../controllers/ProductController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', ProductController.getAll);
router.get('/:id', ProductController.getById);
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);
router.delete('/:id', ProductController.delete);

// Import CSV
router.post('/import', upload.single('file'), ProductController.importCSV);

module.exports = router;
