/**
 * Interface ProductRepository
 * Định nghĩa các phương thức mà repository phải implement
 */

class IProductRepository{
  /**
   * Lấy sản phẩm theo ID
   * @param {string} productId
   * @returns {Promise<Product|null>}
   */
  async findById(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Lấy tất cả sản phẩm
   * @returns {Promise<Product[]>}
   */
  async findAll() {
    throw new Error('Method not implemented');
  }

  /**
   * Lưu hoặc cập nhật sản phẩm
   * @param {Product} product
   * @returns {Promise<Product>}
   */
  async save(product) {
    throw new Error('Method not implemented');
  }

  /**
   * Xóa sản phẩm theo ID
   * @param {string} productId
   */
  async delete(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm sản phẩm theo tên
   * @param {string} name
   * @returns {Promise<Product[]>}
   */
  async findByName(name) {
    throw new Error('Method not implemented');
  }

  /**
   * Tìm sản phẩm theo category
   * @param {string} category
   * @returns {Promise<Product[]>}
   */
  async findByCategory(category) {
    throw new Error('Method not implemented');
  }

  /**
   * Lấy sản phẩm theo khoảng giá
   * @param {number} min
   * @param {number} max
   * @returns {Promise<Product[]>}
   */
  async findByPriceRange(min, max) {
    throw new Error('Method not implemented');
  }

  /**
   * Cập nhật số lượng tồn kho
   * @param {string} productId
   * @param {number} qty
   * @returns {Promise<Product|null>}
   */
  async updateInventory(productId, qty) {
    throw new Error('Method not implemented');
  }
}

module.exports = IProductRepository;
