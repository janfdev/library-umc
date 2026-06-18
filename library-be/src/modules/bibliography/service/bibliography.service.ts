import { db } from "../../../db";
import {
  collections, collectionAuthors, collectionSubjects,
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
    const existing = await tx.query.authors.findFirst({
      where: eq(authors.normalizedName, normalized),
    });
    if (existing) return existing.id;
    const [created] = await tx.insert(authors).values({
      name: authorName.trim(),
      normalizedName: normalized,
    }).returning();
    return created.id;
  }

  private async resolveOrCreateSubject(tx: any, subjectName: string): Promise<number> {
    const normalized = normalizeName(subjectName);
    const existing = await tx.query.subjects.findFirst({
      where: eq(subjects.normalizedName, normalized),
    });
    if (existing) return existing.id;
    const [created] = await tx.insert(subjects).values({
      name: subjectName.trim(),
      normalizedName: normalized,
    }).returning();
    return created.id;
  }

  private async resolveOrCreatePublisher(tx: any, name: string): Promise<number> {
    const normalized = normalizeName(name);
    const existing = await tx.query.publishers.findFirst({
      where: eq(publishers.normalizedName, normalized),
    });
    if (existing) return existing.id;
    const [created] = await tx.insert(publishers).values({
      name: name.trim(),
      normalizedName: normalized,
    }).returning();
    return created.id;
  }

  private async resolveOrCreatePlace(tx: any, name: string): Promise<number> {
    const normalized = normalizeName(name);
    const existing = await tx.query.publicationPlaces.findFirst({
      where: eq(publicationPlaces.normalizedName, normalized),
    });
    if (existing) return existing.id;
    const [created] = await tx.insert(publicationPlaces).values({
      name: name.trim(),
      normalizedName: normalized,
    }).returning();
    return created.id;
  }

  private async syncAuthors(tx: any, collectionId: string, authorList: { name: string; role: string }[]) {
    await tx.delete(collectionAuthors).where(eq(collectionAuthors.collectionId, collectionId));
    for (const a of authorList) {
      const authorId = await this.resolveOrCreateAuthor(tx, a.name);
      await tx.insert(collectionAuthors).values({
        collectionId,
        authorId,
        role: a.role || "primary",
      });
    }
  }

  private async syncSubjects(tx: any, collectionId: string, subjectList: { name: string }[]) {
    await tx.delete(collectionSubjects).where(eq(collectionSubjects.collectionId, collectionId));
    for (const s of subjectList) {
      const subjectId = await this.resolveOrCreateSubject(tx, s.name);
      await tx.insert(collectionSubjects).values({
        collectionId,
        subjectId,
      });
    }
  }

  async create(data: CreateBibliographyData) {
    const result = await db.transaction(async (tx) => {
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
        publisherId: data.publisherId || null,
        stock: 0,
      };

      const [bib] = await tx.insert(collections).values(insertData).returning();

      if (data.authors && data.authors.length > 0) {
        await this.syncAuthors(tx, bib.id, data.authors);
      }
      if (data.subjects && data.subjects.length > 0) {
        await this.syncSubjects(tx, bib.id, data.subjects);
      }

      return bib;
    });

    return this.getById(result.id);
  }

  async update(id: string, data: UpdateBibliographyData) {
    await db.transaction(async (tx) => {
      const updateData: any = {};
      for (const key of Object.keys(data)) {
        if (key === "authors" || key === "subjects") continue;
        if (data[key as keyof UpdateBibliographyData] !== undefined) {
          updateData[key] = data[key as keyof UpdateBibliographyData];
        }
      }
      updateData.updatedAt = new Date();

      if (Object.keys(updateData).length > 1) {
        await tx.update(collections).set(updateData).where(eq(collections.id, id));
      }

      if (data.authors !== undefined) {
        await this.syncAuthors(tx, id, data.authors);
      }
      if (data.subjects !== undefined) {
        await this.syncSubjects(tx, id, data.subjects);
      }
    });

    return this.getById(id);
  }

  async getById(id: string) {
    const bib = await db.query.collections.findFirst({
      where: and(eq(collections.id, id), isNull(collections.deletedAt)),
      with: {
        category: true,
        publisher: true,
        language: true,
        publicationPlace: true,
        gmd: true,
        collectionType: true,
        collectionAuthors: { with: { author: true } },
        collectionSubjects: { with: { subject: true } },
        items: { where: isNull(items.deletedAt) },
      },
    });

    if (!bib) return null;

    const totalItems = bib.items.length;
    const availableItems = bib.items.filter(i => i.status === "available").length;

    return {
      ...bib,
      authors: bib.collectionAuthors.map(ca => ({
        id: ca.author.id,
        name: ca.author.name,
        role: ca.role,
      })),
      subjects: bib.collectionSubjects.map(cs => ({
        id: cs.subject.id,
        name: cs.subject.name,
      })),
      totalItems,
      availableItems,
      collectionAuthors: undefined,
      collectionSubjects: undefined,
    };
  }

  async list(query: BibliographyQuery) {
    const conditions: any[] = [isNull(collections.deletedAt)];

    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(
        or(
          ilike(collections.title, term),
          ilike(collections.isbnIssn, term),
          ilike(collections.callNumber, term),
          ilike(collections.sor, term),
        )
      );
    }
    if (query.title) conditions.push(ilike(collections.title, `%${query.title}%`));
    if (query.isbnIssn) conditions.push(ilike(collections.isbnIssn, `%${query.isbnIssn}%`));
    if (query.callNumber) conditions.push(ilike(collections.callNumber, `%${query.callNumber}%`));
    if (query.gmdId) conditions.push(eq(collections.gmdId, query.gmdId));
    if (query.languageId) conditions.push(eq(collections.languageId, query.languageId));
    if (query.publisher) conditions.push(ilike(collections.publisher, `%${query.publisher}%`));
    if (query.publishYearFrom) conditions.push(sql`${collections.publishYear} >= ${query.publishYearFrom}`);
    if (query.publishYearTo) conditions.push(sql`${collections.publishYear} <= ${query.publishYearTo}`);

    if (query.author) {
      const authorBibs = await db.select({ collectionId: collectionAuthors.collectionId })
        .from(collectionAuthors)
        .innerJoin(authors, eq(collectionAuthors.authorId, authors.id))
        .where(ilike(authors.name, `%${query.author}%`));
      const authorIds = authorBibs.map(r => r.collectionId);
      if (authorIds.length > 0) {
        conditions.push(inArray(collections.id, authorIds));
      } else {
        return { items: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
      }
    }

    if (query.subject) {
      const subjectBibs = await db.select({ collectionId: collectionSubjects.collectionId })
        .from(collectionSubjects)
        .innerJoin(subjects, eq(collectionSubjects.subjectId, subjects.id))
        .where(ilike(subjects.name, `%${query.subject}%`));
      const subjectIds = subjectBibs.map(r => r.collectionId);
      if (subjectIds.length > 0) {
        conditions.push(inArray(collections.id, subjectIds));
      } else {
        return { items: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 };
      }
    }

    const where = and(...conditions);

    const sortCol = query.sort === "publishYear" ? collections.publishYear
      : query.sort === "createdAt" ? collections.createdAt
      : collections.title;
    const sortDir = query.order === "desc" ? desc : asc;

    const offset = (query.page - 1) * query.limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(collections).where(where);
    const total = Number(countResult.count);

    const rows = await db.query.collections.findMany({
      where,
      with: {
        category: true,
        publisher: true,
        language: true,
        gmd: true,
        collectionAuthors: { with: { author: true } },
        collectionSubjects: { with: { subject: true } },
        items: { where: isNull(items.deletedAt) },
      },
      orderBy: [sortDir(sortCol)],
      limit: query.limit,
      offset,
    });

    const mapped = rows.map((bib: any) => ({
      ...bib,
      authors: bib.collectionAuthors.map((ca: any) => ({ id: ca.author.id, name: ca.author.name, role: ca.role })),
      subjects: bib.collectionSubjects.map((cs: any) => ({ id: cs.subject.id, name: cs.subject.name })),
      totalItems: bib.items.length,
      availableItems: bib.items.filter((i: any) => i.status === "available").length,
      collectionAuthors: undefined,
      collectionSubjects: undefined,
    }));

    return {
      items: mapped,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async softDelete(id: string) {
    await db.update(collections).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(collections.id, id));
  }

  async getItemsForBibliography(bibliographyId: string) {
    return db.query.items.findMany({
      where: and(eq(items.collectionId, bibliographyId), isNull(items.deletedAt)),
      with: { location: true, vendor: true, collectionType: true },
    });
  }
}

export const bibliographyService = new BibliographyService();
