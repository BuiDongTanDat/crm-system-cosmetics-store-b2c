// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'Tài liệu API cho project Node.js của bạn',
        },
        servers: [
            {
                url: 'http://localhost:5000',
            },
        ],
        tags: [
            { name: 'Orders', description: 'Order and OrderDetail endpoints' }
        ],
        components: {
            schemas: {
                OrderDetail: {
                    type: 'object',
                    properties: {
                        productId: { type: 'string', example: 'prod_123' },
                        quantity: { type: 'integer', example: 2 },
                        price: { type: 'number', format: 'float', example: 12.5 },
                        subtotal: { type: 'number', format: 'float', example: 25.0 }
                    },
                    required: ['productId','quantity','price']
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'order_123' },
                        customerId: { type: 'string', example: 'cust_456' },
                        status: { type: 'string', example: 'pending' },
                        total: { type: 'number', format: 'float', example: 100.5 },
                        orderDate: { type: 'string', format: 'date-time', example: '2025-01-01T12:00:00Z' },
                        items: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/OrderDetail' }
                        }
                    },
                    required: ['customerId','items']
                }
            }
        }
    },
   apis: ['./API/routes/*.js'], // ✅ Đường dẫn tới tất cả route files
 // Nơi swagger-jsdoc tìm annotation
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('Swagger UI running on /api-docs');
}

module.exports = { setupSwagger };
