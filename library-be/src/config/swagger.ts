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
          bibliography: { $ref: "#/components/schemas/Bibliography" },
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
          bibliography: { $ref: "#/components/schemas/Bibliography" },
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
    { name: "Guests", description: "Guest/Visitor log management (Admin only)" },
    { name: "Bibliographies", description: "Book & Bibliography management" },
    { name: "Items", description: "Physical copy management" },
    { name: "Loans", description: "Loan management" },
    { name: "Reservations", description: "Reservation management" },
    { name: "Fines", description: "Fine management" },
    { name: "Locations", description: "Location/room/rack management" },
    { name: "Recommendations", description: "Book recommendation from lecturers" },
    { name: "Import", description: "CSV import (bibliographies & items)" },
    { name: "Export", description: "CSV export (bibliographies & items)" },
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
    "/bibliographies/{id}": {
      get: {
        summary: "Get Bibliography By ID",
        description: "Retrieve a specific bibliography by its ID.",
        tags: ["Bibliographies"],
        security: [],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Bibliography details", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          404: { description: "Not found" },
        },
      },
      patch: {
        summary: "Update Bibliography",
        description: "Update bibliography data (Admin/Staff only).",
        tags: ["Bibliographies"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  author: { type: "string" },
                  publisher: { type: "string" },
                  publicationYear: { type: "string" },
                  isbn: { type: "string" },
                  type: { type: "string", enum: ["physical_book", "ebook", "journal", "thesis"] },
                  categoryId: { type: "integer" },
                  description: { type: "string" },
                  cover: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Bibliography updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          400: { description: "Validation Error" },
          404: { description: "Not found" },
        },
      },
      delete: {
        summary: "Soft Delete Bibliography",
        description: "Soft delete a bibliography (Super Admin only).",
        tags: ["Bibliographies"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Bibliography deleted" },
          403: { description: "Forbidden" },
          404: { description: "Not found" },
        },
      },
    },
    "/bibliographies/{id}/items": {
      get: {
        summary: "Get Items Under Bibliography",
        description: "Retrieve all items (copies) for a specific bibliography.",
        tags: ["Bibliographies"],
        security: [],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "List of items", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          404: { description: "Bibliography not found" },
        },
      },
    },
    "/bibliographies/{bibliographyId}/items/bulk": {
      post: {
        summary: "Bulk Create Items",
        description: "Create up to 1000 items (copies) at once under a bibliography. Use `defaults` to set shared values for all items.",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "bibliographyId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["items"],
                properties: {
                  items: {
                    type: "array",
                    minItems: 1,
                    maxItems: 1000,
                    items: {
                      type: "object",
                      required: ["itemCode"],
                      properties: {
                        itemCode: { type: "string", maxLength: 50, description: "Unique item code" },
                        barcode: { type: "string", maxLength: 50 },
                        locationId: { type: "integer" },
                        callNumber: { type: "string", maxLength: 100 },
                        inventoryCode: { type: "string", maxLength: 50 },
                      },
                    },
                  },
                  defaults: {
                    type: "object",
                    description: "Default values applied when item-level field is empty",
                    properties: {
                      locationId: { type: "integer" },
                      source: { type: "string" },
                      priceCurrency: { type: "string" },
                      collectionTypeId: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Items created", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          400: { description: "Validation Error" },
        },
      },
    },
    "/items": {
      get: {
        summary: "Get All Items",
        description: "Retrieve a list of all items. Filter by ?bibliographyId=uuid.",
        tags: ["Items"],
        security: [],
        parameters: [
          { in: "query", name: "bibliographyId", schema: { type: "string", format: "uuid" }, description: "Filter by bibliography" },
        ],
        responses: {
          200: {
            description: "List of items",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
        },
      },
      post: {
        summary: "Create New Item",
        description: "Create a single item (physical copy) under a bibliography (Admin/Staff only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bibliographyId", "locationId", "itemCode"],
                properties: {
                  bibliographyId: { type: "string", format: "uuid" },
                  locationId: { type: "integer" },
                  itemCode: { type: "string", maxLength: 50 },
                  barcode: { type: "string", maxLength: 50 },
                  uniqueCode: { type: "string", maxLength: 30 },
                  inventoryCode: { type: "string", maxLength: 50 },
                  callNumber: { type: "string", maxLength: 100 },
                  collectionTypeId: { type: "integer" },
                  vendorId: { type: "integer" },
                  receivedDate: { type: "string", format: "date" },
                  orderNo: { type: "string" },
                  orderDate: { type: "string", format: "date" },
                  source: { type: "string" },
                  invoice: { type: "string" },
                  price: { type: "number" },
                  priceCurrency: { type: "string", default: "IDR" },
                  invoiceDate: { type: "string", format: "date" },
                  site: { type: "string" },
                  status: { type: "string", enum: ["available", "loaned", "damaged", "lost"], default: "available" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Item created", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          400: { description: "Validation Error" },
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
          { name: "id", in: "path", required: true, description: "Item ID", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Item details", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          404: { description: "Not found" },
        },
      },
      patch: {
        summary: "Update Item",
        description: "Update item fields (Admin/Staff only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  locationId: { type: "integer" },
                  barcode: { type: "string" },
                  uniqueCode: { type: "string" },
                  inventoryCode: { type: "string" },
                  callNumber: { type: "string" },
                  collectionTypeId: { type: "integer" },
                  vendorId: { type: "integer" },
                  receivedDate: { type: "string" },
                  orderNo: { type: "string" },
                  orderDate: { type: "string" },
                  source: { type: "string" },
                  invoice: { type: "string" },
                  price: { type: "number" },
                  priceCurrency: { type: "string" },
                  invoiceDate: { type: "string" },
                  site: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Item updated", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          400: { description: "Validation Error" },
          404: { description: "Not found" },
        },
      },
      delete: {
        summary: "Soft Delete Item",
        description: "Soft delete an item (Admin/Staff only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "Item deleted" },
          400: { description: "Cannot delete" },
        },
      },
    },
    "/items/{id}/status": {
      patch: {
        summary: "Update Item Status",
        description: "Change item status: available, loaned, damaged, lost (Admin/Staff only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["available", "loaned", "damaged", "lost"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Status updated" },
          400: { description: "Invalid status" },
        },
      },
    },
    "/items/{id}/location": {
      patch: {
        summary: "Update Item Location",
        description: "Move item to a different location (Admin/Staff only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["locationId"],
                properties: {
                  locationId: { type: "integer", description: "Target location ID" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Location updated" },
          400: { description: "Invalid location" },
        },
      },
    },
    "/items/{id}/qr": {
      get: {
        summary: "Get Item QR Code",
        description: "Get QR code for an item. ?format=svg (default) or ?format=png.",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "format", in: "query", schema: { type: "string", enum: ["svg", "png"], default: "svg" } },
        ],
        responses: {
          200: { description: "QR code image (SVG or PNG)" },
          404: { description: "Item not found" },
        },
      },
    },
    "/items/{id}/qr/regenerate": {
      post: {
        summary: "Regenerate Item QR",
        description: "Generate new QR token for item (Super Admin only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "QR regenerated" },
        },
      },
    },
    "/items/{id}/qr/revoke": {
      post: {
        summary: "Revoke Item QR",
        description: "Revoke/disable QR token for item (Super Admin only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: { description: "QR revoked" },
        },
      },
    },
    "/qr/resolve/{token}": {
      get: {
        summary: "Resolve QR Token to Item",
        description: "Lookup item by QR token (Admin/Staff only).",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "token", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Item found" },
          404: { description: "QR not found or revoked" },
        },
      },
    },
    "/items/bulk-labels": {
      get: {
        summary: "Get Bulk Label Data",
        description: "Get label data for multiple items. ?ids=uuid1,uuid2,uuid3.",
        tags: ["Items"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "ids", in: "query", required: true, schema: { type: "string" }, description: "Comma-separated item UUIDs" },
        ],
        responses: {
          200: { description: "Label data retrieved" },
          400: { description: "No IDs provided" },
        },
      },
    },
    "/loans": {
      get: {
        summary: "Get All Loans",
        description: "Retrieve a list of all loans (Admin/Staff only).",
        tags: ["Loans"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "status", schema: { type: "string", enum: ["pending", "approved", "returned", "extended", "rejected"] }, description: "Filter by status" },
          { in: "query", name: "memberId", schema: { type: "string" }, description: "Filter by member ID" },
        ],
        responses: {
          200: { description: "List of loans", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/import/bibliographies/upload": {
      post: {
        summary: "Upload bibliography CSV",
        description: "Upload a semicolon-delimited CSV file for staged bibliography import. Supports UTF-8 with optional BOM. Max 50MB.",
        operationId: "uploadBibliography",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "File uploaded successfully" },
          "400": { description: "No file uploaded" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" }
        }
      }
    },
    "/import/items/upload": {
      post: {
        summary: "Upload item CSV",
        description: "Upload a semicolon-delimited CSV file for staged item import.",
        operationId: "uploadItem",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "File uploaded" },
          "400": { description: "No file uploaded" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" }
        }
      }
    },
    "/import/batches": {
      get: {
        summary: "List import batches",
        description: "Returns all import batches ordered by creation date.",
        operationId: "listBatches",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Batches retrieved" }
        }
      }
    },
    "/import/batches/{batchId}": {
      get: {
        summary: "Get batch details",
        operationId: "getBatch",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Batch retrieved" },
          "404": { description: "Not found" }
        }
      }
    },
    "/import/batches/{batchId}/parse": {
      post: {
        summary: "Parse uploaded CSV into staging",
        description: "Reads CSV, parses rows, inserts into staging tables, validates.",
        operationId: "parseBatch",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Batch parsed" },
          "400": { description: "Invalid state" }
        }
      }
    },
    "/import/batches/{batchId}/preview": {
      get: {
        summary: "Preview staging rows",
        operationId: "previewBatch",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          "200": { description: "Preview retrieved" }
        }
      }
    },
    "/import/batches/{batchId}/approve": {
      post: {
        summary: "Approve and commit staging rows",
        description: "Commits valid rows in chunks. Idempotent. Returns progress with hasMore flag.",
        operationId: "approveBatch",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Chunk committed" },
          "400": { description: "Invalid state" }
        }
      }
    },
    "/import/batches/{batchId}/cancel": {
      post: {
        summary: "Cancel import batch",
        operationId: "cancelBatch",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Batch cancelled" },
          "400": { description: "Cannot cancel committed batch" }
        }
      }
    },
    "/import/batches/{batchId}/errors": {
      get: {
        summary: "Get import errors",
        operationId: "getErrors",
        tags: ["Import"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "batchId", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": { description: "Errors retrieved" }
        }
      }
    },
    "/export/bibliographies": {
      get: {
        summary: "Export bibliographies as Senayan CSV",
        description: "Exports all bibliographies in exact Senayan format. Semicolon-delimited, UTF-8 with BOM.",
        operationId: "exportBibliographies",
        tags: ["Export"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "CSV file",
            content: { "text/csv": { schema: { type: "string" } } }
          }
        }
      }
    },
    "/export/items": {
      get: {
        summary: "Export items as Senayan CSV",
        description: "Exports all items in exact Senayan format. Semicolon-delimited, UTF-8 with BOM.",
        operationId: "exportItems",
        tags: ["Export"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "CSV file",
            content: { "text/csv": { schema: { type: "string" } } }
          }
        }
      }
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts", "./src/modules/*/route/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
