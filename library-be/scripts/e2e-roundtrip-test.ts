/**
 * E2E Roundtrip Test: Register → Sync Member → Borrow → Approve → Return
 * Run: npx tsx scripts/e2e-roundtrip-test.ts
 */

const API = "http://localhost:4000";
const MEMBER_EMAIL = "roundtrip_test@test.com";
const MEMBER_PASSWORD = "Test123456!";
const MEMBER_NAME = "Budi Santoso";

let cookies: string[] = [];

async function req(method: string, path: string, body?: any, withAuth = true): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (withAuth && cookies.length) {
    headers["Cookie"] = cookies.join("; ");
  }
  headers["Origin"] = "http://localhost:4000";
  headers["Referer"] = "http://localhost:5173/";
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  // Capture set-cookie
  const setCookies = res.headers.getSetCookie?.() || [];
  for (const sc of setCookies) {
    const [pair] = sc.split(";");
    if (pair) cookies.push(pair);
  }
  const data = await res.json();
  return { status: res.status, ...data };
}

function log(emoji: string, msg: string) {
  console.log(`${emoji} ${msg}`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  E2E ROUNDTRIP TEST");
  console.log("═══════════════════════════════════════════════════\n");

  // ── Step 1: Register member ──
  log("📝", "Step 1: Register member...");
  const regRes = await req("POST", "/api/auth/sign-up/email", {
    name: MEMBER_NAME,
    email: MEMBER_EMAIL,
    password: MEMBER_PASSWORD,
  });
  const memberUserId = regRes.data?.user?.id;
  if (regRes.status === 201 || regRes.status === 200 || regRes.message?.includes("already")) {
    log("✅", `Member registered (status: ${regRes.status}), userId: ${memberUserId || "exists"}`);
  } else {
    log("❌", `Register failed: ${JSON.stringify(regRes)}`);
    return;
  }

  // ── Step 2: Login as admin ──
  log("🔑", "Step 2: Login as admin...");
  cookies = []; // Reset cookies
  const loginAdmin = await req("POST", "/api/auth/sign-in/email", {
    email: "admin@mucilib.ac.id",
    password: "Admin123456!",
  });
  if (loginAdmin.status === 200 && (loginAdmin.data?.user || loginAdmin.user)) {
    log("✅", `Admin logged in: ${loginAdmin.user?.name || loginAdmin.data?.user?.name}`);
  } else {
    log("❌", `Admin login failed: ${JSON.stringify(loginAdmin)}`);
    return;
  }

  // ── Step 3: Find member user ID ──
  log("🔍", "Step 3: Find member user ID...");
  const usersRes = await req("GET", "/api/users/all");
  const memberUser = usersRes.data?.find((u: any) => u.email === MEMBER_EMAIL);
  const memberUserIdFinal = memberUser?.id;
  if (!memberUserIdFinal) {
    log("❌", "Member user not found in users list");
    return;
  }
  log("✅", `Member userId: ${memberUserIdFinal}`);

  // ── Step 4: Sync member ──
  log("🔄", "Step 4: Sync member...");
  const syncRes = await req("POST", `/api/users/${memberUserIdFinal}/sync-member`);
  log(syncRes.success ? "✅" : "⚠️", `Sync: ${JSON.stringify(syncRes).substring(0, 200)}`);

  // Get member ID for loan
  const membersRes = await req("GET", "/api/members");
  const member = membersRes.data?.find((m: any) => m.userId === memberUserIdFinal);
  const memberId = member?.id;
  if (!memberId) {
    log("❌", "Member record not found after sync");
    return;
  }
  log("✅", `Member record ID: ${memberId}`);

  // ── Step 5: Issue card ──
  log("💳", "Step 5: Issue member card...");
  const cardRes = await req("POST", `/api/members/${memberUserIdFinal}/card/issue`, {});
  log(cardRes.success ? "✅" : "⚠️", `Card: ${JSON.stringify(cardRes).substring(0, 200)}`);

  // ── Step 6: Find available item ──
  log("📚", "Step 6: Find available item...");
  const itemsRes = await req("GET", "/api/items?limit=5&status=available");
  const items = itemsRes.data || [];
  const availableItem = items.find((i: any) => i.status === "available");
  if (!availableItem) {
    log("❌", "No available items found");
    return;
  }
  // Get item details for collectionId
  const itemDetailRes = await req("GET", `/api/items/${availableItem.id}`);
  const collectionId = itemDetailRes.data?.bibliographyId;
  if (!collectionId) {
    log("❌", "Could not get collectionId from item");
    return;
  }
  log("✅", `Item: ${availableItem.itemCode}, collectionId: ${collectionId}`);

  // ── Step 7: Member login ──
  log("🔑", "Step 7: Login as member...");
  cookies = [];
  const loginMember = await req("POST", "/api/auth/sign-in/email", {
    email: MEMBER_EMAIL,
    password: MEMBER_PASSWORD,
  });
  if (loginMember.status !== 200) {
    log("❌", `Member login failed: ${JSON.stringify(loginMember)}`);
    return;
  }
  log("✅", `Member logged in: ${loginMember.user?.name || MEMBER_NAME}`);

  // ── Step 8: Request loan ──
  log("📖", "Step 8: Request loan...");
  const loanReqRes = await req("POST", "/api/loans/request", {
    memberId,
    collectionId,
  });
  log(loanReqRes.success ? "✅" : "❌", `Loan request: ${JSON.stringify(loanReqRes).substring(0, 300)}`);

  // ── Step 9: Login as admin to approve ──
  log("🔑", "Step 9: Login as admin to approve...");
  cookies = [];
  await req("POST", "/api/auth/sign-in/email", {
    email: "admin@mucilib.ac.id",
    password: "Admin123456!",
  });

  // Get pending loan
  log("🔍", "Step 10: Find pending loan...");
  const loansRes = await req("GET", "/api/loans?status=pending");
  const loans = loansRes.data || [];
  if (loans.length === 0) {
    log("❌", "No pending loans found");
    return;
  }
  const pendingLoan = loans.find((l: any) => l.memberId === memberId || l.member?.userId === memberUserIdFinal) || loans[0];
  log("✅", `Pending loan: ${pendingLoan.id}`);

  // Approve loan
  log("✅", "Step 11: Approve loan...");
  const approveRes = await req("POST", `/api/loans/${pendingLoan.id}/approve`, {
    notes: "Approved via E2E test",
  });
  log(approveRes.success ? "✅" : "❌", `Approve: ${JSON.stringify(approveRes).substring(0, 300)}`);

  // ── Step 12: Verify approved ──
  log("🔍", "Step 12: Verify loan approved...");
  const approvedRes = await req("GET", "/api/loans?status=approved");
  const approvedLoans = approvedRes.data || [];
  const approvedLoan = approvedLoans.find((l: any) => l.id === pendingLoan.id);
  if (approvedLoan) {
    log("✅", `Loan approved! Status: ${approvedLoan.status}`);
  } else {
    log("⚠️", "Loan not found in approved list, checking all...");
    const allLoans = await req("GET", "/api/loans");
    const found = allLoans.data?.find((l: any) => l.id === pendingLoan.id);
    log("ℹ️", `Loan status: ${found?.status || "unknown"}`);
  }

  // ── Step 13: Member login & create return request ──
  log("🔑", "Step 13: Login as member for return...");
  cookies = [];
  await req("POST", "/api/auth/sign-in/email", {
    email: MEMBER_EMAIL,
    password: MEMBER_PASSWORD,
  });

  log("🔄", "Step 14: Create return request...");
  const returnReqRes = await req("POST", `/api/loans/${pendingLoan.id}/return-request`, {});
  log(returnReqRes.success ? "✅" : "⚠️", `Return request: ${JSON.stringify(returnReqRes).substring(0, 300)}`);

  // ── Step 15: Admin login & approve return ──
  log("🔑", "Step 15: Login as admin to approve return...");
  cookies = [];
  await req("POST", "/api/auth/sign-in/email", {
    email: "admin@mucilib.ac.id",
    password: "Admin123456!",
  });

  log("🔍", "Step 16: Find pending return requests...");
  const returnReqs = await req("GET", "/api/loans/return-requests/pending");
  log("ℹ️", `Pending return requests: ${JSON.stringify(returnReqs).substring(0, 300)}`);

  if (returnReqs.success && Array.isArray(returnReqs.data) && returnReqs.data.length > 0) {
    const reqToApprove = returnReqs.data.find((r: any) => r.loanId === pendingLoan.id) || returnReqs.data[0];
    log("✅", "Step 17: Approve return...");
    const approveReturnRes = await req("POST", `/api/loans/return-requests/${reqToApprove.id}/approve`);
    log(approveReturnRes.success ? "✅" : "❌", `Approve return: ${JSON.stringify(approveReturnRes).substring(0, 300)}`);
  } else {
    log("⚠️", "No pending return requests found, trying direct return...");
    const directReturn = await req("POST", `/api/loans/${pendingLoan.id}/return`, {
      condition: "good",
    });
    log(directReturn.success ? "✅" : "❌", `Direct return: ${JSON.stringify(directReturn).substring(0, 300)}`);
  }

  // ── Step 18: Final verification ──
  log("🔍", "Step 18: Final verification...");
  try {
    const directItem = await req("GET", `/api/items/${availableItem.id}`);
    if (directItem.success) {
      const status = directItem.data?.status;
      log(status === "available" ? "✅" : "⚠️", `Item status: ${status}`);
    } else {
      log("⚠️", "Item lookup returned: " + JSON.stringify(directItem).substring(0, 100));
    }
  } catch {
    log("⚠️", "Item verification skipped");
  }

  const finalLoans = await req("GET", "/api/loans?status=returned");
  const returnedLoans = finalLoans.data?.filter((l: any) => l.id === pendingLoan.id) || [];
  log(returnedLoans.length > 0 ? "✅" : "⚠️", `Loan in returned list: ${returnedLoans.length > 0 ? "YES" : "NO"}`);

  console.log("\n═══════════════════════════════════════════════════");
  log("🏁", "Roundtrip test complete!");
  console.log("═══════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
