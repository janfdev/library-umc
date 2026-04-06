import { API_BASE_URL } from "@/utils/api-config";

export interface MemberProfile {
  id: string;
  userId: string;
  memberType: "student" | "lecturer" | "staff" | "super_admin";
  nimNidn: string | null;
  faculty: string | null;
  phone: string | null;
  cardStatus: "not_requested" | "pending" | "active" | "rejected" | "expired";
  cardNumber: string | null;
  cardRequestedAt: string | null;
  cardApprovedAt: string | null;
  cardRejectedAt: string | null;
  cardRejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
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

  async getMyProfile(): Promise<MemberProfile> {
    const response = await fetch(`${this.baseUrl}/api/members/me`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Gagal memuat profil");
    }
    return result.data;
  }

  async updateMyProfile(payload: UpdateProfilePayload): Promise<MemberProfile> {
    const response = await fetch(`${this.baseUrl}/api/members/me`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Gagal memperbarui profil");
    }
    return result.data;
  }

  async requestMyMemberCard(): Promise<MemberProfile> {
    const response = await fetch(
      `${this.baseUrl}/api/members/me/card/request`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      }
    );

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Gagal mengajukan kartu member");
    }

    return this.getMyProfile();
  }
}

export default new MemberService();
