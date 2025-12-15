// Ví dụ: file này nằm trong thư mục /config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
        },
        servers: [
            { url: 'http://localhost:8000', description: 'Local server' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    // Dùng ../ để lùi ra thư mục gốc, sau đó mới vào router
    apis: ['./router/*.ts', './controller/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);