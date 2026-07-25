import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'SentinelX API',
    version: '1.0.0',
    description: 'AI-Powered Security Operations Center Platform API',
    contact: {
      name: 'SentinelX Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message' },
          message: { type: 'string', example: 'Detailed error message' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'healthy' },
              uptime: { type: 'number', example: 12345.67 },
              database: { type: 'string', example: 'connected' },
              version: { type: 'string', example: '1.0.0' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@sentinelx.io' },
          password: { type: 'string', format: 'password', example: 'securePassword123' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', example: 'user@sentinelx.io' },
          password: { type: 'string', format: 'password', example: 'securePassword123' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  roles: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                      },
                    },
                  },
                },
              },
              token: { type: 'string' },
            },
          },
          message: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 10 },
        },
      },
      Incident: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          assignedTo: { type: 'string', nullable: true },
          createdById: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          assetName: { type: 'string' },
          hostname: { type: 'string', nullable: true },
          ipAddress: { type: 'string', nullable: true },
          assetType: { type: 'string', enum: ['SERVER', 'WORKSTATION', 'LAPTOP', 'FIREWALL', 'SWITCH', 'ROUTER', 'CLOUD_VM', 'DATABASE', 'OTHER'] },
          operatingSystem: { type: 'string', nullable: true },
          owner: { type: 'string', nullable: true },
          criticality: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'RETIRED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string' },
          severity: { type: 'string' },
          isRead: { type: 'boolean' },
          link: { type: 'string', nullable: true },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      TeamMember: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          isActive: { type: 'boolean' },
          roles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Settings: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          organizationName: { type: 'string' },
          timeZone: { type: 'string' },
          theme: { type: 'string', enum: ['dark', 'light', 'system'] },
          emailNotifications: { type: 'boolean' },
          criticalAlerts: { type: 'boolean' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          userName: { type: 'string' },
          action: { type: 'string' },
          resource: { type: 'string' },
          description: { type: 'string', nullable: true },
          ipAddress: { type: 'string', nullable: true },
          severity: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          totalIncidents: { type: 'integer' },
          openIncidents: { type: 'integer' },
          inProgressIncidents: { type: 'integer' },
          resolvedIncidents: { type: 'integer' },
          criticalIncidents: { type: 'integer' },
          highIncidents: { type: 'integer' },
          recentIncidents: {
            type: 'array',
            items: { $ref: '#/components/schemas/Incident' },
          },
        },
      },
      AnalyticsOverview: {
        type: 'object',
        properties: {
          totalIncidents: { type: 'integer' },
          openIncidents: { type: 'integer' },
          totalAssets: { type: 'integer' },
          totalUsers: { type: 'integer' },
        },
      },
      ReportFilter: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          severity: { type: 'string' },
          status: { type: 'string' },
        },
      },
      ExportRequest: {
        type: 'object',
        required: ['type', 'format'],
        properties: {
          type: { type: 'string', enum: ['incidents', 'assets', 'summary'] },
          format: { type: 'string', enum: ['json', 'csv'] },
          filters: { $ref: '#/components/schemas/ReportFilter' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns the health status of the API and database',
        responses: {
          '200': {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        roles: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/incidents': {
      get: {
        tags: ['Incidents'],
        summary: 'List incidents',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'severity', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of incidents',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Incident' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Incidents'],
        summary: 'Create a new incident',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description'],
                properties: {
                  title: { type: 'string', example: 'Suspicious login detected' },
                  description: { type: 'string', example: 'Multiple failed login attempts from unknown IP' },
                  severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'HIGH' },
                  assignedTo: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Incident created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Incident' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/incidents/stats': {
      get: {
        tags: ['Incidents'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/DashboardStats' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/incidents/{id}': {
      get: {
        tags: ['Incidents'],
        summary: 'Get incident by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Incident details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Incident' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Incident not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Incidents'],
        summary: 'Update an incident',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
                  severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                  assignedTo: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Incident updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Incident' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Incidents'],
        summary: 'Delete an incident',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Incident deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/assets': {
      get: {
        tags: ['Assets'],
        summary: 'List assets',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'assetType', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of assets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Asset' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Assets'],
        summary: 'Create a new asset',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetName'],
                properties: {
                  assetName: { type: 'string', example: 'Web Server 01' },
                  hostname: { type: 'string', example: 'web01.example.com' },
                  ipAddress: { type: 'string', example: '192.168.1.100' },
                  assetType: { type: 'string', enum: ['SERVER', 'WORKSTATION', 'LAPTOP', 'FIREWALL', 'SWITCH', 'ROUTER', 'CLOUD_VM', 'DATABASE', 'OTHER'] },
                  operatingSystem: { type: 'string', example: 'Ubuntu 22.04' },
                  criticality: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Asset created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Asset' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/assets/stats': {
      get: {
        tags: ['Assets'],
        summary: 'Get asset dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Asset stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalAssets: { type: 'integer' },
                        activeAssets: { type: 'integer' },
                        maintenanceAssets: { type: 'integer' },
                        criticalAssets: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/assets/{id}': {
      get: {
        tags: ['Assets'],
        summary: 'Get asset by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Asset details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Asset' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Assets'],
        summary: 'Update an asset',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  assetName: { type: 'string' },
                  hostname: { type: 'string' },
                  ipAddress: { type: 'string' },
                  assetType: { type: 'string' },
                  operatingSystem: { type: 'string' },
                  criticality: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Asset updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Asset' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Assets'],
        summary: 'Delete an asset',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Asset deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/analytics/overview': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics overview',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Analytics overview',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/AnalyticsOverview' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/analytics/incidents': {
      get: {
        tags: ['Analytics'],
        summary: 'Get incident analytics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Incident analytics',
          },
        },
      },
    },
    '/analytics/assets': {
      get: {
        tags: ['Analytics'],
        summary: 'Get asset analytics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Asset analytics',
          },
        },
      },
    },
    '/analytics/trends': {
      get: {
        tags: ['Analytics'],
        summary: 'Get trend data',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Trend data',
          },
        },
      },
    },
    '/reports/incidents': {
      get: {
        tags: ['Reports'],
        summary: 'Get incidents report',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Incidents report',
          },
        },
      },
    },
    '/reports/assets': {
      get: {
        tags: ['Reports'],
        summary: 'Get assets report',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Assets report',
          },
        },
      },
    },
    '/reports/summary': {
      get: {
        tags: ['Reports'],
        summary: 'Get summary report',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Summary report',
          },
        },
      },
    },
    '/reports/export': {
      post: {
        tags: ['Reports'],
        summary: 'Export report data',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ExportRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Export data',
          },
        },
      },
    },
    '/team': {
      get: {
        tags: ['Team'],
        summary: 'List team members',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of team members',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TeamMember' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Team'],
        summary: 'Create a team member',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName', 'roleName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  roleName: { type: 'string', enum: ['Admin', 'Analyst', 'Viewer'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Team member created',
          },
        },
      },
    },
    '/team/{id}': {
      put: {
        tags: ['Team'],
        summary: 'Update a team member',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                  roleName: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Team member updated',
          },
        },
      },
      delete: {
        tags: ['Team'],
        summary: 'Delete a team member',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Team member deleted',
          },
        },
      },
    },
    '/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get application settings',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current settings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Settings' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Settings'],
        summary: 'Update application settings',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  organizationName: { type: 'string' },
                  timeZone: { type: 'string' },
                  theme: { type: 'string' },
                  emailNotifications: { type: 'boolean' },
                  criticalAlerts: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Settings updated',
          },
        },
      },
    },
    '/settings/reset': {
      post: {
        tags: ['Settings'],
        summary: 'Reset settings to defaults',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Settings reset',
          },
        },
      },
    },
    '/settings/system': {
      get: {
        tags: ['Settings'],
        summary: 'Get system information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'System info',
          },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of notifications',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Notification' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Notifications'],
        summary: 'Create a notification',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'message', 'type'],
                properties: {
                  title: { type: 'string' },
                  message: { type: 'string' },
                  type: { type: 'string' },
                  severity: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Notification created',
          },
        },
      },
    },
    '/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'All notifications marked as read',
          },
        },
      },
    },
    '/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark a notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Notification marked as read',
          },
        },
      },
    },
    '/notifications/{id}': {
      delete: {
        tags: ['Notifications'],
        summary: 'Delete a notification',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Notification deleted',
          },
        },
      },
    },
    '/audit': {
      get: {
        tags: ['Audit'],
        summary: 'List audit logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of audit logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AuditLog' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Audit'],
        summary: 'Clear all audit logs',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Audit logs cleared',
          },
        },
      },
    },
    '/audit/{id}': {
      get: {
        tags: ['Audit'],
        summary: 'Get audit log by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Audit log details',
          },
        },
      },
      delete: {
        tags: ['Audit'],
        summary: 'Delete an audit log',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Audit log deleted',
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});