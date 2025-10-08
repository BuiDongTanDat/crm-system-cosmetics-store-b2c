const Product = require('../../Domain/Entities/Product');
const IProductRepository = require('../../Domain/Interfaces/IProductRepository');

class ProductRepository extends IProductRepository {
  // Lấy sản phẩm theo ID
  async findById(productId) {
    const product = await Product.findByPk(productId);
    return product || null;
  }

  // Lấy tất cả sản phẩm
  async findAll() {
    return await Product.findAll();
  }

  // Tạo hoặc cập nhật sản phẩm
  async save(product) {
    if (!product.product_id) {
      // Tạo mới
      const created = await Product.create(product.toJSON());
      return created;
    } else {
      // Cập nhật nếu đã tồn tại
      const existing = await Product.findByPk(product.product_id);
      if (existing) {
        await existing.update(product.toJSON());
        return existing;
      } else {
        // Nếu ID có nhưng không tồn tại DB → tạo mới
        const created = await Product.create(product.toJSON());
        return created;
      }
    }
  }

  // Xóa sản phẩm theo ID
  async delete(productId) {
    await Product.destroy({ where: { product_id: productId } });
  }

  // Lấy sản phẩm theo tên (ví dụ tìm kiếm)
  async findByName(name) {
    return await Product.findAll({
      where: { name }
    });
  }

  // Lấy sản phẩm theo category
  async findByCategory(category) {
    return await Product.findAll({
      where: { category }
    });
  }

  // Cập nhật số lượng tồn kho
  async updateInventory(productId, qty) {
    const product = await Product.findByPk(productId);
    if (!product) return null;
    product.inventory_qty = qty;
    await product.save();
    return product;
  }

  // Lấy sản phẩm có giá trong khoảng min-max
  async findByPriceRange(min, max) {
    return await Product.findAll({
      where: {
        price: {
          [Product.sequelize.Op.between]: [min, max]
        }
      }
    });
  }
}

module.exports = ProductRepository;
