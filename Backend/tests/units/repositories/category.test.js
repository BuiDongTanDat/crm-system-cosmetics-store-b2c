const CategoryRepository = require('../../../Infrastructure/Repositories/CategoryRepository');
const Category = require('../../../Domain/Entities/Category');

jest.mock('../../../Domain/Entities/Category');

/*Viết unit test theo AAA:
    - Arrange: Chuẩn bị dữ liệu, mock các hàm cần thiết
    - Act: Gọi hàm cần test
    - Assert: Kiểm tra kết quả trả về có đúng như mong đợi hay không
*/
describe('CategoryRepository', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Lấy tất cả danh mục', () => {
        it('nên trả về tất cả danh mục', async () => {
            const mockCategories = [{ id: 1, name: 'CatA' }, { id: 2, name: 'CatB' }];
            Category.findAll.mockResolvedValue(mockCategories);

            // Mình mock Category, để khi repository gọi Category.findAll thì nó sẽ trả về mockCategories ở trên
            // không phụ thuộc vào db
            const result = await CategoryRepository.getAll();

            expect(Category.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockCategories);
        });
        it('trả về chuỗi rỗng khi không có danh mục' , async () => {
            const mockCategories = [];
            Category.findAll.mockResolvedValue(mockCategories);

            const result = await CategoryRepository.getAll();

            expect(Category.findAll).toHaveBeenCalled();
            expect(result.length).toBe(0);
        });
    });

    describe('Lấy danh mục theo id', () => {
        it('trả về danh mục theo id', async () => {
            const mockCategory = { id: 1, name: 'A' };
            Category.findByPk.mockResolvedValue(mockCategory);

            const result = await CategoryRepository.getById(1);

            expect(Category.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockCategory);
        });

        it('Trả về null khi không tìm thấy danh mục', async () => {
            // Mock để findByPk trả về null
            Category.findByPk.mockResolvedValue(null);

            const result = await CategoryRepository.getById(999);
            
            expect(Category.findByPk).toHaveBeenCalledWith(999);
            expect(result).toBeNull();
        });
    });

    describe('Tạo danh mục', () => {
        it('tạo thành công danh mục và trả dữ liệu về', async () => {
            const data = { name: 'New Category' };
            const mockCreated = { id: 3, ...data };
            Category.create.mockResolvedValue(mockCreated);

            const result = await CategoryRepository.create(data);

            expect(Category.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(mockCreated);
        });
    });

    describe('Cập nhật danh mục', () => {
        it('cập nhật thành công và trả về dữ liệu', async () => {
            const categoryId = 1;
            const data = { name: 'Updated Category' };
            const mockCategory = { id: categoryId, update: jest.fn().mockResolvedValue(), ...data };
            Category.findByPk.mockResolvedValue(mockCategory);

            const result = await CategoryRepository.update(categoryId, data);

            expect(Category.findByPk).toHaveBeenCalledWith(categoryId);
            expect(mockCategory.update).toHaveBeenCalledWith(data);
            expect(result).toEqual(mockCategory);
        });

        it('trả về null khi không tìm thấy id', async () => {
            Category.findByPk.mockResolvedValue(null);

            const result = await CategoryRepository.update(999, { name: 'X' });

            expect(result).toBeNull();
        });
    });

    describe('Xóa danh mục', () => {
        it('xóa thành công và trả về True', async () => {
            const mockCategory = { destroy: jest.fn().mockResolvedValue() };
            Category.findByPk.mockResolvedValue(mockCategory);

            const result = await CategoryRepository.delete(1);

            expect(Category.findByPk).toHaveBeenCalledWith(1);
            expect(mockCategory.destroy).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('trả về null khi không tìm thấy danh mục', async () => {
            Category.findByPk.mockResolvedValue(null);

            const result = await CategoryRepository.delete(999);

            expect(result).toBeNull();
        });
    });

    describe('Lấy các danh mục đang được kích hoạt', () => {
        it('trả về các danh mục active', async () => {
            const mockCategories = [{ id: 1, status: 'ACTIVE' }];
            Category.findAll.mockResolvedValue(mockCategories);

            const result = await CategoryRepository.getActiveCategories();

            expect(Category.findAll).toHaveBeenCalledWith({ where: { status: 'ACTIVE' } });
            expect(result).toEqual(mockCategories);
        });
    });

    describe('TÌm danh mục theo tên', () => {
        it('trả về danh mục theo tên', async () => {
            const mockCategory = { id: 1, name: 'Test' };
            Category.findOne.mockResolvedValue(mockCategory);

            const result = await CategoryRepository.findByName('Test');

            expect(Category.findOne).toHaveBeenCalledWith({ where: { name: 'Test' } });
            expect(result).toEqual(mockCategory);
        });

        it('trả về null khi không tìm thấy', async () => {
            Category.findOne.mockResolvedValue(null);

            const result = await CategoryRepository.findByName('NotExist');

            expect(result).toBeNull();
        });
    });
});