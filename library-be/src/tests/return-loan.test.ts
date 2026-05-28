import { LoanService } from "../modules/loan/service/loan.service";
import { db } from "../db";
import { loans, Users, returnRequests } from "../db/schema";
import { eq } from "drizzle-orm";

async function runTest() {
  console.log("Menjalankan test pengembalian buku (Return Request & Approve)...");
  const loanService = new LoanService();

  // 1. Ambil super admin
  const superAdmin = await db.query.Users.findFirst({
    where: eq(Users.role, "super_admin")
  });
  if (!superAdmin) {
    console.log("❌ Tidak ada Super Admin di database.");
    process.exit(1);
  }
  console.log("✅ Super Admin ditemukan:", superAdmin.name);

  // 2. Ambil loan yang sedang 'approved' (dipinjam)
  const activeLoan = await db.query.loans.findFirst({
    where: eq(loans.status, "approved"),
    with: { member: true }
  });

  if (!activeLoan) {
    console.log("❌ Tidak ada buku yang sedang dipinjam (status: approved) untuk ditest.");
    process.exit(1);
  }
  console.log("✅ Peminjaman ditemukan, ID:", activeLoan.id);

  // 3. User mengajukan pengembalian buku
  console.log("➤ Member mengajukan pengembalian buku...");
  try {
    const resRequest = await loanService.createReturnRequest(activeLoan.id, activeLoan.memberId);
    console.log("✅ Request pengembalian berhasil dibuat:", resRequest.message);
  } catch (err: any) {
    console.log("⚠️", err.message);
  }

  // 4. Super Admin melihat daftar pending request
  console.log("➤ Super Admin melihat daftar request pengembalian...");
  const pendingRequestsRes = await loanService.getPendingReturnRequests();
  console.log(`✅ Ada ${pendingRequestsRes.data.length} request pengembalian pending.`);
  
  const pendingReq = pendingRequestsRes.data.find((r: any) => r.loanId === activeLoan.id);
  if (!pendingReq) {
    console.log("❌ Request tidak ditemukan di daftar pending!");
    process.exit(1);
  }
  console.log("✅ Request ID yang akan diproses:", pendingReq.id);

  // 5. Super Admin memproses pengembalian
  console.log("➤ Super Admin menyetujui pengembalian...");
  try {
    const resApprove = await loanService.approveReturnRequest(pendingReq.id, superAdmin.id);
    console.log("✅ Approve berhasil:", resApprove.message);
  } catch (err: any) {
    console.log("❌ Approve gagal:", err.message);
    process.exit(1);
  }

  // 6. Verifikasi final
  const updatedLoan = await db.query.loans.findFirst({
    where: eq(loans.id, activeLoan.id)
  });
  if (updatedLoan?.status === "returned") {
    console.log("🎉 Test selesai! Status buku berhasil menjadi 'returned'.");
  } else {
    console.log("❌ Test gagal! Status buku tidak berubah:", updatedLoan?.status);
  }
  
  process.exit(0);
}

runTest().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
