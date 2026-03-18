import { API_BASE_URL } from '@/utils/api-config';

export interface Loan {
  id: string;
  requestId?: string;
  itemId: string;           
  memberId: string;
  memberName?: string;
  memberNim?: string;
  collectionTitle?: string;
  collectionAuthor?: string;
  loanDate: string;         
  dueDate: string;          
  returnDate?: string;      
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'extended';
  requestDate?: string;
  approvedBy?: string;     
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  rejectReason?: string;
  fine?: number;
  member?: Record<string, unknown>;
  item?: Record<string, unknown>;
}

class LoanService {
  private baseUrl = API_BASE_URL;

  // POST /loans/request - Request a book loan (Member)
  async requestLoan(data: {
    memberId: string;
    itemId: string;       // ✅ ganti dari collectionId → itemId
    loanDate: string;     // ✅ ganti dari startDate → loanDate
    dueDate: string;      // ✅ ganti dari endDate → dueDate
    notes?: string;
  }): Promise<Loan> {
    const response = await fetch(`${this.baseUrl}/api/loans/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal mengajukan peminjaman');
    return result.data;
  }

  // GET /loans - Get all loans (Admin)
  async getAllLoans(params?: {
    status?: string;
    memberId?: string;
    itemId?: string;      // ✅ ganti dari collectionId → itemId
  }): Promise<Loan[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.memberId) queryParams.append('memberId', params.memberId);
    if (params?.itemId) queryParams.append('itemId', params.itemId); // ✅

    const url = `${this.baseUrl}/api/loans${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { credentials: 'include' });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal memuat data peminjaman');
    return result.data;
  }

  // GET /loans/history - Get my loan history (Member)
  async getMyLoanHistory(): Promise<Loan[]> {
    const response = await fetch(`${this.baseUrl}/api/loans/history`, {
      credentials: 'include',
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal memuat riwayat peminjaman');
    return result.data;
  }

  // POST /loans/{requestId}/approve - Approve loan (Admin)
  async approveLoan(requestId: string, notes?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loans/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ notes }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal menyetujui peminjaman');
  }

  // POST /loans/{requestId}/reject - Reject loan (Admin)
  async rejectLoan(requestId: string, reason: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loans/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal menolak peminjaman');
  }

  // POST /loans/{loanId}/return - Return a book (Member/Admin)
  async returnBook(loanId: string, condition?: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/loans/${loanId}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ condition }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal mengembalikan buku');
  }

  // GET /loans/verify/{token} - Verify loan token
  async verifyLoanToken(token: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/loans/verify/${token}`, {
      credentials: 'include',
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Token tidak valid');
    return result.data;
  }
}

export default new LoanService();