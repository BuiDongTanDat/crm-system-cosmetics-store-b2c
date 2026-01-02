const CustomerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const Customer = require('../../../Domain/Entities/Customer');

jest.mock('../../../Domain/Entities/Customer');

describe('CustomerRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo khách hàng', () => {
        it('tạo mới khách hàng', async () => {
            const customerData = { email: 'a@email.com', phone: '123', name: 'A' };
            Customer.create.mockResolvedValue(customerData);

            const result = await CustomerRepository.create(customerData);

            expect(Customer.create).toHaveBeenCalledWith(customerData);
            expect(result).toEqual(customerData);
        });
    });

    describe('Cập nhật khách hàng', () => {
        it('cập nhật khi tồn tại', async () => {
            const customerId = 1;
            const patch = { name: 'B' };
            const mockInstance = {
                name: 'A',
                update: jest.fn().mockImplementation(function (updates) {
                    this.name = updates.name;
                    return this;
                })
            };

            Customer.findByPk.mockResolvedValue(mockInstance);

            const result = await CustomerRepository.update(customerId, patch);

            expect(Customer.findByPk).toHaveBeenCalledWith(customerId);
            expect(mockInstance.update).toHaveBeenCalledWith(patch);
            expect(result).toBe(mockInstance);
            expect(result.name).toBe('B');
        });
        it('ném lỗi khi không tìm thấy', async () => {
            Customer.findByPk.mockResolvedValue(null);
            await expect(CustomerRepository.update(999, { name: 'X' })).rejects.toThrow('Customer not found');
        });
    });

    describe('Lấy khách hàng theo ID', () => {
        it('trả về khách hàng khi tìm thấy', async () => {
            const mockCustomer = { customer_id: 1, name: 'A' };
            Customer.findByPk.mockResolvedValue(mockCustomer);

            const result = await CustomerRepository.findById(1);

            expect(Customer.findByPk).toHaveBeenCalledWith(1, { transaction: undefined });
            expect(result).toEqual(mockCustomer);
        });
        it('trả về null khi không tìm thấy', async () => {
            Customer.findByPk.mockResolvedValue(null);
            const result = await CustomerRepository.findById(999);
            expect(result).toBeNull();
        });
    });

    describe('Lấy tất cả khách hàng', () => {
        it('trả về tất cả khách hàng', async () => {
            const mockCustomers = [{ customer_id: 1, name: 'A' }, { customer_id: 2, name: 'B' }];

            Customer.findAll.mockResolvedValue(mockCustomers);

            const result = await CustomerRepository.findAll();

            expect(Customer.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockCustomers);
            expect(result.length).toBe(2);
        });
    });

    describe('Xoá khách hàng', () => {
        it('xoá khách hàng theo ID', async () => {
            Customer.destroy.mockResolvedValue(1);

            const result = await CustomerRepository.delete(1);

            expect(Customer.destroy).toHaveBeenCalledWith({ where: { customer_id: 1 } });
        });
    });

    describe('Tìm khách hàng theo email', () => {
        it('trả về khách hàng theo email', async () => {
            const mockCustomer = { email: 'a@email.com' };
            Customer.findOne.mockResolvedValue(mockCustomer);

            const result = await CustomerRepository.findByEmail('a@email.com');

            expect(Customer.findOne).toHaveBeenCalledWith({ where: { email: 'a@email.com' } });
            expect(result).toEqual(mockCustomer);
        });
    });

    describe('Tìm khách hàng theo phone', () => {
        it('trả về khách hàng theo phone', async () => {
            const mockCustomer = { phone: '123' };
            Customer.findOne.mockResolvedValue(mockCustomer);

            const result = await CustomerRepository.findByPhone('123');

            expect(Customer.findOne).toHaveBeenCalledWith({ where: { phone: '123' } });
            expect(result).toEqual(mockCustomer);
        });
    });

    describe('Tìm khách hàng theo tag', () => {
        it('trả về khách hàng theo tag', async () => {
            const mockCustomers = [{ tags: ['vip'] }];
            Customer.findAll.mockResolvedValue(mockCustomers);
            Customer.sequelize = { Op: { contains: 'contains' } };

            const result = await CustomerRepository.findByTag('vip');

            expect(Customer.findAll).toHaveBeenCalledWith({ where: { tags: { contains: ['vip'] } } });
            expect(result).toEqual(mockCustomers);
        });
    });

    describe('Tìm khách hàng theo nguồn', () => {
        it('trả về khách hàng theo source', async () => {
            const mockCustomers = [{ source: 'fb' }];
            Customer.findAll.mockResolvedValue(mockCustomers);

            const result = await CustomerRepository.findBySource('fb');

            expect(Customer.findAll).toHaveBeenCalledWith({ where: { source: 'fb' } });
            expect(result).toEqual(mockCustomers);
        });
    });

    describe('Lấy khách hàng theo khoảng ngày', () => {
        it('trả về khách hàng theo khoảng ngày', async () => {
            const from = '2025-01-01';
            const to = '2025-12-31';
            const mockCustomers = [{ customer_id: 1, name: 'A' }, { customer_id: 2, name: 'B' }];
            const betweenSymbol = Symbol.for('between');

            /* 
            Hàm gốc dùng Op.between từ sequelize:
            created_at: {
                      [Op.between]: [from, to]
                    }
                      
                    */
            const Op = { between: betweenSymbol };
            Customer.sequelize = { Op };
            Customer.findAll.mockResolvedValue(mockCustomers);

            const result = await CustomerRepository.getCustomersByDateRange(from, to);

            expect(Customer.findAll).toHaveBeenCalledWith({ where: { created_at: { [betweenSymbol]: [from, to] } } });
            expect(result).toEqual(mockCustomers);
        });
    });

    describe('Thêm/xoá tag', () => {
        it('thêm tag khi có khách hàng', async () => {
            const mockCustomer = { addTag: jest.fn(), save: jest.fn().mockResolvedValue(), customer_id: 1 };
            CustomerRepository.findById = jest.fn().mockResolvedValue(mockCustomer);

            const result = await CustomerRepository.addTag(1, 'vip');

            expect(mockCustomer.addTag).toHaveBeenCalledWith('vip');
            expect(mockCustomer.save).toHaveBeenCalled();
            expect(result).toEqual(mockCustomer);
        });
        it('trả về null nếu không có khách hàng', async () => {
            CustomerRepository.findById = jest.fn().mockResolvedValue(null);

            const result = await CustomerRepository.addTag(999, 'vip');

            expect(result).toBeNull();
        });
        it('xoá tag khi có khách hàng', async () => {
            const mockCustomer = { removeTag: jest.fn(), save: jest.fn().mockResolvedValue(), customer_id: 1 };
            CustomerRepository.findById = jest.fn().mockResolvedValue(mockCustomer);

            const result = await CustomerRepository.removeTag(1, 'vip');

            expect(mockCustomer.removeTag).toHaveBeenCalledWith('vip');
            expect(mockCustomer.save).toHaveBeenCalled();
            expect(result).toEqual(mockCustomer);
        });
        it('trả về null nếu không có khách hàng', async () => {
            CustomerRepository.findById = jest.fn().mockResolvedValue(null);

            const result = await CustomerRepository.removeTag(999, 'vip');

            expect(result).toBeNull();
        });
    });

    describe('Thêm/xoá social channel', () => {
        it('thêm social channel khi có khách hàng', async () => {
            const mockCustomer = { addSocialChannel: jest.fn(), save: jest.fn().mockResolvedValue(), customer_id: 1 };
            CustomerRepository.findById = jest.fn().mockResolvedValue(mockCustomer);

            const result = await CustomerRepository.addSocialChannel(1, 'fb', 'acc');

            expect(mockCustomer.addSocialChannel).toHaveBeenCalledWith('fb', 'acc');
            expect(mockCustomer.save).toHaveBeenCalled();
            expect(result).toEqual(mockCustomer);
        });
        it('trả về null nếu không có khách hàng', async () => {
            CustomerRepository.findById = jest.fn().mockResolvedValue(null);

            const result = await CustomerRepository.addSocialChannel(999, 'fb', 'acc');

            expect(result).toBeNull();
        });
        it('xoá social channel khi có khách hàng', async () => {
            const mockCustomer = { removeSocialChannel: jest.fn(), save: jest.fn().mockResolvedValue(), customer_id: 1 };
            CustomerRepository.findById = jest.fn().mockResolvedValue(mockCustomer);

            const result = await CustomerRepository.removeSocialChannel(1, 'fb');

            expect(mockCustomer.removeSocialChannel).toHaveBeenCalledWith('fb');
            expect(mockCustomer.save).toHaveBeenCalled();
            expect(result).toEqual(mockCustomer);
        });
        it('trả về null nếu không có khách hàng', async () => {
            CustomerRepository.findById = jest.fn().mockResolvedValue(null);
            const result = await CustomerRepository.removeSocialChannel(999, 'fb');
            expect(result).toBeNull();
        });
    });

    describe('TÌm hoặc tạo customer', () => {
        it('tìm theo email nếu có', async () => {
            const payload = { email: 'a@email.com' };
            Customer.findOne.mockResolvedValueOnce({ email: 'a@email.com' });

            const result = await CustomerRepository.findOrCreateSmart(payload);

            expect(result).toEqual({ email: 'a@email.com' });
        });
        it('tìm theo phone nếu không có email', async () => {
            const payload = { phone: '123' };
            Customer.findOne.mockResolvedValueOnce(null);
            Customer.findOne.mockResolvedValueOnce({ email: 'a@email.com', name: 'A', phone: '123' });

            const result = await CustomerRepository.findOrCreateSmart(payload);

            expect(result).toEqual({ email: 'a@email.com', name: 'A', phone: '123' });
        });
        it('tạo mới nếu không có email/phone', async () => {
            const payload = { name: 'A' };
            Customer.findOne.mockResolvedValueOnce(null);
            Customer.findOne.mockResolvedValueOnce(null);
            Customer.create.mockResolvedValue(payload);

            const result = await CustomerRepository.findOrCreateSmart(payload);

            expect(result).toEqual(payload);
        });
    });

    describe('Liệt kê danh sách Email', () => {
        it('trả về danh sách email', async () => {
            const mockRows = [{ email: 'a@email.com' }, { email: 'b@email.com' }];
            Customer.findAll.mockResolvedValue(mockRows);

            const result = await CustomerRepository.listEmails();
            // Do trả về dạng object
            expect(result).toEqual(mockRows.map(r => r.email));
        });
    });

    describe('Tìm email theo ids', () => {
        it('trả về email theo ids', async () => {
            const mockRows = [{ email: 'a@email.com' }, { email: 'b@email.com' }];

            Customer.findAll.mockResolvedValue(mockRows);

            const result = await CustomerRepository.findEmailsByIds([1,2]);

            expect(result).toEqual(mockRows.map(r => r.email));
        });
    });

    describe('Tìm email theo điều kiện', () => {
        it('trả về email theo điều kiện', async () => {
            const mockRows = [{ email: 'cus@email.com' }];
            Customer.findAll.mockResolvedValue(mockRows);
            
            const cond = { is_active: true };
            
            const result = await CustomerRepository.findEmailsByConditions(cond);
            expect(result).toEqual(['cus@email.com']);
        });
    });
});
