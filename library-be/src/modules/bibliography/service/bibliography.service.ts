import { db } from "../../../db";
import {
  bibliographies, bibliographyAuthors, bibliographySubjects,
  authors, subjects, publishers, publicationPlaces, items
} from "../../../db/schema";
import { eq, and, isNull, ilike, or, sql, desc, asc, inArray } from "drizzle-orm";
import type { CreateBibliographyData, UpdateBibliographyData, BibliographyQuery } from "../validation/bibliography.validation";
import { syncCollectionAvailableStock } from "../../shared/utils/stock-sync";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export class BibliographyService {

  private async resolveOrCreateAuthor(tx: any, authorName: string): Promise<number> {
    const normalized = normalizeName(authorName);
    const existing = await tx.query.authors.findFirst({ where: eq(authors.normalizedName, normalized) });
    if (existing) return existing.id;
    const [created] = await tx.insert(authors).values({ name: authorName.trim(), normalizedName: normalized }).returning();
    return created.id;
  }

  private async resolveOrCreateSubject(tx: any, subjectName: string): Promise<number> {
    const normalized = normalizeName(subjectName);
    const existing = await tx.query.subjects.findFirst({ where: eq(subjects.normalizedName, normalized) });
    if (existing) return existing.id;
    const [created] = await tx.insert(subjects).values({ name: subjectName.trim(), normalizedName: normalized }).returning();
    return created.id;
  }

  private async resolveOrCreatePublisher(tx: any, publisherName: string): Promise<number | null> {
    if (!publisherName.trim()) return null;
    const normalized = normalizeName(publisherName);
    const existing = await tx.query.publishers.findFirst({ where: eq(publishers.normalizedName, normalized) });
    if (existing) return existing.id;
    const [created] = await tx.insert(publishers).values({ name: publisherName.trim(), normalizedName: normalized }).returning();
    return created.id;
  }

  private async syncAuthors(tx: any, bibliographyId: string, authorList: { name: string; role: string }[]) {
    await tx.delete(bibliographyAuthors).where(eq(bibliographyAuthors.bibliographyId, bibliographyId));
    for (const a of authorList) {
      const authorId = await this.resolveOrCreateAuthor(tx, a.name);
      await tx.insert(bibliographyAuthors).values({ bibliographyId, authorId, role: a.role || "primary" });
    }
  }

  private async syncSubjects(tx: any, bibliographyId: string, subjectList: { name: string }[]) {
    await tx.delete(bibliographySubjects).where(eq(bibliographySubjects.bibliographyId, bibliographyId));
    for (const s of subjectList) {
      const subjectId = await this.resolveOrCreateSubject(tx, s.name);
      await tx.insert(bibliographySubjects).values({ bibliographyId, subjectId });
    }
  }

  async create(data: CreateBibliographyData) {
    const result = await db.transaction(async (tx) => {
      let publisherId = data.publisherId || null;
      if ((data as any).publisherName) {
        const resolvedId = await this.resolveOrCreatePublisher(tx, (data as any).publisherName);
        if (resolvedId) publisherId = resolvedId;
      }
      const insertData: any = {
        title: data.title,
        description: data.description || null,
        image: data.image || null,
        type: data.type || null,
        categoryId: data.categoryId || null,
        isbnIssn: data.isbnIssn || null,
        edition: data.edition || null,
        publishYear: data.publishYear || null,
        collation: data.collation || null,
        seriesTitle: data.seriesTitle || null,
        callNumber: data.callNumber || null,
        classification: data.classification || null,
        notes: data.notes || null,
        sor: data.sor || null,
        gmdId: data.gmdId || null,
        collectionTypeId: data.collectionTypeId || null,
        languageId: data.languageId || null,
        publicationPlaceId: data.publicationPlaceId || null,
        publisherId: publisherId,
        stock: 0,
        isPopular: data.isPopular ?? false,
      };
      const [bib] = await tx.insert(bibliographies).values(insertData).returning();
      if (data.authors && data.authors.length > 0) await this.syncAuthors(tx, bib.id, data.authors);
      if (data.subjects && data.subjects.length > 0) await this.syncSubjects(tx, bib.id, data.subjects);
      return bib;
    });
    return this.getById(result.id);
  }

  async update(id: string, data: UpdateBibliographyData) {
    await db.transaction(async (tx) => {
      let publisherId = data.publisherId;
      if ((data as any).publisherName !== undefined) {
        const resolvedId = (data as any).publisherName
          ? await this.resolveOrCreatePublisher(tx, (data as any).publisherName)
          : null;
        publisherId = resolvedId !== null ? resolvedId : undefined;
      }
      const updateData: any = {};
      for (const key of Object.keys(data)) {
        if (key === "authors" || key === "subjects" || key === "publisherName") continue;
        if (data[key as keyof UpdateBibliographyData] !== undefined) {
          updateData[key] = data[key as keyof UpdateBibliographyData];
        }
      }
      if (publisherId !== undefined) {
        updateData.publisherId = publisherId;
      }
      updateData.updatedAt = new Date();
      if (Object.keys(updateData).length > 1) {
        await tx.update(bibliographies).set(updateData).where(eq(bibliographies.id, id));
      }
      if (data.authors !== undefined) await this.syncAuthors(tx, id, data.authors);
      if (data.subjects !== undefined) await this.syncSubjects(tx, id, data.subjects);
    });
    return this.getById(id);
  }

  async getById(id: string) {
    const bib = await db.query.bibliographies.findFirst({
      where: and(eq(bibliographies.id, id), isNull(bibliographies.deletedAt)),
      with: {
        category: true,
        publisher: true,
        language: true,
        publicationPlace: true,
        gmd: true,
        collectionType: true,
        bibliographyAuthors: { with: { author: true } },
        bibliographySubjects: { with: { subject: true } },
        items: { where: isNull(items.deletedAt), with: { location: true } },
      },
    });
    if (!bib) return null;
    const totalItems = bib.items.length;
    const availableItems = bib.items.filter((i: any) => i.status === "available").length;
    return {
      ...bib,
      authors: bib.bibliographyAuthors.map((ba: any) => ({ id: ba.author.id, name: ba.author.name, role: ba.role })),
      subjects: bib.bibliographySubjects.map((bs: any) => ({ id: bs.subject.id, name: bs.subject.name })),
      totalItems,
      availableItems,
      bibliographyAuthors: undefined,
      bibliographySubjects: undefined,
    };
  }

  async list(query: BibliographyQuery) {
    const conditions: any[] = [isNull(bibliographies.deletedAt)];
    if (query.isPopular !== undefined) {
      conditions.push(eq(bibliographies.isPopular, query.isPopular));
    }
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(or(
        ilike(bibliographies.title, term),
        ilike(bibliographies.isbnIssn, term),
        ilike(bibliographies.callNumber, term),
        ilike(bibliographies.sor, term),
      ));
    }
    if (query.title) conditions.push(ilike(bibliographies.title, `%${query.title}%`));
    if (query.isbnIssn) conditions.push(ilike(bibliographies.isbnIssn, `%${query.isbnIssn}%`));
    if (query.callNumber) conditions.push(ilike(bibliographies.callNumber, `%${query.callNumber}%`));
    if (query.gmdId) conditions.push(eq(bibliographies.gmdId, query.gmdId));
    if (query.languageId) conditions.push(eq(bibliographies.languageId, query.languageId));
    if (query.publisher) {
      const publisherBibs = await db.select({ bibId: bibliographies.id })
        .from(bibliographies)
        .innerJoin(publishers, eq(bibliographies.publisherId, publishers.id))
        .where(ilike(publishers.name, `%${query.publisher}%`));
      const ids = publisherBibs.map((r: any) => r.bibId);
      if (ids.length > 0) conditions.push(inArray(bibliographies.id, ids));
      else return { items: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
    }
    if (query.publishYearFrom) conditions.push(sql`${bibliographies.publishYear} >= ${query.publishYearFrom}`);
    if (query.publishYearTo) conditions.push(sql`${bibliographies.publishYear} <= ${query.publishYearTo}`);

    if (query.author) {
      const authorBibs = await db.select({ bibId: bibliographyAuthors.bibliographyId })
        .from(bibliographyAuthors).innerJoin(authors, eq(bibliographyAuthors.authorId, authors.id))
        .where(ilike(authors.name, `%${query.author}%`));
      const ids = authorBibs.map((r: any) => r.bibId);
      if (ids.length > 0) conditions.push(inArray(bibliographies.id, ids));
      else return { items: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
    }
    if (query.subject) {
      const subjectBibs = await db.select({ bibId: bibliographySubjects.bibliographyId })
        .from(bibliographySubjects).innerJoin(subjects, eq(bibliographySubjects.subjectId, subjects.id))
        .where(ilike(subjects.name, `%${query.subject}%`));
      const ids = subjectBibs.map((r: any) => r.bibId);
      if (ids.length > 0) conditions.push(inArray(bibliographies.id, ids));
      else return { items: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
    }

    const where = and(...conditions);
    const sortCol = query.sort === "publishYear" ? bibliographies.publishYear
      : query.sort === "createdAt" ? bibliographies.createdAt : bibliographies.title;
    const sortDir = query.order === "desc" ? desc : asc;
    const offset = (query.page - 1) * query.limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(bibliographies).where(where);
    const total = Number(countResult.count);

    const rows = await db.query.bibliographies.findMany({
      where,
      with: {
        category: true, publisher: true, language: true, gmd: true,
        bibliographyAuthors: { with: { author: true } },
        bibliographySubjects: { with: { subject: true } },
        items: { where: isNull(items.deletedAt) },
      },
      orderBy: [sortDir(sortCol)],
      limit: query.limit,
      offset,
    });

    const mapped = rows.map((bib: any) => ({
      ...bib,
      authors: bib.bibliographyAuthors.map((ba: any) => ({ id: ba.author.id, name: ba.author.name, role: ba.role })),
      subjects: bib.bibliographySubjects.map((bs: any) => ({ id: bs.subject.id, name: bs.subject.name })),
      totalItems: bib.items.length,
      availableItems: bib.items.filter((i: any) => i.status === "available").length,
      bibliographyAuthors: undefined,
      bibliographySubjects: undefined,
    }));

    return { items: mapped, total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) };
  }

  async softDelete(id: string) {
    await db.update(bibliographies).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(bibliographies.id, id));
  }

  async getItemsForBibliography(bibliographyId: string) {
    return db.query.items.findMany({
      where: and(eq(items.bibliographyId, bibliographyId), isNull(items.deletedAt)),
      with: { location: true, vendor: true, collectionType: true },
    });
  }
}

export const bibliographyService = new BibliographyService();
