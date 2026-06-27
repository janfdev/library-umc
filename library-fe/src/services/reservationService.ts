// src/services/reservationService.ts
// Service untuk fitur Reservasi Buku
import { API_BASE_URL } from '@/utils/api-config';

export interface Reservation {
  id: string;
  memberId: string;
  bibliographyId: string;
  status: 'waiting' | 'fulfilled' | 'canceled';
  createdAt: string;
  updatedAt: string;
  bibliography?: {
    id: string;
    title: string;
    author: string;
    publisher: string;
    publicationYear: number;
    isbn?: string;
    type: string;
    image?: string;
  };
  member?: {
    id: string;
    nimNidn: string;
    user?: { name: string };
  };
}

class ReservationService {
  private baseUrl = API_BASE_URL;

  // GET /reservations/my — reservasi milik user yang sedang login
  async getMyReservations(): Promise<Reservation[]> {
    const response = await fetch(`${this.baseUrl}/api/reservations/my`, {
      credentials: 'include',
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal memuat reservasi');
    return Array.isArray(result.data) ? result.data : [];
  }

  // POST /reservations — buat reservasi baru
  async createReservation(bibliographyId: string): Promise<Reservation> {
    const response = await fetch(`${this.baseUrl}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bibliographyId }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal membuat reservasi');
    return result.data;
  }

  // DELETE /reservations/:id — batalkan reservasi
  async cancelReservation(reservationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/reservations/${reservationId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Gagal membatalkan reservasi');
  }
}

export default new ReservationService();
