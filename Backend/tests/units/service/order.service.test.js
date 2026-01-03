jest.mock('../../../Infrastructure/Repositories/OrderRepository');
jest.mock('../../../Application/Services/OrderDetailService');
jest.mock('../../../Infrastructure/Repositories/CustomerRepository');
jest.mock('../../../Infrastructure/Repositories/ProductRepository');
jest.mock('../../../Infrastructure/Bus/RabbitMQPublisher');
jest.mock('../../../Application/DTOs/OrderDTO');
jest.mock('../../../Infrastructure/Bus/RabbitMQPublisher');

const OrderRepository = require('../../../Infrastructure/Repositories/OrderRepository');
const OrderService = require('../../../Application/Services/OrderService');
const OrderDetailService = require('../../../Application/Services/OrderDetailService');
const CustomerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const { OrderRequestDTO, OrderResponseDTO } = require('../../../Application/DTOs/OrderDTO');
const Rabbit = require('../../../Infrastructure/Bus/RabbitMQPublisher');

describe('OrderService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo đơn hàng', () => {
        it('tạo đơn hàng thành công', async () => {
            OrderRequestDTO.mockImplementation((p) => (
                {
                    ...p,
                    customer_id: 1,
                    items: [{
                        product_id: 1,
                        quantity: 1
                    }],
                    total_amount: 100
                }));
            OrderDetailService._normalizeDetail.mockImplementation(i => i);
            OrderRepository.sequelize = { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) };
            OrderRepository.create.mockResolvedValue({ id: 1, customer_id: 1 });
            OrderResponseDTO.fromEntity.mockReturnValue({ id: 1, customer_id: 1 });

            const result = await OrderService.createOrder({ customer_id: 1, items: [{ product_id: 1, quantity: 1 }], total_amount: 100 });
            expect(result).toHaveProperty('id', 1);
        });
        it('báo lỗi khi thiếu mã khách hàng', async () => {
            OrderRequestDTO.mockImplementation((p) => ({ ...p, customer_id: null }));
            await expect(OrderService.createOrder({})).rejects.toThrow('Thiếu mã khách hàng');
        });
        it('báo lỗi khi thiếu tổng tiền', async () => {
            OrderRequestDTO.mockImplementation((p) => ({ ...p, customer_id: 1, total_amount: 0 }));
            await expect(OrderService.createOrder({ customer_id: 1, items: [] })).rejects.toThrow('Thiếu tổng tiền');
        });
        it('báo lỗi khi tạo đơn hàng thất bại', async () => {
            OrderRequestDTO.mockImplementation((p) => ({ ...p, customer_id: 1, items: [{ product_id: 1, quantity: 1 }], total_amount: 100 }));
            OrderRepository.sequelize = { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) };
            OrderRepository.create.mockRejectedValue(new Error('DB error'));
            await expect(OrderService.createOrder({ customer_id: 1, items: [{ product_id: 1, quantity: 1 }], total_amount: 100 })).rejects.toThrow('Tạo đơn hàng thất bại: DB error');
        });
    });

    describe('Lấy đơn hàng theo id', () => {
        it('trả về đơn hàng khi tìm thấy', async () => {
            OrderRepository.findById.mockResolvedValue({ order_id: 1, customer_id: 1 });
            CustomerRepository.findById.mockResolvedValue({ full_name: 'Khách A' });
            OrderDetailService.getByOrderId.mockResolvedValue([]);
            OrderResponseDTO.fromEntity.mockReturnValue({ order_id: 1, customer_name: 'Khách A', details: [] });

            const result = await OrderService.getOrderById(1);

            expect(result).toHaveProperty('order_id', 1);
            expect(result).toHaveProperty('customer_name', 'Khách A');
        });
        it('trả về null nếu không tìm thấy', async () => {
            OrderRepository.findById.mockResolvedValue(null);
            const result = await OrderService.getOrderById(999);
            expect(result).toBeNull();
        });
    });

    describe('Lấy tất cả đơn hàng', () => {
        it('trả về danh sách đơn hàng', async () => {
            OrderRepository.findAll.mockResolvedValue([{ order_id: 1 }, { order_id: 2 }]);

            const result = await OrderService.getAllOrders();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });
        it('trả về mảng rỗng nếu không có đơn hàng', async () => {
            OrderRepository.findAll.mockResolvedValue([]);

            const result = await OrderService.getAllOrders();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });


    describe('Cập nhật đơn hàng', () => {
        it('cập nhật order và items', async () => {
            OrderRepository.findById
                .mockResolvedValueOnce({ order_id: 1, customer_id: 1, total_amount: 50 }) // before
                .mockResolvedValueOnce({ order_id: 1, customer_id: 1, total_amount: 100 }); // after

            OrderRepository.sequelize = {
                transaction: jest.fn().mockResolvedValue({
                    commit: jest.fn(),
                    rollback: jest.fn()
                })
            };

            OrderRepository.update = jest.fn();
            OrderDetailService.deleteByOrderId = jest.fn();
            OrderDetailService.createMany = jest.fn();
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([
                { product_id: 1, quantity: 1 },
                { product_id: 2, quantity: 3 }
            ]);

            CustomerRepository.findById.mockResolvedValue({ full_name: 'Khách A' });

            OrderResponseDTO.fromEntity.mockImplementation((order, details) => ({
                ...order,
                details
            }));

            const result = await OrderService.updateOrder(1, {
                items: [{ product_id: 1, quantity: 1 }],
                total_amount: 100
            });

            expect(result.total_amount).toBe(100);
            expect(result.details.length).toBe(2);
            expect(result.customer_name).toBe('Khách A');
        });

        it('báo lỗi khi thiếu mã đơn hàng', async () => {
            await expect(OrderService.updateOrder(null, {})).rejects.toThrow('Thiếu mã đơn hàng');
        });
        it('báo lỗi khi không tìm thấy đơn hàng', async () => {
            OrderRepository.findById.mockResolvedValue(null);
            await expect(OrderService.updateOrder(999, {})).rejects.toThrow('Mã đơn hàng không tồn tại');
        });
        it('báo lỗi khi thiếu tổng tiền khi cập nhật kèm items', async () => {
            OrderRepository.findById.mockResolvedValue({ order_id: 1, customer_id: 1 });
            await expect(OrderService.updateOrder(1, { items: [{ product_id: 1, quantity: 1 }] })).rejects.toThrow('Thiếu tổng tiền');
        });
    });

    describe('Cập nhật trạng thái đơn hàng', () => {
        it('cập nhật trạng thái thành công và publish order.paid event', async () => {
            const commit = jest.fn();
            const rollback = jest.fn();

            OrderRepository.sequelize = {
                transaction: jest.fn().mockResolvedValue({ commit, rollback })
            };

            OrderRepository.updateStatus = jest.fn().mockResolvedValue();
            OrderRepository.findById = jest.fn().mockResolvedValue({
                order_id: 1,
                customer_id: 10,
                status: 'paid',
                total_amount: 100
            });

            Rabbit.publish = jest.fn().mockResolvedValue();

            OrderResponseDTO.fromEntity.mockReturnValue({
                order_id: 1,
                status: 'paid'
            });

            const result = await OrderService.updateStatus(1, 'paid');

            // update + transaction
            expect(OrderRepository.updateStatus).toHaveBeenCalledWith(
                1,
                'paid',
                expect.anything()
            );
            expect(commit).toHaveBeenCalled();
            expect(rollback).not.toHaveBeenCalled();

            // publish event
            expect(Rabbit.publish).toHaveBeenCalledWith(
                'order.paid',
                expect.objectContaining({
                    order_id: 1,
                    customer_id: 10,
                    total_amount: 100,
                    status: 'paid'
                })
            );

            // response
            expect(result).toEqual({ order_id: 1, status: 'paid' });
        });

        it('báo lỗi khi thiếu mã đơn hàng', async () => {
            await expect(OrderService.updateStatus(null, 'paid')).rejects.toThrow('Thiếu mã đơn hàng');
        });
    });

    describe('Xóa đơn hàng', () => {
        it('xóa đơn hàng thành công', async () => {
            OrderRepository.sequelize = { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) };
            OrderDetailService.deleteByOrderId = jest.fn().mockResolvedValue();
            OrderRepository.delete = jest.fn().mockResolvedValue();
            const result = await OrderService.deleteOrder(1);
            expect(OrderDetailService.deleteByOrderId).toHaveBeenCalledWith(1, expect.anything());
            expect(OrderRepository.delete).toHaveBeenCalledWith(1, expect.anything());
            expect(result).toBe(true);
        });
        it('báo lỗi khi thiếu mã đơn hàng', async () => {
            await expect(OrderService.deleteOrder(null)).rejects.toThrow('Thiếu mã đơn hàng');
        });
    });

    describe('Liệt kê đơn hàng theo khách hàng', () => {
        it('trả về danh sách đơn hàng theo customer', async () => {
            OrderRepository.listByCustomer = jest.fn().mockResolvedValue([{ order_id: 1 }, { order_id: 2 }]);
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([]);
            OrderResponseDTO.fromEntity.mockImplementation((o, d) => ({ ...o, details: d }));
            const result = await OrderService.listByCustomer(1);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });
        it('trả về mảng rỗng nếu không có đơn hàng', async () => {
            OrderRepository.listByCustomer = jest.fn().mockResolvedValue([]);
            const result = await OrderService.listByCustomer(1);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('Thêm sản phẩm vào đơn hàng', () => {
        it('thêm sản phẩm thành công', async () => {
            OrderRepository.findById = jest.fn().mockResolvedValue({ order_id: 1, status: 'draft_cart' });
            OrderDetailService._normalizeDetail = jest.fn().mockImplementation(i => i);
            OrderRepository.sequelize = { transaction: jest.fn().mockResolvedValue({ commit: jest.fn(), rollback: jest.fn() }) };
            OrderDetailService.createMany = jest.fn().mockResolvedValue();
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([{ line_total: 100 }]);
            OrderRepository.update = jest.fn().mockResolvedValue();
            OrderRepository.findById = jest.fn().mockResolvedValue({ order_id: 1, status: 'draft_cart' });
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([{ line_total: 100 }]);
            OrderResponseDTO.fromEntity = jest.fn().mockReturnValue({ order_id: 1 });
            
            const result = await OrderService.addItem(1, { product_id: 1, quantity: 1 });
            
            expect(result).toHaveProperty('order_id', 1);
        });
        it('báo lỗi khi thiếu order_id', async () => {
            await expect(OrderService.addItem(null, { product_id: 1 })).rejects.toThrow('Thiếu order_id');
        });
        it('báo lỗi khi order không tồn tại', async () => {
            OrderRepository.findById = jest.fn().mockResolvedValue(null);
            await expect(OrderService.addItem(999, { product_id: 1 })).rejects.toThrow('Order không tồn tại');
        });
        it('báo lỗi khi trạng thái không phải draft_cart', async () => {
            OrderRepository.findById = jest.fn().mockResolvedValue({ order_id: 1, status: 'completed' });
            await expect(OrderService.addItem(1, { product_id: 1 })).rejects.toThrow('Chỉ thêm sản phẩm khi ở trạng thái draft_cart');
        });
    });

    describe('Lấy đơn hàng theo khoảng thời gian', () => {
        it('trả về danh sách đơn hàng theo khoảng ngày', async () => {
            OrderRepository.getOrdersByDateRange = jest.fn().mockResolvedValue([{ order_id: 1 }, { order_id: 2 }]);
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([]);
            OrderResponseDTO.fromEntity.mockImplementation((o, d) => ({ ...o, details: d }));
            
            const result = await OrderService.getOrdersByDateRange('2025-01-01', '2025-12-31');
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });
        it('trả về mảng rỗng nếu không có đơn hàng', async () => {
            OrderRepository.getOrdersByDateRange = jest.fn().mockResolvedValue([]);
            const result = await OrderService.getOrdersByDateRange('2025-01-01', '2025-12-31');
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });
});