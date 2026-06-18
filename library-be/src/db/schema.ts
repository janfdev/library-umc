import {
  integer,
  pgTable,
  varchar,
  pgEnum,
  text,
  timestamp,
  boolean,
  date,
  numeric,
  index,
  uuid,
  jsonb,
  unique
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. ENUMS
// ==========================================

export const collectionTypeEnum = pgEnum("collection_type", [
  "physical_book",
  "ebook",
  "journal",
  "thesis"
]);
export const contentTypeEnum = pgEnum("content_type", ["text", "pdf", "url"]);
export const itemStatusEnum = pgEnum("item_status", [
  "available",
  "loaned",
  "damaged",
  "lost"
]);
export const loansStatusEnum = pgEnum("loans_status", [
  "pending",
  "approved",
  "returned",
  "extended",
  "rejected"
]);
export const reservationsStatusEnum = pgEnum("reservations_status", [
  "waiting",
  "fulfilled",
  "canceled"
]);
export const finesStatusEnum = pgEnum("fines_status", ["paid", "unpaid"]);
export const logsStatusEnum = pgEnum("logs_status", [
  "create",
  "update",
  "delete",
  "approve",
  "blacklist",
  "failed_login",
  "rate_limited"
]);
export const logsEntityEnum = pgEnum("logs_entity", [
  "loan",
  "item",
  "fine",
  "Users",
  "category",
  "collection",
  "reservation",
  "auth"
]);
export const recommendationStatusEnum = pgEnum("recommendation_status", [
  "pending",
  "approved",
  "rejected"
]);
export const memberType = pgEnum("member_type", [
  "student",
  "lecturer",
  "staff",
  "super_admin",
  "external"
]);
export const memberCardStatusEnum = pgEnum("member_card_status", [
  "not_requested",
  "pending",
  "active",
  "rejected",
  "expired"
]);
export const returnRequestStatusEnum = pgEnum("return_request_status", [
  "pending",
  "approved"
]);

// P1: Import enums
export const importBatchStatusEnum = pgEnum("import_batch_status", [
  "uploading",
  "parsing",
  "validating",
  "preview",
  "approved",
  "committed",
  "failed",
  "cancelled"
]);
export const importBatchTypeEnum = pgEnum("import_batch_type", [
  "bibliography",
  "item"
]);
export const importRowStatusEnum = pgEnum("import_row_status", [
  "pending",
  "valid",
  "invalid",
  "committed",
  "skipped",
  "duplicate"
]);

// ==========================================
// 2. MASTER DATA
// ==========================================

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  deletedAt: timestamp("deleted_at")
});

export const locations = pgTable("locations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  room: varchar("room", { length: 200 }).notNull(),
  rack: varchar("rack", { length: 200 }).notNull(),
  shelf: varchar("shelf", { length: 200 }).notNull(),
  deletedAt: timestamp("deleted_at")
});

export const vendors = pgTable("vendors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }),
  contact: varchar("contact", { length: 255 }),
  deletedAt: timestamp("deleted_at")
});

// P1: Publishers master
export const publishers = pgTable("publishers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  normalizedNameIdx: index("publisher_normalized_name_idx").on(table.normalizedName)
}));

// P1: Languages master
export const languages = pgTable("languages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  deletedAt: timestamp("deleted_at")
});

// P1: Publication places master
export const publicationPlaces = pgTable("publication_places", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  normalizedNameIdx: index("place_normalized_name_idx").on(table.normalizedName)
}));

// P1: GMDs master
export const gmds = pgTable("gmds", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  deletedAt: timestamp("deleted_at")
});

// P1: Collection types master
export const collectionTypes = pgTable("collection_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }),
  deletedAt: timestamp("deleted_at")
});

// P1: Authors master
export const authors = pgTable("authors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  normalizedNameIdx: index("author_normalized_name_idx").on(table.normalizedName)
}));

// P1: Subjects master
export const subjects = pgTable("subjects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  normalizedNameIdx: index("subject_normalized_name_idx").on(table.normalizedName)
}));

// ==========================================
// 3. AUTHENTICATION (BETTER AUTH)
// ==========================================

export const Users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    deletedAt: timestamp("deleted_at"),
    role: text("role").default("student"),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires")
  },
  (table) => ({
    deletedAtIdx: index("user_deleted_at_idx").on(table.deletedAt)
  })
);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => Users.id),
  impersonatedBy: text("impersonated_by")
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => Users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at")
});

// ==========================================
// 4. MEMBERS & PROFILE
// ==========================================

export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().unique().references(() => Users.id),
    memberType: memberType("member_type").notNull(),
    nimNidn: varchar("nim_nidn", { length: 255 }),
    faculty: varchar("faculty", { length: 255 }),
    originRegion: varchar("origin_region", { length: 255 }),
    institution: varchar("institution", { length: 255 }),
    phone: varchar("phone", { length: 100 }),
    cardStatus: memberCardStatusEnum("card_status").notNull().default("not_requested"),
    cardNumber: varchar("card_number", { length: 100 }).unique(),
    cardRequestedAt: timestamp("card_requested_at"),
    cardApprovedAt: timestamp("card_approved_at"),
    cardRejectedAt: timestamp("card_rejected_at"),
    cardRejectedReason: text("card_rejected_reason"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at")
  },
  (table) => ({
    nimIdx: index("member_nim_idx").on(table.nimNidn),
    deletedAtIdx: index("member_deleted_at_idx").on(table.deletedAt)
  })
);

// ==========================================
// 5. COLLECTIONS (BIBLIOGRAPHY) — EXTENDED
// ==========================================

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Legacy fields (retained for backward compatibility)
  isbn: varchar("isbn", { length: 255 }),
  author: varchar("author", { length: 255 }),
  publisher: varchar("publisher", { length: 150 }),
  publicationYear: varchar("publication_year", { length: 100 }),

  // Core fields
  title: varchar("title", { length: 500 }),
  description: text("description"),
  image: text("image"),
  stock: integer("stock").notNull().default(0),
  type: collectionTypeEnum("type"),
  categoryId: integer("category_id").references(() => categories.id),

  // P1: New bibliography fields
  isbnIssn: varchar("isbn_issn", { length: 255 }),
  edition: varchar("edition", { length: 100 }),
  publisherId: integer("publisher_id").references(() => publishers.id),
  publishYear: integer("publish_year"),
  collation: varchar("collation", { length: 255 }),
  seriesTitle: varchar("series_title", { length: 255 }),
  callNumber: varchar("call_number", { length: 100 }),
  languageId: integer("language_id").references(() => languages.id),
  publicationPlaceId: integer("publication_place_id").references(() => publicationPlaces.id),
  classification: varchar("classification", { length: 100 }),
  notes: text("notes"),
  sor: text("sor"),
  gmdId: integer("gmd_id").references(() => gmds.id),
  collectionTypeId: integer("collection_type_id").references(() => collectionTypes.id),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  titleIdx: index("collection_title_idx").on(table.title),
  isbnIdx: index("collection_isbn_idx").on(table.isbnIssn),
  callNumberIdx: index("collection_call_number_idx").on(table.callNumber),
  publishYearIdx: index("collection_publish_year_idx").on(table.publishYear),
  deletedAtIdx: index("collection_deleted_at_idx").on(table.deletedAt)
}));

// P1: Collection <-> Authors junction
export const collectionAuthors = pgTable("collection_authors", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").notNull().references(() => collections.id),
  authorId: integer("author_id").notNull().references(() => authors.id),
  role: varchar("role", { length: 50 }).default("primary"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  collectionAuthorUnique: unique("collection_author_unique").on(table.collectionId, table.authorId),
  collectionIdx: index("ca_collection_idx").on(table.collectionId),
  authorIdx: index("ca_author_idx").on(table.authorId)
}));

// P1: Collection <-> Subjects junction
export const collectionSubjects = pgTable("collection_subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").notNull().references(() => collections.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  collectionSubjectUnique: unique("collection_subject_unique").on(table.collectionId, table.subjectId),
  collectionIdx: index("cs_collection_idx").on(table.collectionId),
  subjectIdx: index("cs_subject_idx").on(table.subjectId)
}));

export const collectionContents = pgTable("collection_contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  collectionId: uuid("collection_id").references(() => collections.id),
  contentType: contentTypeEnum("content_type"),
  content: text("content"),
  contentUrl: varchar("content_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

export const collectionViews = pgTable(
  "collection_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id").notNull().references(() => collections.id),
    userId: text("user_id").references(() => Users.id),
    ipAddress: varchar("ip_address", { length: 45 }),
    viewedAt: timestamp("viewed_at").defaultNow()
  },
  (table) => ({
    collIdx: index("cv_collection_idx").on(table.collectionId),
    viewedAtIdx: index("cv_viewed_at_idx").on(table.viewedAt)
  })
);

// ==========================================
// 6. ITEMS — EXTENDED
// ==========================================

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collectionId: uuid("collection_id").notNull().references(() => collections.id),

    // Legacy fields (retained for backward compatibility)
    barcode: varchar("barcode", { length: 50 }),
    uniqueCode: varchar("unique_code", { length: 30 }),

    // Core fields
    status: itemStatusEnum("status").notNull().default("available"),
    locationId: integer("location_id").notNull().references(() => locations.id),

    // P1: New item fields
    itemCode: varchar("item_code", { length: 50 }).notNull(),
    inventoryCode: varchar("inventory_code", { length: 50 }),
    callNumber: varchar("call_number", { length: 100 }),
    collectionTypeId: integer("collection_type_id").references(() => collectionTypes.id),
    vendorId: integer("vendor_id").references(() => vendors.id),
    receivedDate: date("received_date"),
    orderNo: varchar("order_no", { length: 100 }),
    orderDate: date("order_date"),
    source: varchar("source", { length: 255 }),
    invoice: varchar("invoice", { length: 255 }),
    price: numeric("price", { precision: 14, scale: 2 }),
    priceCurrency: varchar("price_currency", { length: 10 }).default("IDR"),
    invoiceDate: date("invoice_date"),
    site: varchar("site", { length: 255 }),

    // P1: QR fields
    qrToken: varchar("qr_token", { length: 100 }),
    qrVersion: integer("qr_version").default(1),
    qrGeneratedAt: timestamp("qr_generated_at"),
    qrRevokedAt: timestamp("qr_revoked_at"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at")
  },
  (table) => ({
    collIdx: index("item_collection_idx").on(table.collectionId),
    statusIdx: index("item_status_idx").on(table.status),
    deletedAtIdx: index("item_deleted_at_idx").on(table.deletedAt),
    locationIdx: index("item_location_idx").on(table.locationId),
    itemCodeIdx: index("item_code_idx").on(table.itemCode),
    qrTokenIdx: index("item_qr_token_idx").on(table.qrToken)
  })
);

// ==========================================
// 7. LOANS, RESERVATIONS, FINES
// ==========================================

export const loans = pgTable(
  "loans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").notNull().references(() => members.id),
    itemId: uuid("item_id").notNull().references(() => items.id),
    loanDate: date("loan_date").notNull(),
    dueDate: date("due_date").notNull(),
    returnDate: date("return_date"),
    status: loansStatusEnum("status").notNull(),
    extendCount: integer("extend_count").default(0).notNull(),
    approvedBy: text("approved_by").references(() => Users.id),
    verificationToken: varchar("verification_token", { length: 100 }),
    verificationExpiresAt: timestamp("verification_expires_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    deletedAt: timestamp("deleted_at")
  },
  (table) => ({
    statusIdx: index("loan_status_idx").on(table.status),
    deletedAtIdx: index("loan_deleted_at_idx").on(table.deletedAt),
    memberIdx: index("loan_member_idx").on(table.memberId),
    itemIdx: index("loan_item_idx").on(table.itemId),
    activeLoanIdx: index("loan_active_idx").on(table.itemId, table.status),
    tokenIdx: index("loan_verification_token_idx").on(table.verificationToken)
  })
);

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").notNull().references(() => members.id),
  collectionId: uuid("collection_id").notNull().references(() => collections.id),
  status: reservationsStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

export const returnRequests = pgTable("return_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id").notNull().references(() => loans.id),
  requestedAt: timestamp("requested_at").defaultNow(),
  status: returnRequestStatusEnum("status").default("pending").notNull(),
  processedAt: timestamp("processed_at"),
  processedBy: text("processed_by").references(() => Users.id)
});

export const fines = pgTable("fines", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id").notNull().references(() => loans.id),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  status: finesStatusEnum("status").notNull(),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fineId: uuid("fine_id").notNull().references(() => fines.id),
  paymentMethod: varchar("payment_method", { length: 100 }),
  confirmedBy: text("confirmed_by").notNull().references(() => Users.id),
  paidAt: date("paid_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const acquisitions = pgTable("acquisitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: integer("vendor_id").notNull().references(() => vendors.id),
  collectionId: uuid("collection_id").notNull().references(() => collections.id),
  quantity: integer("quantity"),
  acquiredAt: date("acquired_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  dosenId: text("dosen_id").notNull().references(() => Users.id),
  isbn: varchar("isbn", { length: 255 }),
  title: varchar("title", { length: 255 }),
  author: varchar("author", { length: 255 }),
  publisher: varchar("publisher", { length: 255 }),
  reason: text("reason"),
  status: recommendationStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

// ==========================================
// 8. LOGS & ANALYTICS
// ==========================================

export const logs = pgTable("logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => Users.id),
  action: logsStatusEnum("action").notNull(),
  entity: logsEntityEnum("entity").notNull(),
  entityId: varchar("entity_id", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: text("user_agent"),
  detail: text("detail"),
  createdAt: timestamp("created_at").defaultNow()
});

export const webTraffic = pgTable("web_traffic", {
  id: text("id").primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userId: text("user_id").references(() => Users.id),
  pageVisited: varchar("page_visited", { length: 255 }),
  visitTimestamp: timestamp("visit_timestamp").defaultNow(),
  userAgent: text("user_agent")
});

export const guestLogs = pgTable("guest_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  identifier: varchar("identifier", { length: 100 }).notNull(),
  faculty: varchar("faculty", { length: 255 }),
  major: varchar("major", { length: 255 }),
  visitDate: timestamp("visit_date").defaultNow(),
  deletedAt: timestamp("deleted_at")
});

// ==========================================
// 9. P1: IMPORT STAGING TABLES
// ==========================================

export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: importBatchTypeEnum("type").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  status: importBatchStatusEnum("status").notNull().default("uploading"),
  totalRows: integer("total_rows").default(0),
  processedRows: integer("processed_rows").default(0),
  validRows: integer("valid_rows").default(0),
  invalidRows: integer("invalid_rows").default(0),
  committedRows: integer("committed_rows").default(0),
  duplicateRows: integer("duplicate_rows").default(0),
  filePath: text("file_path"),
  errorReportPath: text("error_report_path"),
  metadata: jsonb("metadata"),
  createdBy: text("created_by").references(() => Users.id),
  createdAt: timestamp("created_at").defaultNow(),
  committedAt: timestamp("committed_at")
});

export const importRows = pgTable("import_rows", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").notNull().references(() => importBatches.id),
  rowNumber: integer("row_number").notNull(),
  rawData: jsonb("raw_data").notNull(),
  status: importRowStatusEnum("status").notNull().default("pending"),
  errors: jsonb("errors"),
  resolvedData: jsonb("resolved_data"),
  resolvedId: uuid("resolved_id"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  batchIdx: index("import_row_batch_idx").on(table.batchId),
  statusIdx: index("import_row_status_idx").on(table.status),
  batchRowUnique: unique("import_row_batch_number_unique").on(table.batchId, table.rowNumber)
}));

// ==========================================
// 10. RELATIONS
// ==========================================

export const userRelations = relations(Users, ({ one }) => ({
  member: one(members)
}));

export const memberRelations = relations(members, ({ one, many }) => ({
  user: one(Users, {
    fields: [members.userId],
    references: [Users.id]
  }),
  loans: many(loans)
}));

export const collectionRelations = relations(collections, ({ one, many }) => ({
  category: one(categories, {
    fields: [collections.categoryId],
    references: [categories.id]
  }),
  publisher: one(publishers, {
    fields: [collections.publisherId],
    references: [publishers.id]
  }),
  language: one(languages, {
    fields: [collections.languageId],
    references: [languages.id]
  }),
  publicationPlace: one(publicationPlaces, {
    fields: [collections.publicationPlaceId],
    references: [publicationPlaces.id]
  }),
  gmd: one(gmds, {
    fields: [collections.gmdId],
    references: [gmds.id]
  }),
  collectionType: one(collectionTypes, {
    fields: [collections.collectionTypeId],
    references: [collectionTypes.id]
  }),
  items: many(items),
  contents: many(collectionContents),
  collectionAuthors: many(collectionAuthors),
  collectionSubjects: many(collectionSubjects)
}));

export const collectionAuthorsRelations = relations(collectionAuthors, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionAuthors.collectionId],
    references: [collections.id]
  }),
  author: one(authors, {
    fields: [collectionAuthors.authorId],
    references: [authors.id]
  })
}));

export const collectionSubjectsRelations = relations(collectionSubjects, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionSubjects.collectionId],
    references: [collections.id]
  }),
  subject: one(subjects, {
    fields: [collectionSubjects.subjectId],
    references: [subjects.id]
  })
}));

export const itemRelations = relations(items, ({ one, many }) => ({
  collection: one(collections, {
    fields: [items.collectionId],
    references: [collections.id]
  }),
  location: one(locations, {
    fields: [items.locationId],
    references: [locations.id]
  }),
  vendor: one(vendors, {
    fields: [items.vendorId],
    references: [vendors.id]
  }),
  collectionType: one(collectionTypes, {
    fields: [items.collectionTypeId],
    references: [collectionTypes.id]
  }),
  loans: many(loans)
}));

export const loanRelations = relations(loans, ({ one }) => ({
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id]
  }),
  item: one(items, {
    fields: [loans.itemId],
    references: [items.id]
  }),
  authApproved: one(Users, {
    fields: [loans.approvedBy],
    references: [Users.id]
  })
}));

export const recommendationRelations = relations(recommendations, ({ one }) => ({
  dosen: one(Users, {
    fields: [recommendations.dosenId],
    references: [Users.id]
  })
}));

export const reservationRelations = relations(reservations, ({ one }) => ({
  member: one(members, {
    fields: [reservations.memberId],
    references: [members.id]
  }),
  collection: one(collections, {
    fields: [reservations.collectionId],
    references: [collections.id]
  })
}));

export const returnRequestRelations = relations(returnRequests, ({ one }) => ({
  loan: one(loans, {
    fields: [returnRequests.loanId],
    references: [loans.id]
  }),
  processedByUser: one(Users, {
    fields: [returnRequests.processedBy],
    references: [Users.id]
  })
}));

export const importBatchRelations = relations(importBatches, ({ one, many }) => ({
  creator: one(Users, {
    fields: [importBatches.createdBy],
    references: [Users.id]
  }),
  rows: many(importRows)
}));

export const importRowRelations = relations(importRows, ({ one }) => ({
  batch: one(importBatches, {
    fields: [importRows.batchId],
    references: [importBatches.id]
  })
}));
