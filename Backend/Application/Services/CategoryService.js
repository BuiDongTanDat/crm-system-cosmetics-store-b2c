const CategoryRepository = require('../../Infrastructure/Repositories/CategoryRepository');
const categoryRepository = new CategoryRepository();

class CategoryService {
  // Lấy tất cả category
  static async getAll() {
    return await categoryRepository.getAll();
  }

  // Lấy category theo id
  static async getById(id) {
    return await categoryRepository.getById(id);
  }

  // Tạo mới category
  static async create(data) {
    return await categoryRepository.create(data);
  }

  // Cập nhật category theo id
  static async update(id, data) {
    // Use repository to fetch and update — don't reference undefined global Category
    const category = await categoryRepository.getById(id);
    if (!category) return null;

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
  }

  // Xóa category theo id
  static async delete(id) {
    return await categoryRepository.delete(id);
  }

  // Lấy các category đang hoạt động (nếu cần)
  static async getActiveCategories() {
    return await categoryRepository.getActiveCategories();
  }

  // Tìm category theo tên (nếu cần)
  static async findByName(name) {
    return await categoryRepository.findByName(name);
  }
}

module.exports = CategoryService;