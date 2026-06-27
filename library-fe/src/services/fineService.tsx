import { API_BASE_URL } from "@/utils/api-config";

export interface Fine {
  id: string;
  amount: number;
  status: "paid" | "unpaid";
  loanId: string;
  loan?: {
    dueDate: string;
    loanDate: string;
    item: {
      bibliography: {
        title: string;
      };
    };
  };
}

class FineService {
  private baseUrl = `${API_BASE_URL}/api/fines`;

  async getMyFines(): Promise<Fine[]> {
    const response = await fetch(`${this.baseUrl}/my`, {
      credentials: "include"
    });
    const result = await response.json();
    if (!result.success)
      throw new Error(result.message || "Gagal memuat data denda");
    return result.data;
  }
}

export default new FineService();
