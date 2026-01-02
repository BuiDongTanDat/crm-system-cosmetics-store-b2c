const OrderRepository = require('../../../Infrastructure/Repositories/OrderRepository');
const Order = require('../../../Domain/Entities/Order');

jest.mock('../../../Domain/Entities/Order');

describe('OrderRepository', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo order', () => {
        it('tạo mới order', async () => {
            const orderData = { customer_id: 1, total: 100, status: 'pending' };
            Order.create.mockResolvedValue(orderData);

            const result = await OrderRepository.create(orderData);

            expect(Order.create).toHaveBeenCalledWith(orderData, { transaction: null });
            expect(result).toEqual(orderData);
        });

        it('tạo order với transaction', async () => {
            const orderData = { customer_id: 1, total: 100 };
            const transaction = {};
            Order.create.mockResolvedValue(orderData);

            const result = await OrderRepository.create(orderData, transaction);

            expect(Order.create).toHaveBeenCalledWith(orderData, { transaction });
            expect(result).toEqual(orderData);
        });
    });

    describe('Lấy order theo ID', () => {
        it('trả về order khi tìm thấy', async () => {
            const mockOrder = { order_id: 1, customer_id: 1, total: 100 };
            Order.findOne.mockResolvedValue(mockOrder);

            const result = await OrderRepository.findById(1);

            expect(Order.findOne).toHaveBeenCalledWith({ where: { order_id: 1 } });
            expect(result).toEqual(mockOrder);
        });

        it('trả về null khi không tìm thấy', async () => {
            Order.findOne.mockResolvedValue(null);

            const result = await OrderRepository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('Lấy order theo leadId', () => {
        it('trả về order khi tìm thấy', async () => {
            const mockOrder = { order_id: 1, lead_id: 5, total: 100 };
            Order.findOne.mockResolvedValue(mockOrder);

            const result = await OrderRepository.findbyleadId(5);

            expect(Order.findOne).toHaveBeenCalledWith({ where: { lead_id: 5 } });
            expect(result).toEqual(mockOrder);
        });

        it('trả về null khi không tìm thấy', async () => {
            Order.findOne.mockResolvedValue(null);

            const result = await OrderRepository.findbyleadId(999);

            expect(result).toBeNull();
        });
    });

    describe('Lấy tất cả orders', () => {
        it('trả về tất cả orders', async () => {
            const mockOrders = [
                { order_id: 1, customer_id: 1, total: 100 },
                { order_id: 2, customer_id: 2, total: 200 }
            ];
            Order.findAll.mockResolvedValue(mockOrders);

            const result = await OrderRepository.findAll();

            expect(Order.findAll).toHaveBeenCalled();
            expect(result).toEqual(mockOrders);
            expect(result.length).toBe(2);
        });
    });

    describe('Cập nhật order', () => {
        it('cập nhật order khi tồn tại', async () => {
            const orderId = 1;
            const patch = { total: 150 };
            const updatedOrder = { order_id: 1, customer_id: 1, total: 150 };
            Order.update.mockResolvedValue([1]);
            Order.findOne.mockResolvedValue(updatedOrder);

            const result = await OrderRepository.update(orderId, patch);

            expect(Order.update).toHaveBeenCalledWith(patch, {
                where: { order_id: orderId },
                transaction: null
            });
            expect(result).toEqual(updatedOrder);
        });

        it('cập nhật order với transaction', async () => {
            const orderId = 1;
            const patch = { total: 150 };
            const transaction = {};
            const updatedOrder = { order_id: 1, total: 150 };
            Order.update.mockResolvedValue([1]);
            Order.findOne.mockResolvedValue(updatedOrder);

            const result = await OrderRepository.update(orderId, patch, transaction);

            expect(Order.update).toHaveBeenCalledWith(patch, {
                where: { order_id: orderId },
                transaction
            });
            expect(result).toEqual(updatedOrder);
        });
    });

    describe('Cập nhật status order', () => {
        it('cập nhật status thành công', async () => {
            const orderId = 1;
            const newStatus = 'shipped';
            const updatedOrder = { order_id: 1, status: 'shipped' };
            Order.update.mockResolvedValue(1);
            Order.findOne.mockResolvedValue(updatedOrder);

            const result = await OrderRepository.updateStatus(orderId, newStatus);

            expect(Order.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: newStatus }),
                {
                    where: { order_id: orderId },
                    transaction: null
                }
            );
            expect(result).toEqual(updatedOrder);
        });

        it('cập nhật status với transaction', async () => {
            const orderId = 1;
            const newStatus = 'delivered';
            const transaction = {};
            const updatedOrder = { order_id: 1, status: 'delivered' };
            Order.update.mockResolvedValue([1]);
            Order.findOne.mockResolvedValue(updatedOrder);

            const result = await OrderRepository.updateStatus(orderId, newStatus, transaction);

            expect(Order.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: newStatus }),
                {
                    where: { order_id: orderId },
                    transaction
                }
            );
            expect(result).toEqual(updatedOrder);
        });
    });

    describe('Xóa order', () => {
        it('xóa order theo ID', async () => {
            Order.destroy.mockResolvedValue(1);

            const result = await OrderRepository.delete(1);

            expect(Order.destroy).toHaveBeenCalledWith({
                where: { order_id: 1 },
                transaction: null
            });
            expect(result).toBe(1);
        });

        it('xóa order với transaction', async () => {
            const transaction = {};
            Order.destroy.mockResolvedValue(1);

            const result = await OrderRepository.delete(1, transaction);

            expect(Order.destroy).toHaveBeenCalledWith({
                where: { order_id: 1 },
                transaction
            });
            expect(result).toBe(1);
        });

        it('không xóa order nếu không tồn tại', async () => {
            Order.destroy.mockResolvedValue(0);

            const result = await OrderRepository.delete(999);

            expect(result).toBe(0);
        });
    });

    describe('Lấy danh sách order theo customerId', () => {
        it('trả về orders của khách hàng', async () => {
            const mockOrders = [
                { order_id: 1, customer_id: 1, status: 'pending' },
                { order_id: 2, customer_id: 1, status: 'shipped' }
            ];
            Order.findAll.mockResolvedValue(mockOrders);

            const result = await OrderRepository.listByCustomer(1);

            expect(Order.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { customer_id: 1 },
                    order: [['order_date', 'DESC']]
                })
            );
            expect(result).toEqual(mockOrders);
        });

        it('lọc orders theo status', async () => {
            const mockOrders = [{ order_id: 1, customer_id: 1, status: 'pending' }];
            Order.findAll.mockResolvedValue(mockOrders);

            const result = await OrderRepository.listByCustomer(1, { status: 'pending' });

            expect(Order.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { customer_id: 1, status: 'pending' }
                })
            );
            expect(result).toEqual(mockOrders);
        });

        it('áp dụng limit và offset', async () => {
            const mockOrders = [{ order_id: 1, customer_id: 1 }];
            Order.findAll.mockResolvedValue(mockOrders);

            const result = await OrderRepository.listByCustomer(1, { limit: 10, offset: 0 });

            expect(Order.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                    offset: 0
                })
            );
            expect(result).toEqual(mockOrders);
        });

        it('chỉ định attributes cần lấy', async () => {
            const mockOrders = [{ order_id: 1, order_date: '2025-01-01' }];
            Order.findAll.mockResolvedValue(mockOrders);

            const result = await OrderRepository.listByCustomer(1, { attributes: ['order_id', 'order_date'] });

            expect(Order.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    attributes: ['order_id', 'order_date']
                })
            );
            expect(result).toEqual(mockOrders);
        });
    });

    describe('Lấy orders theo khoảng thời gian', () => {
        it('trả về orders trong khoảng ngày', async () => {
            const from = '2025-01-01';
            const to = '2025-12-31';
            const mockOrders = [
                { order_id: 1, order_date: '2024-06-15' },
                { order_id: 2, order_date: '2024-09-20' }
            ];
            const betweenSymbol = Symbol.for('between');
            const Op = { between: betweenSymbol };

            Order.sequelize = { Op };
            Order.findAll.mockResolvedValue(mockOrders);

            const result = await OrderRepository.getOrdersByDateRange(from, to);

            expect(Order.findAll).toHaveBeenCalledWith({
                where: {
                    order_date: {
                        [betweenSymbol]: [from, to]
                    }
                }
            });
            expect(result).toEqual(mockOrders);
        });

        it('trả về mảng rỗng nếu không có orders', async () => {
            Order.findAll.mockResolvedValue([]);

            const result = await OrderRepository.getOrdersByDateRange('2024-01-01', '2024-01-02');

            expect(result).toEqual([]);
        });
    });
});
