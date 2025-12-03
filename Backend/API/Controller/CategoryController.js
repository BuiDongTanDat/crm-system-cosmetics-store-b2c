const CategoryService = require('../../Application/Services/CategoryService');
const CategoryDTO = require('../../Application/DTOs/CategoryDTO');

class CategoryController {
  static async getAll(req, res) {
    try {
      const categories = await CategoryService.getAll();
      if (categories.ok){
        categories.data = categories.data.map(c => new CategoryDTO(c));
      }
      return res.json(categories);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { status: 500, code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
      });
    }
  }

  static async getById(req, res) {
    try {
      const result = await CategoryService.getById(req.params.id);
      if (result.ok) {
        result.data = new CategoryDTO(result.data);
        return res.json(result);
      }
      return res.status(result.error.status || 404).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { status: 500, code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
      });
    }
  }

  static async create(req, res) {
    try {
      const result = await CategoryService.create(req.body);
      if (result.ok) {
        result.data = new CategoryDTO(result.data);
        return res.status(201).json(result);
      }
      return res.status(result.error.status || 400).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { status: 500, code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
      });
    }
  }

  static async update(req, res) {
    try {
      const result = await CategoryService.update(req.params.id, req.body);
      if (result.ok) {
        result.data = new CategoryDTO(result.data);
        return res.json(result);
      }
      return res.status(result.error.status || 400).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { status: 500, code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
      });
    }
  }

  static async delete(req, res) {
    try {
      const result = await CategoryService.delete(req.params.id);
      if (result.ok) {
        return res.json(result);
      }
      return res.status(result.error.status || 404).json(result);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { status: 500, code: 'INTERNAL_ERROR', message: 'Internal Server Error' }
      });
    }
  }
}

module.exports = CategoryController;