const swaggerJSDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestão de Alunos e Cursos',
      version: '1.0.0',
      description: 'API RESTful desenvolvida com Node.js, Express e MongoDB Atlas'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor Local'
      }
    ]
  },
  apis: ['./routes/*.js']
};

module.exports = swaggerJSDoc(swaggerOptions);