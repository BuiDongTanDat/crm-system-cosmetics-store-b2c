jest.mock('../../../Infrastructure/Repositories/OrderRepository');
jest.mock('../../../Application/Services/OrderDetailService');
jest.mock('../../../Infrastructure/Repositories/CustomerRepository');
jest.mock('../../../Infrastructure/Repositories/ProductRepository');
jest.mock('../../../Infrastructure/Repositories/LeadRepository');
jest.mock('../../../Infrastructure/Bus/RabbitMQPublisher');
jest.mock('../../../Application/Services/LeadService');

const OrderRepository = require('../../../Infrastructure/Repositories/OrderRepository');
const OrderService = require('../../../Application/Services/OrderService');
const OrderDetailService = require('../../../Application/Services/OrderDetailService');
const CustomerRepository = require('../../../Infrastructure/Repositories/CustomerRepository');
const ProductRepository = require('../../../Infrastructure/Repositories/ProductRepository');
const LeadRepository = require('../../../Infrastructure/Repositories/LeadRepository');
const Rabbit = require('../../../Infrastructure/Bus/RabbitMQPublisher');
const LeadService = require('../../../Application/Services/LeadService');

describe('OrderService', () => {
    let mockTransaction;

    beforeEach(() => {
        mockTransaction = {
            commit: jest.fn(),
            rollback: jest.fn()
        };
        OrderRepository.sequelize = {
            transaction: jest.fn(async (cb) => {
                if (typeof cb === 'function') {
                    const result = await cb(mockTransaction);
                    return result;
                }
                return mockTransaction;
            })
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Tạo đơn hàng', () => {
        it('tạo đơn hàng thành công với customer_id', async () => {
            const orderPayload = {
                customer_id: 1,
                items: [{ product_id: 1, quantity: 2, unit_price: 50, total_price: 100 }],
                total_amount: 100,
                payment_method: 'cash',
                status: 'draft_cart',
                channel: 'web'
            };

            const createdOrder = {
                order_id: 1,
                customer_id: 1,
                total_amount: 100,
                status: 'draft_cart',
                order_date: new Date(),
                currency: 'VND'
            };

            const createdDetails = [{
                order_detail_id: 1,
                order_id: 1,
                product_id: 1,
                quantity: 2,
                unit_price: 50,
                line_total: 100
            }];

            OrderDetailService._normalizeDetail = jest.fn().mockImplementation(i => ({
                product_id: i.product_id,
                quantity: i.quantity,
                unit_price: i.unit_price,
                line_total: i.total_price || (i.quantity * i.unit_price)
            }));

            OrderRepository.create = jest.fn().mockResolvedValue(createdOrder);
            OrderDetailService.createMany = jest.fn().mockResolvedValue(createdDetails);
            Rabbit.publish = jest.fn().mockResolvedValue();

            const result = await OrderService.createOrder(orderPayload);

            expect(OrderRepository.create).toHaveBeenCalled();
            expect(OrderDetailService.createMany).toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(Rabbit.publish).toHaveBeenCalledWith('order.created', expect.any(Object));
            expect(result.order_id).toBe(1);
        });

        it('tạo đơn hàng và tạo lead cho khách guest', async () => {
            const orderPayload = {
                phone: '0123456789',
                email: 'test@example.com',
                full_name: 'Test User',
                items: [{ product_id: 1, quantity: 1, unit_price: 100, total_price: 100 }],
                total_amount: 100
            };

            const createdLead = { ok: true, data: { lead_id: 555 } };
            const createdOrder = {
                order_id: 1,
                customer_id: null, // Guest thì customer_id có thể null
                lead_id: 555,
                total_amount: 100
            };

            // Mock các repository/service
            CustomerRepository.findByEmail = jest.fn().mockResolvedValue(null);
            CustomerRepository.findByPhone = jest.fn().mockResolvedValue(null);

            // Quan trọng: Mock LeadService thay vì CustomerRepository (Ko có cus nên tự tạo lead)
            LeadService.createLead = jest.fn().mockResolvedValue(createdLead);
            OrderRepository.create = jest.fn().mockResolvedValue(createdOrder);
            OrderDetailService._normalizeDetail = jest.fn().mockImplementation(i => i);
            OrderDetailService.createMany = jest.fn().mockResolvedValue([]);
            Rabbit.publish = jest.fn().mockResolvedValue();

            const result = await OrderService.createOrder(orderPayload);
            //console.log(result);

            // Kiểm tra kết quả
            expect(LeadService.createLead).toHaveBeenCalled();
            expect(result.customer_id).toBeNull();
        });

        it('báo lỗi khi thiếu tổng tiền', async () => {
            const orderPayload = {
                customer_id: 1,
                items: [{ product_id: 1, quantity: 1 }],
                total_amount: 0
            };

            OrderDetailService._normalizeDetail = jest.fn().mockImplementation(i => i);

            await expect(OrderService.createOrder(orderPayload)).rejects.toThrow('Thiếu tổng tiền');
        });
    });

    describe('Lấy đơn hàng theo id', () => {
        it('trả về đơn hàng khi tìm thấy', async () => {
            const order = {
                order_id: 1,
                customer_id: 1,
                total_amount: 100
            };

            const customer = { customer_id: 1, full_name: 'Khách A' };
            const details = [{ product_id: 1, quantity: 1 }];
            const product = { name: 'Sản phẩm 1', image: 'img.jpg' };

            OrderRepository.findById = jest.fn().mockResolvedValue(order);
            CustomerRepository.findById = jest.fn().mockResolvedValue(customer);
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue(details);
            ProductRepository.findNameAndImageById = jest.fn().mockResolvedValue(product);

            const result = await OrderService.getOrderById(1);

            expect(OrderRepository.findById).toHaveBeenCalledWith(1);
            expect(result.order_id).toBe(1);
            expect(result.customer_name).toBe('Khách A');
        });

        it('trả về null nếu không tìm thấy', async () => {
            OrderRepository.findById = jest.fn().mockResolvedValue(null);

            const result = await OrderService.getOrderById(999);

            expect(result).toBeNull();
        });

        it('báo lỗi khi thiếu orderId', async () => {
            await expect(OrderService.getOrderById(null)).rejects.toThrow('Thiếu mã đơn hàng');
        });
    });

    describe('Lấy tất cả đơn hàng', () => {
        it('trả về danh sách đơn hàng', async () => {
            const orders = [
                { order_id: 1, customer_id: 1 },
                { order_id: 2, customer_id: 2 }
            ];

            OrderRepository.findAll = jest.fn().mockResolvedValue(orders);
            CustomerRepository.findById = jest.fn().mockResolvedValue({ full_name: 'Customer' });
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([]);

            const result = await OrderService.getAllOrders();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });

        it('trả về mảng rỗng nếu không có đơn hàng', async () => {
            OrderRepository.findAll = jest.fn().mockResolvedValue([]);

            const result = await OrderService.getAllOrders();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe('Cập nhật đơn hàng', () => {
        it('cập nhật order và items thành công', async () => {
            const existingOrder = {
                order_id: 1,
                customer_id: 1,
                total_amount: 50
            };

            const updatedOrder = {
                order_id: 1,
                customer_id: 1,
                total_amount: 150
            };

            OrderRepository.findById = jest.fn()
                .mockResolvedValueOnce(existingOrder)
                .mockResolvedValueOnce(updatedOrder);
            OrderRepository.update = jest.fn().mockResolvedValue();
            OrderDetailService.deleteByOrderId = jest.fn().mockResolvedValue();
            OrderDetailService.createMany = jest.fn().mockResolvedValue([]);
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([]);
            OrderDetailService._normalizeDetail = jest.fn().mockImplementation(i => i);
            CustomerRepository.findById = jest.fn().mockResolvedValue({ full_name: 'Customer A' });

            const result = await OrderService.updateOrder(1, {
                items: [{ product_id: 1, quantity: 3, unit_price: 50 }],
                total_amount: 150
            });

            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(result.total_amount).toBe(150);
        });

        it('báo lỗi khi thiếu mã đơn hàng', async () => {
            await expect(OrderService.updateOrder(null, {})).rejects.toThrow('Thiếu mã đơn hàng');
        });

        it('báo lỗi khi không tìm thấy đơn hàng', async () => {
            OrderRepository.findById = jest.fn().mockResolvedValue(null);

            await expect(OrderService.updateOrder(999, {})).rejects.toThrow('Mã đơn hàng không tồn tại');
        });

        it('báo lỗi khi thiếu tổng tiền khi cập nhật kèm items', async () => {
            OrderRepository.findById = jest.fn().mockResolvedValue({ order_id: 1 });
            OrderDetailService._normalizeDetail = jest.fn().mockImplementation(i => i);

            await expect(OrderService.updateOrder(1, {
                items: [{ product_id: 1, quantity: 1 }],
                total_amount: 0
            })).rejects.toThrow('Thiếu tổng tiền');
        });
    });

    describe('Cập nhật trạng thái đơn hàng', () => {
        it('cập nhật trạng thái thành công và publish order.paid event', async () => {
            // Chuẩn bị dữ liệu mẫu (Thêm lead_id để test được cả phần convert lead)
            const updatedOrder = {
                order_id: 1,
                customer_id: 10,
                lead_id: 55, // Thêm cái này
                status: 'paid',
                total_amount: 100,
                currency: 'VND',
                payment_method: 'cod',
                shipping_address: 'Hanoi'
            };

            // Mock Transaction 
            const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };
            OrderRepository.sequelize = {
                transaction: jest.fn().mockResolvedValue(mockTransaction)
            };

            // Mock các phương thức Repository (Phải khớp tên hàm trong code)
            OrderRepository.update = jest.fn().mockResolvedValue([1]);
            OrderRepository.findById = jest.fn().mockResolvedValue(updatedOrder);
            LeadService.autoConvertLead = jest.fn().mockResolvedValue({
                ok: true,
                data: { customer_id: 10 }
            });
            Rabbit.publish = jest.fn().mockResolvedValue();

            const result = await OrderService.updateStatus(1, 'paid');


            // Kiểm tra gọi hàm update vào DB (lưu ý: code truyền 3 tham số)
            expect(OrderRepository.update).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ status: 'paid' }),
                mockTransaction
            );

            // Kiểm tra transaction đã commit
            expect(mockTransaction.commit).toHaveBeenCalled();

            // Kiểm tra gọi convert lead (vì status là paid và có lead_id)
            expect(LeadService.autoConvertLead).toHaveBeenCalledWith(55, expect.any(Object));

            // Kiểm tra RabbitMQ đã publish đúng event
            expect(Rabbit.publish).toHaveBeenCalledWith('order.paid', expect.objectContaining({
                order_id: 1,
                status: 'paid',
                customer_id: 10
            }));

            // Kiểm tra kết quả trả về
            expect(result.status).toBe('paid');
        });

        it('auto-convert lead khi order paid có lead_id', async () => {
            const updatedOrder = {
                order_id: 1,
                customer_id: 10,
                lead_id: 5,
                status: 'paid',
                total_amount: 100
            };

            OrderRepository.updateStatus = jest.fn().mockResolvedValue();
            OrderRepository.findById = jest.fn().mockResolvedValue(updatedOrder);
            LeadService.autoConvertLead = jest.fn().mockResolvedValue({ ok: true });
            Rabbit.publish = jest.fn().mockResolvedValue();

            await OrderService.updateStatus(1, 'paid');

            expect(LeadService.autoConvertLead).toHaveBeenCalledWith(5, expect.objectContaining({
                orderId: 1
            }));
        });

        it('báo lỗi khi thiếu mã đơn hàng', async () => {
            await expect(OrderService.updateStatus(null, 'paid')).rejects.toThrow('Thiếu mã đơn hàng');
        });
    });

    describe('Xóa đơn hàng', () => {
        it('xóa đơn hàng thành công', async () => {
            OrderDetailService.deleteByOrderId = jest.fn().mockResolvedValue();
            OrderRepository.delete = jest.fn().mockResolvedValue();

            const result = await OrderService.deleteOrder(1);

            expect(OrderDetailService.deleteByOrderId).toHaveBeenCalledWith(1, mockTransaction);
            expect(OrderRepository.delete).toHaveBeenCalledWith(1, mockTransaction);
            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('báo lỗi khi thiếu mã đơn hàng', async () => {
            await expect(OrderService.deleteOrder(null)).rejects.toThrow('Thiếu mã đơn hàng');
        });
    });

    describe('Liệt kê đơn hàng theo khách hàng', () => {
        it('trả về danh sách đơn hàng theo customer', async () => {
            const orders = [{ order_id: 1 }, { order_id: 2 }];

            OrderRepository.listByCustomer = jest.fn().mockResolvedValue(orders);
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([]);

            const result = await OrderService.listByCustomer(1);

            expect(OrderRepository.listByCustomer).toHaveBeenCalledWith(1, {});
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
            const order = { order_id: 1, status: 'draft_cart', total_amount: 50 };
            const updatedOrder = { order_id: 1, status: 'draft_cart', total_amount: 150 };

            OrderRepository.findById = jest.fn()
                .mockResolvedValueOnce(order)
                .mockResolvedValueOnce(updatedOrder);
            OrderDetailService._normalizeDetail = jest.fn().mockImplementation(i => i);
            OrderDetailService.createMany = jest.fn().mockResolvedValue([]);
            OrderDetailService.getByOrderId = jest.fn()
                .mockResolvedValueOnce([{ line_total: 100 }])
                .mockResolvedValueOnce([{ line_total: 100 }]);
            OrderRepository.update = jest.fn().mockResolvedValue();

            const result = await OrderService.addItem(1, { product_id: 1, quantity: 1, unit_price: 100 });

            expect(mockTransaction.commit).toHaveBeenCalled();
            expect(result.order_id).toBe(1);
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
            const orders = [{ order_id: 1 }, { order_id: 2 }];

            OrderRepository.getOrdersByDateRange = jest.fn().mockResolvedValue(orders);
            OrderDetailService.getByOrderId = jest.fn().mockResolvedValue([]);

            const result = await OrderService.getOrdersByDateRange('2025-01-01', '2025-12-31');

            expect(OrderRepository.getOrdersByDateRange).toHaveBeenCalledWith('2025-01-01', '2025-12-31');
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