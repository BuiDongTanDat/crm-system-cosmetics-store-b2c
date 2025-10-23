const CategoryRepository = require('../../Infrastructure/Repositories/CategoryRepository');
const categoryRepository = new CategoryRepository();

class CategoryService {
  // Lấy tất cả category
  static async getAll() {
    try {
      return await categoryRepository.getAll();
    } catch (err) {
      throw err;
    }
  }

  // Lấy category theo id
  static async getById(id) {
    try {
      return await categoryRepository.getById(id);
    } catch (err) {
      throw err;
    }
  }

  // Tạo mới category
  static async create(data) {
    try {
      // validate unique name (nếu có name)
      if (data && data.name) {
        const existing = await categoryRepository.findByName(data.name);
        if (existing) {
          // nếu tồn tại thì trả về lỗi để controller xử lý (tránh duplicate)
          throw new Error('Tên danh mục đã tồn tại');
        }
      }
      return await categoryRepository.create(data);
    } catch (err) {
      throw err;
    }
  }

  // Cập nhật category theo id
  static async update(id, data) {
    try {
      const category = await categoryRepository.getById(id);
      if (!category) return null;

      // nếu đổi tên thì kiểm tra trùng tên với bản ghi khác
      if (data && data.name) {
        const existing = await categoryRepository.findByName(data.name);
        const existingId = existing ? (existing.category_id || existing.id) : null;
        const targetId = category.category_id || category.id;
        if (existing && String(existingId) !== String(targetId)) {
          throw new Error('Tên danh mục đã tồn tại');
        }
      }

      // If it's a Sequelize model instance
      if (typeof category.update === 'function') {
        await category.update(data);
        return category;
      }

      // If repository exposes an update method (preferred)
      if (typeof categoryRepository.update === 'function') {
        return await categoryRepository.update(id, data);
      }

      // Fallback: merge and return
      return Object.assign(category, data);
    } catch (err) {
      throw err;
    }
  }

  // Xóa category theo id
  static async delete(id) {
    try {
      return await categoryRepository.delete(id);
    } catch (err) {
      throw err;
    }
  }

  // Lấy các category đang hoạt động (nếu cần)
  static async getActiveCategories() {
    try {
      return await categoryRepository.getActiveCategories();
    } catch (err) {
      throw err;
    }
  }

  // Tìm category theo tên (nếu cần)
  static async findByName(name) {
    try {
      return await categoryRepository.findByName(name);
    } catch (err) {
      throw err;
    }
  }
}

module.exports = CategoryService;