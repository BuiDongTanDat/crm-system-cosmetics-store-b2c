const {
  ProductResponseDTO,
  ProductListResponseDTO,
  ProductImportResponseDTO
} = require('../DTOs/ProductResponse');
const {
  CreateProductRequestDTO,
  UpdateProductRequestDTO,
  ImportCSVRequestDTO
} = require('../DTOs/ProductRequest');
const ProductRepository = require('../../Infrastructure/Repositories/ProductRepository');


const productRepository = new ProductRepository();
class ProductService {

  // Lấy tất cả sản phẩm (dạng danh sách)
  async getAll() {
    const products = await productRepository.findAll();
    return ProductListResponseDTO.fromEntities(products);
  }

  // Lấy chi tiết sản phẩm theo ID
  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return new ProductResponseDTO(product);
  }

  // Tạo mới sản phẩm
  async create(data) {
    const dto = new CreateProductRequestDTO(data);
    // validate required fields early to avoid DB notNull violations
    if (!dto.name || dto.price_current == null) {
      throw new Error('Các trường bắt buộc: name, price_current');
    }
    const created = await productRepository.save(dto);
    return new ProductResponseDTO(created);
  }

  // Cập nhật sản phẩm
  async update(product_id, data) {
    const dto = new UpdateProductRequestDTO({ ...data, product_id });
    // pass single DTO object to repository.save
    
    const updated = await productRepository.save(dto);
    return new ProductResponseDTO(updated);
  }

  // Xóa sản phẩm
  async delete(id) {
    const deleted = await productRepository.delete(id);
    return { success: !!deleted };
  }

  // Import sản phẩm từ CSV
  async importFromCSV(filePath) {
    const dto = new ImportCSVRequestDTO({ filePath });
    if (typeof productRepository.importFromCSV !== 'function') {
      throw new Error('importFromCSV chưa được triển khai trong repository');
    }
    const result = await productRepository.importFromCSV(dto);
    return new ProductImportResponseDTO(result);
  }
}

module.exports = new ProductService();
