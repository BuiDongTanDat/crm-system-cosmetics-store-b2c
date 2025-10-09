const path = require('path');
const ProductRepository = require('../../Infrastructure/Repositories/ProductRepository');
const ProductService = require('../../Application/Services/ProductService');

const productService = new ProductService(new ProductRepository());

module.exports = {
  // --- CRUD ---
  async getAll(req, res) {
    try {
      const data = await productService.getAll();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const data = await productService.getById(req.params.id);
      res.json(data);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const data = await productService.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const data = await productService.update(req.params.id, req.body);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await productService.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // --- Import CSV ---
  async importCSV(req, res) {
    try {
      const filePath = req.file ? req.file.path : null;
      if (!filePath) {
        return res.status(400).json({ error: 'Chưa có file CSV tải lên' });
      }

      const result = await productService.importFromCSV(filePath);
      res.json({ message: 'Import thành công', result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
