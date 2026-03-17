// src/services/memberService.ts
import { API_BASE_URL } from '@/lib/api-config';

export interface MemberProfile {
  id: string;
  userId: string;
  memberType: 'student' | 'lecturer' | 'staff' | 'super_admin';
  nimNidn: string | null;
  faculty: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  // Join dari tabel Users
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
  };
}

export interface UpdateProfilePayload {
  nimNidn?: string;
  faculty?: string;
  phone?: string;
}

class MemberService {
  private baseUrl = API_BASE_URL;

  /**
   * GET /api/members/me
   * Ambil profil member yang sedang login
   */
  async getMyProfile(): Promise<MemberProfile> {
    const response = await fetch(`${this.baseUrl}/api/members/me`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Gagal memuat profil');
    }
    return result.data;
  }

  /**
   * PATCH /api/members/me
   * Update profil member (nimNidn, faculty, phone)
   */
  async updateMyProfile(payload: UpdateProfilePayload): Promise<MemberProfile> {
    const response = await fetch(`${this.baseUrl}/api/members/me`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Gagal memperbarui profil');
    }
    return result.data;
  }
}

export default new MemberService();
