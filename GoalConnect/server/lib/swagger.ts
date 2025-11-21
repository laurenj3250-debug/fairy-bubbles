/**
 * Swagger/OpenAPI Configuration
 * Provides API documentation for GoalConnect endpoints
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GoalConnect API',
      version: '1.0.0',
      description: 'API documentation for GoalConnect - A gamified task and habit tracking application',
      contact: {
        name: 'GoalConnect Team',
        url: 'https://github.com/yourusername/goalconnect',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email',
            },
            level: {
              type: 'integer',
              description: 'User level in gamification system',
            },
            xp: {
              type: 'integer',
              description: 'Experience points',
            },
            points: {
              type: 'integer',
              description: 'Total points earned',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Todo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Todo ID',
            },
            title: {
              type: 'string',
              description: 'Todo title',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Todo description',
            },
            completed: {
              type: 'boolean',
              description: 'Completion status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              nullable: true,
              description: 'Priority level',
            },
            dueDate: {
              type: 'string',
              format: 'date',
              nullable: true,
              description: 'Due date',
            },
            userId: {
              type: 'integer',
              description: 'Owner user ID',
            },
            projectId: {
              type: 'integer',
              nullable: true,
              description: 'Associated project ID',
            },
            parentId: {
              type: 'integer',
              nullable: true,
              description: 'Parent task ID for subtasks',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Habit: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Habit ID',
            },
            name: {
              type: 'string',
              description: 'Habit name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Habit description',
            },
            frequency: {
              type: 'string',
              enum: ['daily', 'weekly', 'monthly'],
              description: 'How often the habit should be completed',
            },
            currentStreak: {
              type: 'integer',
              description: 'Current consecutive completion streak',
            },
            longestStreak: {
              type: 'integer',
              description: 'Longest ever streak',
            },
            totalCompletions: {
              type: 'integer',
              description: 'Total number of completions',
            },
            userId: {
              type: 'integer',
              description: 'Owner user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Unauthorized',
                statusCode: 401,
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Not found',
                statusCode: 404,
              },
            },
          },
        },
        ValidationError: {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                message: 'Validation error',
                statusCode: 400,
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Todos',
        description: 'Task management endpoints',
      },
      {
        name: 'Habits',
        description: 'Habit tracking endpoints',
      },
      {
        name: 'User',
        description: 'User profile and settings',
      },
      {
        name: 'Projects',
        description: 'Project management',
      },
    ],
  },
  apis: ['./server/routes/*.ts', './server/index.ts'], // Path to API route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Setup Swagger UI middleware
 */
export function setupSwagger(app: Express): void {
  // Serve swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'GoalConnect API Documentation',
  }));

  // Serve raw OpenAPI spec as JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export { swaggerSpec };
