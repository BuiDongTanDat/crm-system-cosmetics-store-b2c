const CategoryRepository = require('../../Infrastructure/Repositories/CategoryRepository');
const { AppError, asAppError, ok, fail } = require('../helpers/errors.js');

class CategoryService {
  // Lấy tất cả category
  static async getAll() {
    try {
      const categories = await CategoryRepository.getAll();
      return ok(categories);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'LIST_CATEGORIES_FAILED' }));
    }
  }

  // Lấy category theo id
  static async getById(id) {
    try {
      const category = await CategoryRepository.getById(id);
      if (!category) {
        return fail(new AppError('Không tìm thấy danh mục', { status: 404, code: 'CATEGORY_NOT_FOUND' }));
      }
      return ok(category);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_CATEGORY_FAILED' }));
    }
  }

  // Tạo mới category
  static async create(data) {
    try {
      // validate unique name (nếu có name)
      if (data && data.name) {
        const existing = await CategoryRepository.findByName(data.name);
        if (existing) {
          return fail(new AppError('Tên danh mục đã tồn tại', { status: 400, code: 'DUPLICATE_CATEGORY' }));
        }
      }
      const created = await CategoryRepository.create(data);
      return ok(created);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'CREATE_CATEGORY_FAILED' }));
    }
  }

  // Cập nhật category theo id
  static async update(id, data) {
    try {
      const category = await CategoryRepository.getById(id);
      if (!category) return fail(new AppError('Không tìm thấy danh mục', { status: 404, code: 'CATEGORY_NOT_FOUND' }));

      // nếu đổi tên thì kiểm tra trùng tên với bản ghi khác
      if (data && data.name) {
        const existing = await CategoryRepository.findByName(data.name);
        const existingId = existing ? (existing.category_id || existing.id) : null;
        const targetId = category.category_id || category.id;
        if (existing && String(existingId) !== String(targetId)) {
          return fail(new AppError('Tên danh mục đã tồn tại', { status: 400, code: 'DUPLICATE_CATEGORY' }));
        }
      }

      // If it's a Sequelize model instance
      if (typeof category.update === 'function') {
        await category.update(data);
        return ok(category);
      }

      // If repository exposes an update method (preferred)
      if (typeof CategoryRepository.update === 'function') {
        const updated = await CategoryRepository.update(id, data);
        return ok(updated);
      }

      // Fallback: merge and return
      const merged = Object.assign(category, data);
      return ok(merged);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'UPDATE_CATEGORY_FAILED' }));
    }
  }

  // Xóa category theo id
  static async delete(id) {
    try {
      const result = await CategoryRepository.delete(id);
      // repository có thể trả về số lượng xóa, boolean hoặc object
      const deleted = (result === true) || (typeof result === 'number' && result > 0) || (result && result.deleted);
      if (!deleted) {
        return fail(new AppError('Không tìm thấy danh mục', { status: 404, code: 'CATEGORY_NOT_FOUND' }));
      }
      return ok({ deleted: true });
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'DELETE_CATEGORY_FAILED' }));
    }
  }

  // Lấy các category đang hoạt động (nếu cần)
  static async getActiveCategories() {
    try {
      const categories = await CategoryRepository.getActiveCategories();
      return ok(categories);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'GET_ACTIVE_CATEGORIES_FAILED' }));
    }
  }

  // Tìm category theo tên (nếu cần)
  static async findByName(name) {
    try {
      const category = await CategoryRepository.findByName(name);
      return ok(category);
    } catch (err) {
      return fail(asAppError(err, { status: 500, code: 'FIND_CATEGORY_BY_NAME_FAILED' }));
    }
  }
}

module.exports = CategoryService;