import { API_BASE_URL } from "@/utils/api-config";

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "super_admin" | "staff" | "student" | "lecturer" | string;
  banned: boolean;
  createdAt: string;
}

const jsonOrThrow = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

export const usersManagementService = {
  async getUsers(): Promise<DashboardUser[]> {
    const res = await fetch(`${API_BASE_URL}/api/users/all`, {
      credentials: "include",
    });
    const data = await jsonOrThrow(res);
    return data.success && Array.isArray(data.data) ? data.data : [];
  },

  async updateRole(userId: string, role: string) {
    const res = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });
    return jsonOrThrow(res);
  },

  async updateBanStatus(userId: string, banned: boolean, banReason?: string) {
    const res = await fetch(`${API_BASE_URL}/api/users/${userId}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ banned, banReason }),
    });
    return jsonOrThrow(res);
  },
};
