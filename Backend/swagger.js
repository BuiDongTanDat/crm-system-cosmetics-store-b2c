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
    },
   apis: ['./API/routes/*.js'], // ✅ Đường dẫn tới tất cả route files
 // Nơi swagger-jsdoc tìm annotation
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('Swagger UI running on /api-docs');
}

module.exports = setupSwagger;
