const CategoryService = require('../../Application/Services/CategoryService');
const CategoryDTO = require('../../Application/DTOs/CategoryDTO');

class CategoryController {
  static async getAll(req, res) {
    try {
      const categories = await CategoryService.getAll();
      res.json(categories.map(c => new CategoryDTO(c)));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const category = await CategoryService.getById(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      res.json(new CategoryDTO(category));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async create(req, res) {
    try {
      const category = await CategoryService.create(req.body);
      res.status(201).json(new CategoryDTO(category));
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async update(req, res) {
    try {
      const category = await CategoryService.update(req.params.id, req.body);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      res.json(new CategoryDTO(category));
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await CategoryService.delete(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Category not found' });
      res.json({ message: 'Category deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = CategoryController;