const Product = require('../../Domain/Entities/Product');
const IProductRepository = require('../../Domain/Interfaces/IProductRepository');
const { Op } = require('sequelize');

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
    console.log('Product to save:', product);
    if (product && product.product_id) {
      const existingProduct = await Product.findByPk(product.product_id);
      if (existingProduct) {
        // prepare update data without primary key to avoid trying to change it
        const updateData = { ...product };
        delete updateData.product_id;

        // perform update and return the updated instance (Sequelize returns the updated instance)
        const updated = await existingProduct.update(updateData, { returning: true });
        return updated;
      }
    }
    return await Product.create(product);
  }

  // Xóa sản phẩm theo ID
  async delete(productId) {
    // trả về số bản ghi bị xóa (0 hoặc 1)
    return await Product.destroy({ where: { product_id: productId } });
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
        price_current: {
          [Op.between]: [min, max]
        }
      }
    });
  }
}

module.exports = ProductRepository;