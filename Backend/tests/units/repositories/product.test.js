const ProductRepository = require('../../../Infrastructure/Repositories/ProductRepository');
const Product = require('../../../Domain/Entities/Product');
const fs = require('fs');
jest.mock('fs');
jest.mock('../../../Domain/Entities/Product');

describe('ProductRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Lấy sản phẩm theo ID', () => {
        it('trả về sản phẩm khi tìm thấy', async () => {
            const mockProduct = { product_id: 1, name: 'A' };
            Product.findByPk.mockResolvedValue(mockProduct);

            const result = await ProductRepository.findById(1);

            expect(Product.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockProduct);
        });

        it('trả về null khi không tìm thấy', async () => {
            Product.findByPk.mockResolvedValue(null);

            const result = await ProductRepository.findById(999);

            expect(Product.findByPk).toHaveBeenCalledWith(999);
            expect(result).toBeNull();
        });
    });

    describe('Lấy sản phẩm theo nhiều ID', () => {
        it('trả về danh sách sản phẩm theo ids', async () => {
            const ids = [1, 2];
            const mockProducts = [{ product_id: 1 }, { product_id: 2 }];
            Product.findAll.mockResolvedValue(mockProducts);

            const result = await ProductRepository.findByIds(ids);

            expect(Product.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        product_id: expect.anything()
                    })
                })
            );
            expect(result).toEqual(mockProducts);
        });

        it('trả về mảng rỗng nếu ids là rỗng', async () => {
            const result = await ProductRepository.findByIds([]);
            expect(result).toEqual([]);
        });
    });

    describe('Lấy tất cả sản phẩm', () => {
        it('trả về tất cả sản phẩm', async () => {
            const mockProducts = [{ product_id: 1, name: 'p1' }, { product_id: 2, name: 'p2' }];
            Product.findAll.mockResolvedValue(mockProducts);

            const result = await ProductRepository.findAll();

            expect(Product.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockProducts);
            expect(result.length).toEqual(2);
        });
    });

    describe('Lấy tên và ảnh theo ID', () => {
        it('trả về name và image khi có sản phẩm', async () => {
            Product.findByPk.mockResolvedValue({ name: 'A', image: 'img.png' });

            const result = await ProductRepository.findNameAndImageById(1);

            expect(result).toEqual({ name: 'A', image: 'img.png' });
        });

        it('trả về null khi không có sản phẩm', async () => {
            Product.findByPk.mockResolvedValue(null);

            const result = await ProductRepository.findNameAndImageById(1);

            expect(result).toEqual({ name: null, image: null });
            expect(Product.findByPk).toHaveBeenCalledWith
        });
    });

    describe('Tạo hoặc cập nhật sản phẩm', () => {
        it('cập nhật sản phẩm nếu đã tồn tại', async () => {
            const product = { product_id: 1, name: 'A' };
            const mockInstance = { update: jest.fn().mockResolvedValue({ ...product, name: 'B' }) };
            Product.findByPk.mockResolvedValue(mockInstance);

            const result = await ProductRepository.save(product);

            expect(Product.findByPk).toHaveBeenCalledWith(1);
            expect(mockInstance.update).toHaveBeenCalled();
            expect(result).toEqual({ ...product, name: 'B' });
        });

        it('tạo mới sản phẩm nếu chưa có', async () => {
            const product = { name: 'A' };
            Product.create.mockResolvedValue(product);

            const result = await ProductRepository.save(product);

            expect(Product.create).toHaveBeenCalledWith(product);
            expect(result).toEqual(product);
        });
    });

    describe('Xóa sản phẩm theo ID', () => {
        it('trả về số bản ghi bị xóa', async () => {
            Product.destroy.mockResolvedValue(1);

            const result = await ProductRepository.delete(1);

            expect(Product.destroy).toHaveBeenCalledWith({ where: { product_id: 1 } });
            expect(result).toBe(1);
        });
    });

    describe('Tìm sản phẩm theo tên', () => {
        it('trả về sản phẩm theo tên', async () => {
            const mockProducts = [{ name: 'A' }];
            Product.findAll.mockResolvedValue(mockProducts);

            const result = await ProductRepository.findByName('A');

            expect(Product.findAll).toHaveBeenCalledWith({ where: { name: 'A' } });
            expect(result).toEqual(mockProducts);
        });
    });

    describe('Tìm sản phẩm theo danh mục', () => {
        it('trả về sản phẩm theo category', async () => {
            const mockProducts = [{ category: 'Cat1' }];
            Product.findAll.mockResolvedValue(mockProducts);

            const result = await ProductRepository.findByCategory('Cat1');

            expect(Product.findAll).toHaveBeenCalledWith({ where: { category: 'Cat1' } });
            expect(result).toEqual(mockProducts);
        });
    });

    describe('Cập nhật số lượng tồn kho', () => {
        it('cập nhật tồn kho thành công', async () => {
            const mockProduct = { inventory_qty: 0, save: jest.fn().mockResolvedValue(), product_id: 1 };
            Product.findByPk.mockResolvedValue(mockProduct);

            const result = await ProductRepository.updateInventory(1, 10);

            expect(Product.findByPk).toHaveBeenCalledWith(1);
            expect(mockProduct.inventory_qty).toBe(10);
            expect(mockProduct.save).toHaveBeenCalled();
            expect(result).toEqual(mockProduct);
        });

        it('trả về null nếu không tìm thấy sản phẩm', async () => {
            Product.findByPk.mockResolvedValue(null);

            const result = await ProductRepository.updateInventory(999, 10);

            expect(result).toBeNull();
        });
    });

    describe('Import sản phẩm từ file CSV', () => {
        it('throw error nếu thiếu filePath', async () => {
            await expect(ProductRepository.importFromCSV({}))
                .rejects
                .toThrow('filePath là bắt buộc');
        });

        it('throw error nếu CSV rỗng', async () => {
            fs.readFileSync.mockReturnValue('');

            await expect(
                ProductRepository.importFromCSV({ filePath: '/fake.csv' })
            ).rejects.toThrow();
        });

        it('import sản phẩm mới', async () => {
            fs.readFileSync.mockReturnValue(`
            Tên sản phẩm,Giá hiện tại
            SP A,1000
            SP B,2000
            `.trim());

            //Test csv nên 2 sản phẩm thì gọi 2 findOne
            Product.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            Product.bulkCreate.mockResolvedValue([
                { name: 'SP A' },
                { name: 'SP B' },
            ]);

            const result = await ProductRepository.importFromCSV({ filePath: '/fake.csv' });

            expect(Product.bulkCreate).toHaveBeenCalled();
            expect(result.importedCount).toBe(2);
            expect(result.updatedCount).toBe(0);
            expect(result.failedCount).toBe(0);
        });

        it('update sản phẩm đã tồn tại', async () => {
            fs.readFileSync.mockReturnValue(`
                Tên sản phẩm,Giá hiện tại
                SP A,1000
                `.trim());

            Product.findOne.mockResolvedValue({
                update: jest.fn().mockResolvedValue(),
            });

            const result = await ProductRepository.importFromCSV({ filePath: '/fake.csv' });

            expect(result.updatedCount).toBe(1);
            expect(result.importedCount).toBe(0);
        });

        it('trả lỗi khi thiếu tên sản phẩm', async () => {
            fs.readFileSync.mockReturnValue(`
                Tên sản phẩm,Giá hiện tại
                ,1000
                `.trim());

            const result = await ProductRepository.importFromCSV({ filePath: '/fake.csv' });

            expect(result.failedCount).toBe(1);
            expect(result.errors[0]).toMatchObject({
                field: 'name'
            });
        });

        it('báo lỗi khi trùng tên trong CSV', async () => {
            fs.readFileSync.mockReturnValue(`
            Tên sản phẩm,Giá hiện tại
            SP A,1000
            SP A,2000
            `.trim());

            const result = await ProductRepository.importFromCSV({ filePath: '/fake.csv' });

            expect(result.failedCount).toBe(1);
        });

        it('fallback create từng sản phẩm nếu bulkCreate lỗi', async () => {
            fs.readFileSync.mockReturnValue(`
                Tên sản phẩm,Giá hiện tại
                SP A,1000
                `.trim());

            Product.findOne.mockResolvedValue(null);
            Product.bulkCreate.mockRejectedValue(new Error('bulk error'));
            Product.create.mockResolvedValue({ name: 'SP A' });

            const result = await ProductRepository.importFromCSV({ filePath: '/fake.csv' });
            //console.log(result);
            expect(Product.create).toHaveBeenCalled();
            expect(result.importedCount).toBe(1);
        });

    });

    describe('Export sản phẩm ra CSV', () => {
        it('trả chuỗi rỗng nếu không có sản phẩm', async () => {
            Product.findAll.mockResolvedValue([]);

            const csv = await ProductRepository.exportToCSV();

            expect(csv).toBe('');
        });

        it('export CSV đúng header và data', async () => {
            Product.findAll.mockResolvedValue([
                {
                    name: 'SP A',
                    brand: 'Brand 1',
                    price_current: 1000,
                    status: 'AVAILABLE'
                }
            ]);

            const csv = await ProductRepository.exportToCSV();
            console.log(csv);
            expect(csv).toContain('Tên sản phẩm');
            expect(csv).toContain('SP A');
            expect(csv).toContain('1000');
        });


    });

});