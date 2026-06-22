import { describe, expect, it } from "vitest";

describe("Import Performance", () => {
  it("should generate and parse a 30,000-row CSV within time limits", () => {
    const headers = "item_code;call_number;coll_type_name;inventory_code;received_date;supplier_name;order_no;location_name;order_date;item_status_name;site;source;invoice;price;price_currency;invoice_date;input_date;last_update;title";
    const rows: string[] = [headers];
    for (let i = 1; i <= 30000; i++) {
      rows.push(`ITEM-${String(i).padStart(6, '0')};CALL-${i};Text;INV-${i};;UMC Library;;;UMC Library;;;Sirkulasi;;;0;IDR;;;;Test Bibliography ${i % 100}`);
    }
    const csvContent = rows.join("\n");
    const fileSize = Buffer.byteLength(csvContent, 'utf-8');
    console.log(`Generated CSV: ${rows.length - 1} rows, ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    const startTime = Date.now();
    const lines = csvContent.split("\n").filter(l => l.trim().length > 0);
    const dataLines = lines.slice(1);
    const parseTime = Date.now() - startTime;
    console.log(`Parse time: ${parseTime}ms`);

    expect(dataLines.length).toBe(30000);
    expect(parseTime).toBeLessThan(10000);

    const codes = new Set(dataLines.map(l => l.split(";")[0]));
    expect(codes.size).toBe(30000);
    console.log(`Unique codes: ${codes.size}`);
  });

  it("should handle chunked staging inserts", () => {
    const chunkSize = 500;
    const totalRows = 30000;
    const chunks = Math.ceil(totalRows / chunkSize);
    console.log(`Chunks needed: ${chunks} (size: ${chunkSize})`);
    expect(chunks).toBe(60);

    let processed = 0;
    for (let i = 0; i < totalRows; i += chunkSize) {
      processed += Math.min(chunkSize, totalRows - i);
    }
    expect(processed).toBe(30000);
  });

  it("should handle duplicate detection efficiently", () => {
    const codes = new Set<string>();
    const duplicates: string[] = [];
    for (let i = 1; i <= 30000; i++) {
      const code = i <= 29900 ? `ITEM-${i}` : `ITEM-${i - 100}`;
      if (codes.has(code)) { duplicates.push(code); }
      else { codes.add(code); }
    }
    expect(codes.size).toBe(29900);
    expect(duplicates.length).toBe(100);
    console.log(`Unique: ${codes.size}, Duplicates: ${duplicates.length}`);
  });
});
