import { db } from "../db";
import { loans, fines, items, collections, Users, members } from "../db/schema";
import { eq, lt, and, isNull, sql } from "drizzle-orm";
import { NotificationService } from "../modules/notification/service/notification.service";

const DENDA_PER_HARI = 500; // Rp 500 per hari
const JADWAL_JAM = 0; // Jam 00:xx (tengah malam)
const JADWAL_MENIT = 1; // Menit :01 → mirip cron "1 0 * * *"

const notificationService = new NotificationService();

function getBusinessDateJakarta(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function checkAndUpdateFines(): Promise<void> {
  console.log("[Scheduler] ⏳ Menjalankan pengecekan denda otomatis...");

  try {
    const todayDate = getBusinessDateJakarta();

    const overdueLoans = await db
      .select({
        loanId: loans.id,
        dueDate: loans.dueDate,
        memberId: loans.memberId,
        userId: members.userId,
        userEmail: Users.email,
        userName: Users.name,
        bookTitle: collections.title
      })
      .from(loans)
      .leftJoin(members, eq(loans.memberId, members.id))
      .leftJoin(Users, eq(members.userId, Users.id))
      .leftJoin(items, eq(loans.itemId, items.id))
      .leftJoin(collections, eq(items.collectionId, collections.id))
      .where(
        and(
          isNull(loans.deletedAt),
          lt(loans.dueDate, todayDate),
          sql`${loans.status} IN ('approved', 'extended')`
        )
      );

    console.log(
      `[Scheduler] 🔍 Ditemukan ${overdueLoans.length} peminjaman terlambat.`
    );

    for (const loan of overdueLoans) {
      if (!loan.dueDate) continue;

      // Hitung selisih hari keterlambatan
      const dueDateObj = new Date(`${loan.dueDate}T00:00:00+07:00`);
      dueDateObj.setHours(0, 0, 0, 0);
      const todayMidnight = new Date(`${todayDate}T00:00:00+07:00`);
      todayMidnight.setHours(0, 0, 0, 0);

      const diffMs = todayMidnight.getTime() - dueDateObj.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const totalDenda = diffDays * DENDA_PER_HARI;

      // Cek apakah sudah ada record denda untuk loan ini
      const existingFine = await db
        .select()
        .from(fines)
        .where(and(eq(fines.loanId, loan.loanId), isNull(fines.deletedAt)))
        .limit(1);

      if (existingFine.length > 0) {
        // Update denda yang ada jika masih belum dibayar
        if (existingFine[0].status === "unpaid") {
          await db
            .update(fines)
            .set({
              amount: totalDenda.toString(),
              updatedAt: new Date()
            })
            .where(eq(fines.id, existingFine[0].id));
        }
      } else {
        // Buat record denda baru
        await db.insert(fines).values({
          loanId: loan.loanId,
          amount: totalDenda.toString(),
          status: "unpaid"
        });
      }

      // Kirim notifikasi email ke peminjam
      if (loan.userEmail && loan.userName && loan.bookTitle) {
        await notificationService.sendFinesNotification(
          loan.userEmail,
          loan.userName,
          totalDenda,
          loan.bookTitle
        );
      }
    }

    console.log("[Scheduler] ✅ Pengecekan denda selesai.");
  } catch (error) {
    console.error("[Scheduler] ❌ Gagal menjalankan pengecekan denda:", error);
  }
}

function getMsUntilNextRun(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date();

  next.setHours(hour, minute, 0, 0); // Set ke jam 00:01:00.000

  // Jika waktu target hari ini sudah lewat, mundur ke besok
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

export function initCronJobs(): void {
  const msUntilFirst = getMsUntilNextRun(JADWAL_JAM, JADWAL_MENIT);
  const hh = String(JADWAL_JAM).padStart(2, "0");
  const mm = String(JADWAL_MENIT).padStart(2, "0");

  console.log(
    `[Scheduler] 🕐 Denda scheduler aktif. Akan berjalan pertama kali dalam ${Math.round(msUntilFirst / 1000 / 60)} menit (di jam ${hh}:${mm}).`
  );

  // Jalankan sekali saat startup agar nominal denda langsung sinkron.
  void checkAndUpdateFines();

  // Tunggu sampai jadwal pertama, lalu jalankan & set interval 24 jam
  setTimeout(() => {
    // Jalankan pertama kali
    void checkAndUpdateFines();

    // Setelah itu, ulangi setiap 24 jam
    const INTERVAL_24H = 24 * 60 * 60 * 1000;
    setInterval(() => {
      void checkAndUpdateFines();
    }, INTERVAL_24H);
  }, msUntilFirst);
}
