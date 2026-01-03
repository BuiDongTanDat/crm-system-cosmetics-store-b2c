const ProductRepository = require('../../../Infrastructure/Repositories/ProductRepository');
const ProductService = require('../../../Application/Services/ProductService');

jest.mock('../../../Infrastructure/Repositories/ProductRepository');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lấy tất cả sản phẩm', () => {
    it('trả về danh sách sản phẩm', async () => {
      ProductRepository.findAll.mockResolvedValue([
        { product_id: 1, name: 'A' },
        { product_id: 2, name: 'B' },
      ]);
      
      const result = await ProductService.getAll();
      
      expect(ProductRepository.findAll).toHaveBeenCalled();
      expect(result.data || result).toBeDefined();
    });

    it('xử lý lỗi khi lấy tất cả sản phẩm', async () => {
      ProductRepository.findAll.mockRejectedValue(Error('DB error'));
      await expect(ProductService.getAll()).rejects.toThrow('DB error');
    });
  });

  describe('Lấy sản phẩm theo id', () => {
    it('trả về sản phẩm theo id', async () => {
      ProductRepository.findById.mockResolvedValue({ product_id: 1, name: 'A' });
      
      const result = await ProductService.getById(1);
      
      expect(ProductRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toBeDefined();
      expect(result.product_id).toBe(1);
    });

    it('throw lỗi nếu không tìm thấy sản phẩm', async () => {
      ProductRepository.findById.mockResolvedValue(null);
      await expect(ProductService.getById(99)).rejects.toThrow('Không tìm thấy sản phẩm');
    });

    it('xử lý lỗi khi lấy sản phẩm theo id', async () => {
      ProductRepository.findById.mockRejectedValue(new Error('DB error'));
      await expect(ProductService.getById(1)).rejects.toThrow('DB error');
    });
  });

  describe('Tạo mới sản phẩm', () => {
    it('tạo mới sản phẩm thành công', async () => {
      ProductRepository.findByName.mockResolvedValue(null);
      ProductRepository.save.mockResolvedValue({ product_id: 1, name: 'A', price_current: 1000 });
      const data = { name: 'A', price_current: 1000 };
     
      const result = await ProductService.create(data);
      
      expect(ProductRepository.findByName).toHaveBeenCalledWith('A');
      expect(ProductRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('A');
    });

    it('throw lỗi nếu thiếu trường bắt buộc', async () => {
      await expect(ProductService.create({ name: '' })).rejects.toThrow('Các trường bắt buộc');
      await expect(ProductService.create({ price_current: 1000 })).rejects.toThrow('Các trường bắt buộc');
    });

    it('throw lỗi nếu tên đã tồn tại', async () => {
      ProductRepository.findByName.mockResolvedValue([{ name: 'A' }]);
      await expect(ProductService.create({ name: 'A', price_current: 1000 })).rejects.toThrow('Sản phẩm với tên này đã tồn tại');
    });

    it('xử lý lỗi khi tạo sản phẩm', async () => {
      ProductRepository.findByName.mockRejectedValue(new Error('DB error'));
      await expect(ProductService.create({ name: 'A', price_current: 1000 })).rejects.toThrow('DB error');
    });
  });

  describe('Cập nhật sản phẩm', () => {
    it('cập nhật sản phẩm thành công', async () => {
      ProductRepository.save.mockResolvedValue({ product_id: 1, name: 'B' });
      const result = await ProductService.update(1, { name: 'B' });
      expect(ProductRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('B');
    });

    it('xử lý lỗi khi cập nhật sản phẩm', async () => {
      ProductRepository.save.mockRejectedValue(new Error('DB error'));
      await expect(ProductService.update(1, { name: 'B' })).rejects.toThrow('DB error');
    });
  });

  describe('Xóa sản phẩm', () => {
    it('xóa sản phẩm thành công', async () => {
      ProductRepository.delete.mockResolvedValue(1);
      const result = await ProductService.delete(1);
      expect(ProductRepository.delete).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
    });

    it('trả về success false nếu không xóa được', async () => {
      ProductRepository.delete.mockResolvedValue(0);
      const result = await ProductService.delete(99);
      expect(result.success).toBe(false);
    });

    it('xử lý lỗi khi xóa sản phẩm', async () => {
      ProductRepository.delete.mockRejectedValue(new Error('DB error'));
      await expect(ProductService.delete(1)).rejects.toThrow('DB error');
    });
  });

  describe('Import sản phẩm từ CSV', () => {
    it('import thành công', async () => {
      ProductRepository.importFromCSV.mockResolvedValue({ importedCount: 2, updatedCount: 0, failedCount: 0 });
      
      const result = await ProductService.importFromCSV('/fake.csv');
      //console.log(result);
      expect(ProductRepository.importFromCSV).toHaveBeenCalled();
      expect(result.imported).toBe(2);
    });

    it('throw lỗi nếu repository chưa triển khai', async () => {
      ProductRepository.importFromCSV = undefined;
      await expect(ProductService.importFromCSV('/fake.csv')).rejects.toThrow('importFromCSV chưa được triển khai');
    });

    it('xử lý lỗi khi import', async () => {
      ProductRepository.importFromCSV = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(ProductService.importFromCSV('/fake.csv')).rejects.toThrow('DB error');
    });
  });

  describe('Export sản phẩm ra CSV', () => {
    it('export thành công', async () => {
      ProductRepository.exportToCSV.mockResolvedValue('csv content');
      const result = await ProductService.exportToCSV();
      expect(ProductRepository.exportToCSV).toHaveBeenCalled();
      expect(result).toBe('csv content');
    });

    it('xử lý lỗi khi export', async () => {
      ProductRepository.exportToCSV.mockRejectedValue(new Error('DB error'));
      await expect(ProductService.exportToCSV()).rejects.toThrow('DB error');
    });
  });

  describe('getAllproduct trả về danh sách sản phẩm thô', () => {
    it('trả về danh sách sản phẩm', async () => {
      ProductRepository.findAll.mockResolvedValue([{ product_id: 1 }]);
      const result = await ProductService.getAllproduct();
      expect(ProductRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([{ product_id: 1 }]);
    });
  });
});
