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

class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  // Lấy tất cả sản phẩm (dạng danh sách)
  async getAll() {
    const products = await this.productRepository.getAll();
    return ProductListResponseDTO.fromEntities(products);
  }

  // Lấy chi tiết sản phẩm theo ID
  async getById(id) {
    const product = await this.productRepository.getById(id);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return new ProductResponseDTO(product);
  }

  // Tạo mới sản phẩm
  async create(data) {
    const dto = new CreateProductRequestDTO(data);
    const created = await this.productRepository.create(dto);
    return new ProductResponseDTO(created);
  }

  // Cập nhật sản phẩm
  async update(id, data) {
    const dto = new UpdateProductRequestDTO(data);
    const updated = await this.productRepository.update(id, dto);
    return new ProductResponseDTO(updated);
  }

  // Xóa sản phẩm
  async delete(id) {
    const deleted = await this.productRepository.delete(id);
    return { success: !!deleted };
  }

  // Import sản phẩm từ CSV
  async importFromCSV(filePath) {
    // Có thể cần truyền thêm source nếu muốn
    const dto = new ImportCSVRequestDTO({ filePath });
    const result = await this.productRepository.importFromCSV(dto);
    // result: { importedCount, updatedCount, failedCount, errors }
    return new ProductImportResponseDTO(result);
  }
}

module.exports = ProductService;
