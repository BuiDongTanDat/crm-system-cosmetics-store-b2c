const TriggerRegistry = require('../valueObjects/TriggerRegistry');

TriggerRegistry.register('order.paid', { domain: 'Order', description: 'Thanh toán thành công' });
TriggerRegistry.register('order.refunded', { domain: 'Order', description: 'Hoàn tiền' });

module.exports = {
  ORDER_PAID: 'order.paid',
  ORDER_REFUNDED: 'order.refunded'
};