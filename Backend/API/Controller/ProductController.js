const path = require('path');
const ProductService = require('../../Application/Services/ProductService');
const { Parser } = require('json2csv');

module.exports = {
  // --- CRUD ---
  async getAll(req, res) {
    try {
      const data = await ProductService.getAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await ProductService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
      }
      res.json(data);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const data = await ProductService.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    // console.log(" Body nhận được:", req.body);
    // console.log(" Params:", req.params);
    try {
      if (!req.params.id) {
        return res.status(400).json({ error: 'Thiếu ID sản phẩm trong tham số' });
      }
      const found = await ProductService.getById(req.params.id);
      if (!found) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

      const data = await ProductService.update(req.params.id, req.body);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const found = await ProductService.getById(req.params.id);
      if (!found) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

      const result = await ProductService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  //Import CSV 
  async importCSV(req, res) {
    try {
        // Ensure the file is received correctly
        const filePath =
            (req.file && req.file.path) || // Single file upload
            (req.files && req.files.length > 0 && req.files[0].path) || // Multiple files
            null;

        if (!filePath) {
            return res.status(400).json({ error: 'Chưa có file CSV tải lên hoặc field name bị thiếu' });
        }

        // Process the file using the service
        const result = await ProductService.importFromCSV(filePath);
        res.json({ message: 'Import hoàn tất', result });
    } catch (err) {
        console.error('Error importing CSV:', err);
        res.status(500).json({ error: 'Failed to import CSV', details: err.message });
    }
  },

  // Xuất file CSV
  async exportCSV(req, res) {
    try {
        const csvString = await ProductService.exportToCSV();

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');

        // Send the CSV string as the response body
        return res.status(200).send(csvString);
    } catch (err) {
        console.error('Error exporting CSV:', err);
        res.status(500).json({ error: 'Failed to export products to CSV', details: err.message });
    }
  }
};