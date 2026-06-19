import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "MUCILIB - UMC API",
    version: "1.0.0",
    description: "API Documentation for Library Management System Backend",
    contact: {
      name: "Developer Team",
      email: "rizqinoorf@gmail.com",
    },
  },
  servers: [
    {
      url: "https://be-library-umc-842800936285.asia-southeast1.run.app/api",
      description: "Production Server",
    },
    {
      url: "http://localhost:4000/api",
      description: "Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT", // Atau Session Token
        description:
          "Masukkan token session penuh Anda di sini (tanpa prefix 'Bearer ', sistem akan menambahkannya otomatis). Token ini didapat dari field 'token' pada object session.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string" },
          image: { type: "string", nullable: true },
          emailVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Member: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string" },
          memberType: {
            type: "string",
            enum: ["student", "lecturer", "staff", "super_admin"],
          },
          nimNidn: { type: "string", nullable: true },
          faculty: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
        },
      },
      Bibliography: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          isbnIssn: { type: "string", nullable: true },
          title: { type: "string" },
          sor: { type: "string", nullable: true },
          edition: { type: "string", nullable: true },
          publisher: { type: "object", nullable: true },
          publishYear: { type: "integer", nullable: true },
          collation: { type: "string", nullable: true },
          seriesTitle: { type: "string", nullable: true },
          callNumber: { type: "string", nullable: true },
          classification: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
          type: {
            type: "string",
            enum: ["physical_book", "ebook", "journal", "thesis"],
          },
          categoryId: { type: "integer" },
          description: { type: "string", nullable: true },
          image: { type: "string", nullable: true },
          stock: { type: "integer" },
          authors: { type: "array", items: { type: "object" } },
          subjects: { type: "array", items: { type: "object" } },
          totalItems: { type: "integer" },
          availableItems: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          category: { $ref: "#/components/schemas/Category" },
        },
      },
      GuestLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", nullable: true },
          name: { type: "string" },
          identifier: { type: "string", description: "NIM/NIDN/KTP" },
          faculty: { type: "string", nullable: true },
          major: { type: "string", nullable: true },
          visitDate: { type: "string", format: "date-time" },
        },
      },
      Location: {
        type: "object",
        properties: {
          id: { type: "integer" },
          room: { type: "string" },
          rack: { type: "string" },
          shelf: { type: "string" },
        },
      },
      Item: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          bibliographyId: { type: "string", format: "uuid" },
          barcode: { type: "string", nullable: true },
          uniqueCode: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["available", "loaned", "damaged", "lost"],
          },
          locationId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          collection: { $ref: "#/components/schemas/Bibliography" },
          location: { $ref: "#/components/schemas/Location" },
        },
      },
      Loan: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          memberId: { type: "string", format: "uuid" },
          itemId: { type: "string", format: "uuid" },
          loanDate: { type: "string", format: "date" },
          dueDate: { type: "string", format: "date" },
          returnDate: { type: "string", format: "date", nullable: true },
          status: {
            type: "string",
            enum: ["pending", "approved", "returned", "extended"],
          },
          approvedBy: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          member: { $ref: "#/components/schemas/Member" },
          item: { $ref: "#/components/schemas/Item" },
        },
      },
      Reservation: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          memberId: { type: "string", format: "uuid" },
          bibliographyId: { type: "string", format: "uuid" },
          status: {
            type: "string",
            enum: ["waiting", "fulfilled", "canceled"],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          member: { $ref: "#/components/schemas/Member" },
          collection: { $ref: "#/components/schemas/Bibliography" },
        },
      },
      Fine: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          loanId: { type: "string", format: "uuid" },
          amount: { type: "number", format: "decimal" },
          status: {
            type: "string",
            enum: ["paid", "unpaid"],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          loan: { $ref: "#/components/schemas/Loan" },
        },
      },
      Recommendation: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          dosenId: { type: "string" },
          title: { type: "string" },
          author: { type: "string" },
          publisher: { type: "string" },
          reason: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          dosen: { $ref: "#/components/schemas/User" },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: { type: "object", nullable: true },
        },
      },
      PaginatedResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "array",
            items: { type: "object" },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Members", description: "Member profile management" },
    { name: "Categories", description: "Book category management" },
    {
      name: "Guests",
      description: "Guest/Visitor log management (Admin only)",
    },
    {
        name: "Bibliographies",
        description: "Book & Bibliography management",
    },
  ],
  paths: {
    "/auth/users": {
      get: {
        summary: "Get All Users (Super Admin Only)",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "List of all users",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden - Super Admin only" },
        },
      },
    },
    "/members/me": {
      get: {
        summary: "Get Current Member Profile",
        tags: ["Members"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Member profile data",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiResponse" },
                    {
                      properties: {
                        data: { $ref: "#/components/schemas/Member" },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: "Member profile not found" },
        },
      },
      patch: {
        summary: "Update Current Member Profile",
        tags: ["Members"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nimNidn: { type: "string" },
                  faculty: { type: "string" },
                  phone: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Member" },
              },
            },
          },
        },
      },
    },
    "/bibliographies": {
      get: {
        summary: "Get All Bibliographies",
        description: "Retrieve a list of all bibliographies (books, etc).",
        tags: ["Bibliographies"],
        security: [],
        responses: {
          200: {
            description: "List of bibliographies",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create New Bibliography",
        description: "Add a new collection (book) with cover image upload.",
        tags: ["Bibliographies"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Title of the collection",
                  },
                  author: { type: "string", description: "Author name" },
                  publisher: { type: "string", description: "Publisher name" },
                  publicationYear: {
                    type: "string",
                    format: "year",
                    description: "Year of publication (YYYY)",
                  },
                  isbn: { type: "string", description: "ISBN number" },
                  type: {
                    type: "string",
                    enum: ["physical_book", "ebook", "journal", "thesis"],
                    description: "Type of collection",
                  },
                  categoryId: { type: "integer", description: "Category ID" },
                  description: {
                    type: "string",
                    description: "Description or synopsis",
                  },
                  quantity: {
                    type: "integer",
                    default: 1,
                    description: "Number of copies (for physical books)",
                  },
                  cover: {
                    type: "string",
                    format: "binary",
                    description: "Cover image file",
                  },
                },
                required: [
                  "title",
                  "author",
                  "publisher",
                  "publicationYear",
                  "type",
                  "categoryId",
                ],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Bibliography created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
          400: { description: "Validation Error" },
          500: { description: "Server Error" },
        },
      },
    },
    "/categories": {
      get: {
        summary: "Get All Categories",
        description: "Retrieve a list of all book categories.",
        tags: ["Categories"],
        security: [],
        responses: {
          200: {
            description: "List of categories",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create New Category",
        description: "Add a new books category.",
        tags: ["Categories"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Name of the category",
                  },
                  description: {
                    type: "string",
                    description: "Description of the category",
                  },
                },
                required: ["name"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Category created successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
          400: { description: "Validation Error" },
          500: { description: "Server Error" },
        },
      },
    },
    "/guests": {
      get: {
        summary: "Get Guest Logs",
        description: "Retrieve list of guest visits (Admin Only).",
        tags: ["Guests (Pengunjung)"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 50 },
            description: "Items per page",
          },
        ],
        responses: {
          200: {
            description: "List of guest logs",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Guest Log",
        description: "Record a new visitor/guest (Admin Only).",
        tags: ["Guests (Pengunjung)"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  identifier: { type: "string", description: "NIM or KTP" },
                  institution: { type: "string", default: "UMC" },
                  faculty: { type: "string" },
                  major: { type: "string" },
                  purpose: { type: "string" },
                },
                required: ["name", "identifier"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Guest log created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
    },
    "/guests/stats": {
      get: {
        summary: "Get Guest Statistics",
        description: "Get analytics about visitors by Faculty and Major.",
        tags: ["Guests (Pengunjung)"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Guest statistics",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
    },
    "/items": {
      get: {
        summary: "Get All Items",
        description: "Retrieve a list of all items (physical copies).",
        tags: ["Items"],
        security: [],
        responses: {
          200: {
            description: "List of items",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
    },
    "/items/{id}": {
      get: {
        summary: "Get Item By ID",
        description: "Retrieve a specific item by its ID.",
        tags: ["Items"],
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Item ID",
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Item details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
    },
    "/loans": {
      get: {
        summary: "Get All Loans",
        description: "Retrieve a list of all loans.",
        tags: ["Loans"],
        security: [],
        responses: {
          200: {
            description: "List of loans",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiResponse",
                },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts"], // Tetap include jika mau pakai comment di file route nanti
};

export const swaggerSpec = swaggerJSDoc(options);
