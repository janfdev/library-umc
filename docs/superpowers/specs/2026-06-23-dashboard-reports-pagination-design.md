# Dashboard Reports, Pagination & Text Contrast Fix

**Date:** 2026-06-23
**Status:** Approved
**Scope:** Frontend + Backend changes for dashboard Laporan & Statistik, pagination for 4 sections, and text contrast fix.

---

## Overview

Three improvements to the Super Admin Dashboard:

1. **Visit chart filter** — Add Hari/Minggu/Bulan toggle to the visit chart in Laporan & Statistik with animated transitions
2. **Pagination** — Add pagination controls to 4 dashboard sections that lack them
3. **Text contrast** — Fix low-contrast text (slate-400 on white) across dashboard sections

---

## 1. Visit Chart Filter (Hari/Minggu/Bulan)

### Backend

**File: `library-be/src/modules/report/service/report.service.ts`**

Modify `getGuestStats()` to accept a `range` parameter:

- `range=day` — Data per hour for today (00:00–23:00). SQL groups by `HOUR(visitDate)`, returns 24 data points.
- `range=week` — Data per day for last 7 days (default, current behavior). SQL groups by `DATE(visitDate)`.
- `range=month` — Data per day for last 30 days. SQL groups by `DATE(visitDate)`.

The method signature changes from `getGuestStats()` to `getGuestStats(range: string)`.

For `range=day`:
```sql
SELECT
  TO_CHAR(HOUR(visitDate), 'HH24:00') AS date,
  COUNT(*)::int AS count
FROM guest_logs
WHERE DATE(visitDate) = CURRENT_DATE AND deletedAt IS NULL
GROUP BY HOUR(visitDate)
ORDER BY HOUR(visitDate)
```

For `range=week` (existing, change interval):
```sql
WHERE visitDate >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(visitDate)
```

For `range=month`:
```sql
WHERE visitDate >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(visitDate)
```

**File: `library-be/src/modules/report/validation/report.validation.ts`**

Add validation schema:
```ts
export const guestStatsQuerySchema = z.object({
  range: z.enum(["day", "week", "month"]).optional().default("week")
});
```

**File: `library-be/src/modules/report/controller/report.controller.ts`**

Update `getGuestStats()` to parse `range` from query params using `guestStatsQuerySchema`, pass to service.

**File: `library-be/src/modules/report/route/report.route.ts`**

Update Swagger docs to document `range` query parameter.

### Frontend

**File: `library-fe/src/components/dashboard/ReportsSection.tsx`**

1. Add state: `const [chartRange, setChartRange] = useState<"day" | "week" | "month">("week")`
2. Add 3 tab buttons above the chart: **Hari** | **Minggu** | **Bulan**
   - Active: `bg-[#B91C1C] text-white`
   - Inactive: `bg-transparent text-slate-500 hover:bg-slate-100`
3. Update fetch URL: `GET /api/reports/guest-stats?range=${chartRange}`
4. Add `chartRange` to `useEffect` dependency array
5. Format XAxis labels based on range:
   - Day: "00:00", "01:00", ..., "23:00"
   - Week: "Senin", "Selasa", ... (existing dayLabels)
   - Month: "1 Jun", "2 Jun", ..., "30 Jun" (format: `d MMM`)
6. Update summary text below chart:
   - Day: "Total: X pengunjung hari ini"
   - Week: "Total: X pengunjung minggu ini" (existing)
   - Month: "Total: X pengunjung bulan ini"
7. Chart animation: Recharts `<Bar>` already has `isAnimationActive={true}` by default. Bar chart will animate when data changes. Add `key={chartRange}` to `<BarChart>` to force re-mount animation on range change.

---

## 2. Pagination for 4 Sections

All sections use the same pattern: 10 items per page, frontend-only pagination with Prev/Next + page numbers + ellipsis.

### Pattern (from existing UsersSection/FinesSection)

```tsx
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

// Derived
const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
const paginatedData = filteredData.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

// Reset on filter change
setCurrentPage(1);

// Render
{totalPages > 1 && (
  <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
    <p className="text-xs text-slate-400 font-medium">
      Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)}–
      {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
    </p>
    <div className="flex items-center gap-1.5">
      {/* Prev button */}
      {/* Page numbers with ellipsis */}
      {/* Next button */}
    </div>
  </div>
)}
```

### 2a. AuditLogsSection.tsx

- Add `currentPage` state, `itemsPerPage = 10`
- Slice `filteredLogs` into `paginatedLogs`
- Add pagination controls below table
- Reset page on filter change (action, entity, search)

### 2b. CardApprovalsSection.tsx

- Add `currentPage` state, `itemsPerPage = 10`
- Slice `filtered` into `paginatedItems`
- Add pagination controls below items list
- Reset page on search change

### 2c. ReturnApprovalsSection.tsx

- Add `currentPage` state, `itemsPerPage = 10`
- Slice `requests` into `paginatedRequests`
- Add pagination controls (only if `totalPages > 1`)
- No search/filter to reset on

### 2d. RecommendationsSection.tsx

- Add `currentPage` state, `itemsPerPage = 10`
- Slice `filteredData` into `paginatedData`
- Add pagination controls below cards
- Reset page on filter/search change

---

## 3. Text Contrast Fix

Change `text-slate-400` to `text-slate-500` for small labels on white/light backgrounds across these files:

| File | Element | Before | After |
|------|---------|--------|-------|
| `ReportsSection.tsx` | Card stat labels (10px uppercase) | `text-slate-400` | `text-slate-500` |
| `DashboardSection.tsx` | Stat card labels (11px uppercase) | `text-slate-400` | `text-slate-500` |
| `DashboardSection.tsx` | Description text | `text-slate-400` | `text-slate-500` |
| `UsersSection.tsx` | Table header labels | `text-slate-400` | `text-slate-500` |
| `FinesSection.tsx` | Table header labels | `text-slate-400` | `text-slate-500` |
| `AuditLogsSection.tsx` | Table header labels | `text-slate-400` | `text-slate-500` |

---

## Files Changed Summary

### Backend (3 files)
- `library-be/src/modules/report/service/report.service.ts` — Modify `getGuestStats()` to accept range
- `library-be/src/modules/report/validation/report.validation.ts` — Add `guestStatsQuerySchema`
- `library-be/src/modules/report/controller/report.controller.ts` — Parse range from query

### Frontend (8 files)
- `library-fe/src/components/dashboard/ReportsSection.tsx` — Chart filter tabs + fetch update
- `library-fe/src/components/dashboard/AuditLogsSection.tsx` — Add pagination + text contrast
- `library-fe/src/components/dashboard/CardApprovalsSection.tsx` — Add pagination
- `library-fe/src/components/dashboard/ReturnApprovalsSection.tsx` — Add pagination
- `library-fe/src/components/dashboard/RecommendationsSection.tsx` — Add pagination
- `library-fe/src/components/dashboard/DashboardSection.tsx` — Text contrast
- `library-fe/src/components/dashboard/UsersSection.tsx` — Text contrast
- `library-fe/src/components/dashboard/FinesSection.tsx` — Text contrast

---

## Implementation Order

1. Backend: guest-stats range support
2. Frontend: ReportsSection chart filter
3. Frontend: Pagination for AuditLogsSection
4. Frontend: Pagination for CardApprovalsSection
5. Frontend: Pagination for ReturnApprovalsSection
6. Frontend: Pagination for RecommendationsSection
7. Frontend: Text contrast fix across all files
8. Verify: TypeScript check + tests
