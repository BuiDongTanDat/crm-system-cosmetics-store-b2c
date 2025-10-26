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

class ProductService {

  // Lấy tất cả sản phẩm (dạng danh sách)
  async getAll() {
    const products = await ProductRepository.findAll();
    return ProductListResponseDTO.fromEntities(products);
  }

  // Lấy chi tiết sản phẩm theo ID
  async getById(id) {
    const product = await ProductRepository.findById(id);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return new ProductResponseDTO(product);
  }

  // Tạo mới sản phẩm
  async create(data) {
    const dto = new CreateProductRequestDTO(data);
    // validate required fields first
    if (!dto.name || dto.price_current == null ) {
      throw new Error('Các trường bắt buộc: name, price_current');
    }

    const found = await ProductRepository.findByName(dto.name);
    if (found) {
      const list = Array.isArray(found) ? found : [found];
      const nameNormalized = String(dto.name || "").trim().toLowerCase();
      const exists = list.some(p => {
        const candidate = String(p.name ?? p.product_name ?? "").trim().toLowerCase();
        return candidate === nameNormalized;
      });
      if (exists) {
        throw new Error('Sản phẩm với tên này đã tồn tại');
      }
    }

    const created = await ProductRepository.save(dto);
    return new ProductResponseDTO(created);
  }

  // Cập nhật sản phẩm
  async update(product_id, data) {

    const dto = new UpdateProductRequestDTO({ ...data, product_id });
    // pass single DTO object to repository.save
    
    const updated = await ProductRepository.save(dto);
    return new ProductResponseDTO(updated);
  }

  // Xóa sản phẩm
  async delete(id) {
    const deleted = await ProductRepository.delete(id);
    return { success: !!deleted };
  }

  // Import sản phẩm từ CSV
  async importFromCSV(filePath) {
    const dto = new ImportCSVRequestDTO({ filePath });
    if (typeof productRepository.importFromCSV !== 'function') {
      throw new Error('importFromCSV chưa được triển khai trong repository');
    }
    const result = await ProductRepository.importFromCSV(dto);
    return new ProductImportResponseDTO(result);
  }

  // Xuất sản phẩm ra CSV
  async exportToCSV() {
    return  await ProductRepository.exportToCSV();
   
  }
}

module.exports = new ProductService();
