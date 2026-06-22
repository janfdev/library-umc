import { db } from "../../../db";
import {
  bibliographies, items, bibliographyAuthors, bibliographySubjects,
  authors, subjects, publishers, publicationPlaces, gmds,
  languages, locations, vendors, collectionTypes
} from "../../../db/schema";
import { eq, and, isNull, asc, sql } from "drizzle-orm";

const BIBLIO_HEADERS = [
  "title", "gmd_name", "edition", "isbn_issn", "publisher_name",
  "publish_year", "collation", "series_title", "call_number",
  "language_name", "place_name", "classification", "notes", "image",
  "sor", "authors", "topics", "item_code"
];

const ITEM_HEADERS = [
  "item_code", "call_number", "coll_type_name", "inventory_code",
  "received_date", "supplier_name", "order_no", "location_name",
  "order_date", "item_status_name", "site", "source", "invoice",
  "price", "price_currency", "invoice_date", "input_date", "last_update", "title"
];

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export class ExportService {

  async exportBibliographies(): Promise<string> {
    const rows = await db.query.bibliographies.findMany({
      where: isNull(bibliographies.deletedAt),
      with: {
        gmd: true,
        publisher: true,
        language: true,
        publicationPlace: true,
        bibliographyAuthors: { with: { author: true } },
        bibliographySubjects: { with: { subject: true } },
        items: { where: isNull(items.deletedAt) },
      },
      orderBy: [asc(bibliographies.title)],
    });

    const lines: string[] = [BIBLIO_HEADERS.join(";")];

    for (const bib of rows) {
      const authorNames = bib.bibliographyAuthors.map(ca => `<${ca.author.name}>`).join("");
      const topicNames = bib.bibliographySubjects.map(cs => `<${cs.subject.name}>`).join("");
      const itemCodes = bib.items.map(i => `<${i.itemCode}>`).join("");

      const row = [
        escapeCsvField(bib.title),
        escapeCsvField(bib.gmd?.name || ""),
        escapeCsvField(bib.edition || ""),
        escapeCsvField(bib.isbnIssn || ""),
        escapeCsvField(bib.publisher?.name || ""),
        escapeCsvField(bib.publishYear?.toString() || ""),
        escapeCsvField(bib.collation || ""),
        escapeCsvField(bib.seriesTitle || ""),
        escapeCsvField(bib.callNumber || ""),
        escapeCsvField(bib.language?.name || ""),
        escapeCsvField(bib.publicationPlace?.name || ""),
        escapeCsvField(bib.classification || ""),
        escapeCsvField(bib.notes || ""),
        escapeCsvField(bib.image || ""),
        escapeCsvField(bib.sor || ""),
        escapeCsvField(authorNames),
        escapeCsvField(topicNames),
        escapeCsvField(itemCodes),
      ];
      lines.push(row.join(";"));
    }

    return "\uFEFF" + lines.join("\n");
  }

  async exportItems(): Promise<string> {
    const allItems = await db.query.items.findMany({
      where: isNull(items.deletedAt),
      with: {
        bibliography: true,
        location: true,
        vendor: true,
        collectionType: true,
      },
      orderBy: [asc(items.itemCode)],
    });

    const lines: string[] = [ITEM_HEADERS.join(";")];

    for (const item of allItems) {
      const locationName = (item as any).location
        ? `${(item as any).location.room}, ${(item as any).location.rack}, ${(item as any).location.shelf}`
        : "";
      const statusMap: Record<string, string> = {
        available: "Available",
        loaned: "Loaned",
        damaged: "Damaged",
        lost: "Lost",
      };

      const row = [
        escapeCsvField(item.itemCode),
        escapeCsvField(item.callNumber || ""),
        escapeCsvField((item as any).collectionType?.name || ""),
        escapeCsvField(item.inventoryCode || ""),
        escapeCsvField(formatDate(item.receivedDate)),
        escapeCsvField((item as any).vendor?.name || ""),
        escapeCsvField(item.orderNo || ""),
        escapeCsvField(locationName),
        escapeCsvField(formatDate(item.orderDate)),
        escapeCsvField(statusMap[item.status] || item.status),
        escapeCsvField(item.site || ""),
        escapeCsvField(item.source || ""),
        escapeCsvField(item.invoice || ""),
        escapeCsvField(item.price || ""),
        escapeCsvField(item.priceCurrency || ""),
        escapeCsvField(formatDate(item.invoiceDate)),
        escapeCsvField(formatDate(item.createdAt)),
        escapeCsvField(formatDate(item.updatedAt)),
        escapeCsvField((item as any).bibliography?.title || ""),
      ];
      lines.push(row.join(";"));
    }

    return "\uFEFF" + lines.join("\n");
  }
}

export const exportService = new ExportService();
