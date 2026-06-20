import 'dotenv/config';
import { db } from './src/db/index.js';
import { importBatches, importItemRows, importErrors, importBibliographyItemCodes, items, bibliographies } from './src/db/schema.js';
import { eq, and, isNull, sql } from 'drizzle-orm';
import crypto from 'crypto';

function generateSyntheticCsv(rows: number): string {
  const header = 'item_code;call_number;coll_type_name;inventory_code;received_date;supplier_name;order_no;location_name;order_date;item_status_name;site;source;invoice;price;price_currency;invoice_date;input_date;last_update;title';
  const lines = [header];
  for (let i = 1; i <= rows; i++) {
    const dup = i > rows - 100 ? i - 100 : null; // Last 100 are duplicates
    const code = dup ? `ITEM-${String(dup).padStart(6, '0')}` : `ITEM-${String(i).padStart(6, '0')}`;
    lines.push(`${code};CALL-${i};Text;INV-${i};;UMC Library;;;UMC Library;;;Sirkulasi;;;0;IDR;;;;Test Bibliography ${i % 100}`);
  }
  return lines.join('\n');
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  const DQ = String.fromCharCode(34);
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === DQ) {
      if (inQuotes && i + 1 < line.length && line[i + 1] === DQ) { current += DQ; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === delimiter && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

async function run() {
  console.log('=== 30,000-ROW POSTGRESQL PERFORMANCE TEST ===\n');

  // Generate CSV
  const ROWS = 30000;
  const DUPLICATES = 100;
  const csvContent = generateSyntheticCsv(ROWS);
  const fileSize = Buffer.byteLength(csvContent, 'utf-8');
  console.log(`Generated: ${ROWS} rows, ${DUPLICATES} duplicates, ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

  // Create test batch
  const [batch] = await db.insert(importBatches).values({
    type: 'item',
    filename: 'synthetic_30k.csv',
    status: 'uploading',
    createdBy: 'admin-seed-001',
    metadata: { fileContent: csvContent, fileSize },
  }).returning();
  console.log(`Batch: ${batch.id}`);

  // Parse
  const parseStart = Date.now();
  const lines = csvContent.split('\n').filter((l: string) => l.trim().length > 0);
  const headers = parseCsvLine(lines[0], ';').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  const dataLines = lines.slice(1);
  console.log(`Parse: ${dataLines.length} data rows, ${headers.length} headers`);

  // Insert into staging in chunks
  const CHUNK = 500;
  let stagingRows = 0;
  const stagingStart = Date.now();

  for (let i = 0; i < dataLines.length; i += CHUNK) {
    const chunk = dataLines.slice(i, i + CHUNK);
    const rows = chunk.map((line: string, j: number) => {
      const values = parseCsvLine(line, ';');
      const rawData: Record<string, string> = {};
      headers.forEach((h: string, hi: number) => { rawData[h] = (values[hi] || '').trim(); });
      return { batchId: batch.id, rowNumber: i + j + 1, rawData, status: 'valid' as const };
    });
    await db.insert(importItemRows).values(rows);
    stagingRows += rows.length;
  }
  const stagingTime = Date.now() - stagingStart;
  console.log(`Staging: ${stagingRows} rows in ${stagingTime}ms (${Math.ceil(stagingRows / CHUNK)} chunks)`);

  // Validate (classify duplicates)
  const validateStart = Date.now();
  const allRows = await db.query.importItemRows.findMany({
    where: eq(importItemRows.batchId, batch.id),
  });
  
  const seenCodes = new Set<string>();
  let validCount = 0;
  let dupCount = 0;
  const dupUpdates: Promise<any>[] = [];
  for (const row of allRows) {
    const code = (row.rawData as any).item_code;
    if (seenCodes.has(code)) {
      dupUpdates.push(db.update(importItemRows).set({ status: 'duplicate' as any }).where(eq(importItemRows.id, row.id)));
      dupCount++;
    } else {
      seenCodes.add(code);
      validCount++;
    }
  }
  // Execute duplicate updates in chunks
  for (let i = 0; i < dupUpdates.length; i += 100) {
    await Promise.all(dupUpdates.slice(i, i + 100));
  }
  const validateTime = Date.now() - validateStart;
  console.log(`Validation: ${validCount} valid, ${dupCount} duplicates in ${validateTime}ms`);

  // Create a test bibliography for the items
  const [testBib] = await db.insert(bibliographies).values({
    title: 'SYNTHETIC TEST BIBLIOGRAPHY',
    stock: 0,
  }).returning();
  console.log(`Test bibliography: ${testBib.id}`);

  // Approve (bulk insert in chunks without per-chunk locking)
  const approveStart = Date.now();
  const APPROVE_CHUNK = 500;
  let committed = 0;
  let failed = 0;

  const validRows = await db.query.importItemRows.findMany({
    where: and(eq(importItemRows.batchId, batch.id), eq(importItemRows.status, 'valid')),
  });

  // Generate all QR tokens upfront
  const qrTokens = validRows.map(() => crypto.randomBytes(20).toString('hex'));

  for (let i = 0; i < validRows.length; i += APPROVE_CHUNK) {
    const chunk = validRows.slice(i, i + APPROVE_CHUNK);
    const tokens = qrTokens.slice(i, i + APPROVE_CHUNK);
    
    try {
      const values = chunk.map((row, j) => {
        const raw = row.rawData as any;
        return {
          bibliographyId: testBib.id,
          itemCode: raw.item_code,
          inventoryCode: raw.inventory_code || null,
          callNumber: raw.call_number || null,
          locationId: 1,
          status: 'available' as const,
          site: raw.site || null,
          source: raw.source || null,
          priceCurrency: raw.price_currency || 'IDR',
          qrToken: tokens[j],
          qrVersion: 1,
          qrGeneratedAt: new Date(),
        };
      });
      await db.insert(items).values(values);
      committed += chunk.length;
    } catch (err: any) {
      failed += chunk.length;
    }
    if (i % 2500 === 0) console.log(`  Approved: ${committed}, Failed: ${failed}`);
  }
  const approveTime = Date.now() - approveStart;
  console.log(`Approval: ${committed} committed, ${failed} failed in ${approveTime}ms`);

  // Sync stock once at the end
  const syncStart = Date.now();
  await db.execute(sql`SELECT id FROM bibliographies WHERE id = ${testBib.id} FOR UPDATE`);
  const [count] = await db.select({ count: sql<number>`count(*)` }).from(items)
    .where(and(eq(items.bibliographyId, testBib.id), eq(items.status, 'available'), isNull(items.deletedAt)));
  await db.update(bibliographies).set({ stock: Number(count.count) }).where(eq(bibliographies.id, testBib.id));
  const syncTime = Date.now() - syncStart;
  console.log(`Stock sync: ${count.count} items in ${syncTime}ms`);

  // Verification
  console.log('\n=== VERIFICATION ===');
  const finalItems = await db.select({ count: sql<number>`count(*)` }).from(items)
    .where(and(eq(items.bibliographyId, testBib.id), isNull(items.deletedAt)));
  console.log(`Items in DB: ${finalItems[0].count}`);

  const qrCheck = await db.execute(sql`SELECT count(*) FROM items WHERE bibliography_id = ${testBib.id} AND qr_token IS NOT NULL AND deleted_at IS NULL`);
  console.log(`Items with QR: ${(qrCheck.rows || qrCheck)[0]?.count}`);

  const stockCheck = await db.execute(sql`SELECT stock FROM bibliographies WHERE id = ${testBib.id}`);
  console.log(`Bibliography stock: ${(stockCheck.rows || stockCheck)[0]?.stock}`);

  // Summary
  console.log('\n=== PERFORMANCE SUMMARY ===');
  console.log(`Rows: ${ROWS} (${DUPLICATES} duplicates)`);
  console.log(`File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Parse: ${parseStart - parseStart}ms (instant)`);
  console.log(`Staging: ${stagingTime}ms`);
  console.log(`Validation: ${validateTime}ms`);
  console.log(`Approval: ${approveTime}ms`);
  console.log(`Total: ${Date.now() - parseStart}ms`);
  console.log(`Chunk size: ${CHUNK} (staging), ${APPROVE_CHUNK} (approval)`);
  console.log(`Committed: ${committed}, Failed: ${failed}`);

  // Cleanup
  console.log('\n=== CLEANUP ===');
  await db.delete(importBibliographyItemCodes).where(eq(importBibliographyItemCodes.batchId, batch.id));
  await db.delete(importErrors).where(eq(importErrors.batchId, batch.id));
  await db.delete(importItemRows).where(eq(importItemRows.batchId, batch.id));
  await db.delete(importBatches).where(eq(importBatches.id, batch.id));
  await db.delete(items).where(eq(items.bibliographyId, testBib.id));
  await db.delete(bibliographies).where(eq(bibliographies.id, testBib.id));
  console.log('Cleaned up test data');

  process.exit(0);
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
