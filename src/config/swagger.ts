import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fiberbone API Documentation',
      version: '1.0.0',
      description: 'API documentation for Fiberbone Backend',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path ke file routes yang memiliki anotasi
};

export const swaggerSpec = swaggerJSDoc(options);
