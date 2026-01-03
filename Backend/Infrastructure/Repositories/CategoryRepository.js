const Category = require('../../Domain/Entities/Category');

class CategoryRepository {
  // Lấy tất cả danh mục
  async getAll() {
    return await Category.findAll();
  }

  // Lấy danh mục theo ID
  async getById(categoryId) {
    return await Category.findByPk(categoryId);
  }

  // Tạo mới danh mục
  async create(categoryData) {
    return await Category.create(categoryData);
  }

  // Cập nhật thông tin danh mục
  async update(categoryId, categoryData) {
    const category = await Category.findByPk(categoryId);
    if (!category) return null;
    await category.update(categoryData);
    return category;
  }

  // Xóa danh mục
  async delete(categoryId) {
    const category = await Category.findByPk(categoryId);
    if (!category) return null;
    await category.destroy();
    return true;
  }

  // Lấy danh mục đang hoạt động (ACTIVE)
  async getActiveCategories() {
    return await Category.findAll({
      where: { status: 'ACTIVE' },
    });
  }

  // Tìm danh mục theo tên (nếu cần khi import hoặc sync)
  async findByName(name) {
    return await Category.findOne({
      where: { name },
    });
  }
}

module.exports = new CategoryRepository();
