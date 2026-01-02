const CategoryRepository = require('../../../Infrastructure/Repositories/CategoryRepository');
const CategoryService = require('../../../Application/Services/CategoryService');

jest.mock('../../../Infrastructure/Repositories/CategoryRepository');

describe('CategoryService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Lấy tất cả danh mục', () => {
    it('trả về tất cả danh mục', async () => {
      CategoryRepository.getAll.mockResolvedValue([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ]);
      const result = await CategoryService.getAll();
      //console.log(result);
      expect(CategoryRepository.getAll).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('A');
    });

    it('xử lý lỗi khi lấy tất cả danh mục', async () => {
      CategoryRepository.getAll.mockRejectedValue(new Error('DB error'));
      const result = await CategoryService.getAll();

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Lấy danh mục theo id', () => {
    it('trả về danh mục theo id', async () => {
      CategoryRepository.getById.mockResolvedValue({ id: 1, name: 'A' });
      const result = await CategoryService.getById(1);

      expect(CategoryRepository.getById).toHaveBeenCalledWith(1);
      expect(result.data.name).toBe('A');
    });

    it('trả về lỗi không tìm thấy nếu không có danh mục', async () => {
      CategoryRepository.getById.mockResolvedValue(null);

      const result = await CategoryService.getById(99);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('xử lý lỗi khi lấy danh mục theo id', async () => {
      CategoryRepository.getById.mockRejectedValue(new Error('DB error'));

      const result = await CategoryService.getById(1);

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Tạo mới danh mục', () => {
    it('nên tạo mới danh mục', async () => {
      CategoryRepository.findByName.mockResolvedValue(null);
      CategoryRepository.create.mockResolvedValue({ id: 1, name: 'A' });

      const result = await CategoryService.create({ name: 'A' });

      expect(CategoryRepository.findByName).toHaveBeenCalledWith('A');
      expect(CategoryRepository.create).toHaveBeenCalledWith({ name: 'A' });
      expect(result.data.name).toBe('A');
    });

    it('trả về lỗi nếu tên đã tồn tại', async () => {
      CategoryRepository.findByName.mockResolvedValue({ id: 2, name: 'A' });

      const result = await CategoryService.create({ name: 'A' });

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('DUPLICATE_CATEGORY');
    });

    it('xử lý lỗi khi tạo mới danh mục', async () => {
      CategoryRepository.findByName.mockRejectedValue(new Error('DB error'));

      const result = await CategoryService.create({ name: 'A' });

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Cập nhật danh mục', () => {
    it('cập nhật thành công danh mục', async () => {
      const category = { id: 1, name: 'A', update: jest.fn().mockResolvedValue() };
      CategoryRepository.getById.mockResolvedValue(category);
      CategoryRepository.findByName.mockResolvedValue(null);

      const result = await CategoryService.update(1, { name: 'B' });

      expect(category.update).toHaveBeenCalledWith({ name: 'B' });
      expect(result.data).toBe(category);
    });

    it('trả về lỗi nếu không tìm thấy danh mục', async () => {
      CategoryRepository.getById.mockResolvedValue(null);

      const result = await CategoryService.update(99, { name: 'B' });

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('trả về lỗi nếu tên đã tồn tại ở danh mục khác', async () => {
      const category = { id: 1, name: 'A', update: jest.fn() };
      CategoryRepository.getById.mockResolvedValue(category);
      CategoryRepository.findByName.mockResolvedValue({ id: 2, name: 'B' });

      const result = await CategoryService.update(1, { name: 'B' });

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('DUPLICATE_CATEGORY');
    });

    it('xử lý lỗi khi cập nhật danh mục', async () => {
      CategoryRepository.getById.mockRejectedValue(new Error('DB error'));

      const result = await CategoryService.update(1, { name: 'B' });

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Xóa danh mục', () => {
    it('nên xóa danh mục', async () => {
      CategoryRepository.delete.mockResolvedValue(true);

      const result = await CategoryService.delete(1);

      expect(CategoryRepository.delete).toHaveBeenCalledWith(1);
      expect(result.data.deleted).toBe(true);
    });

    it('trả về lỗi nếu không tìm thấy danh mục để xóa', async () => {
      CategoryRepository.delete.mockResolvedValue(false);

      const result = await CategoryService.delete(99);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('xử lý lỗi khi xóa danh mục', async () => {
      CategoryRepository.delete.mockRejectedValue(new Error('DB error'));
      const result = await CategoryService.delete(1);
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Lấy các danh mục đang hoạt động', () => {
    it('nên trả về các danh mục đang hoạt động', async () => {
      CategoryRepository.getActiveCategories.mockResolvedValue([{ id: 1, status: 'ACTIVE' }]);

      const result = await CategoryService.getActiveCategories();

      expect(CategoryRepository.getActiveCategories).toHaveBeenCalled();
      expect(result.data[0].status).toBe('ACTIVE');
    });

    it('xử lý lỗi khi lấy các danh mục đang hoạt động', async () => {
      CategoryRepository.getActiveCategories.mockRejectedValue(new Error('DB error'));

      const result = await CategoryService.getActiveCategories();

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Tìm danh mục theo tên', () => {
    it('trả về danh mục theo tên', async () => {
      CategoryRepository.findByName.mockResolvedValue({ id: 1, name: 'A' });

      const result = await CategoryService.findByName('A');

      expect(CategoryRepository.findByName).toHaveBeenCalledWith('A');
      expect(result.data.name).toBe('A');
    });

    it('xử lý lỗi khi tìm danh mục theo tên', async () => {
      CategoryRepository.findByName.mockRejectedValue(new Error('DB error'));

      const result = await CategoryService.findByName('A');

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});