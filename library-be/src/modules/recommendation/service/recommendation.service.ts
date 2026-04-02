import { db } from "../../../db";
import { recommendations } from "../../../db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  BadRequestError,
  NotFoundError,
  InternalServerError,
} from "../../../exceptions/AppError";

type RecommendationData = {
  title: string;
  author?: string;
  publisher?: string;
  reason?: string;
};

class RecommendationsService {
  /**
   * Dosen submits a new book recommendation
   */
  async createRecommendation(dosenId: string, data: RecommendationData) {
    try {
      if (!data.title) {
        throw new BadRequestError("Judul buku diperlukan.");
      }

      const [newRec] = await db
        .insert(recommendations)
        .values({
          dosenId,
          title: data.title,
          author: data.author,
          publisher: data.publisher,
          reason: data.reason,
          status: "pending",
        })
        .returning();

      return {
        success: true,
        message: "Rekomendasi buku berhasil dikirim.",
        data: newRec,
      };
    } catch (error) {
      if (error instanceof BadRequestError) throw error;
      console.error(
        "RecommendationsService.createRecommendation Error:",
        error,
      );
      throw new InternalServerError("Gagal membuat rekomendasi.");
    }
  }

  /**
   * Get all recommendations (for admin)
   */
  async getAllRecommendations(
    filters: { status?: "pending" | "approved" | "rejected" } = {},
  ) {
    try {
      const conditions = [isNull(recommendations.deletedAt)];

      if (filters.status) {
        conditions.push(eq(recommendations.status, filters.status));
      }

      const result = await db.query.recommendations.findMany({
        where: and(...conditions),
        with: {
          dosen: true,
        },
        orderBy: [desc(recommendations.createdAt)],
      });

      return {
        success: true,
        message: "Berhasil mengambil data rekomendasi.",
        data: result,
      };
    } catch (error) {
      console.error(
        "RecommendationsService.getAllRecommendations Error:",
        error,
      );
      throw new InternalServerError("Gagal mengambil data rekomendasi.");
    }
  }

  /**
   * Get my recommendations (for dosen)
   */
  async getMyRecommendations(dosenId: string) {
    try {
      const result = await db.query.recommendations.findMany({
        where: and(
          eq(recommendations.dosenId, dosenId),
          isNull(recommendations.deletedAt),
        ),
        orderBy: [desc(recommendations.createdAt)],
      });

      return {
        success: true,
        message: "Berhasil mengambil riwayat rekomendasi Anda.",
        data: result,
      };
    } catch (error) {
      console.error(
        "RecommendationsService.getMyRecommendations Error:",
        error,
      );
      throw new InternalServerError("Gagal mengambil riwayat rekomendasi.");
    }
  }

  /**
   * Admin approves or rejects recommendation
   */
  async updateRecommendationStatus(
    id: string,
    status: "approved" | "rejected",
  ) {
    try {
      const rec = await db.query.recommendations.findFirst({
        where: and(
          eq(recommendations.id, id),
          isNull(recommendations.deletedAt),
        ),
      });

      if (!rec) {
        throw new NotFoundError("Data rekomendasi tidak ditemukan.");
      }

      if (rec.status !== "pending") {
        throw new BadRequestError(`Rekomendasi ini sudah di-${rec.status}.`);
      }

      const [updated] = await db
        .update(recommendations)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(recommendations.id, id))
        .returning();

      return {
        success: true,
        message: `Rekomendasi berhasil di-${status}.`,
        data: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      console.error(
        "RecommendationsService.updateRecommendationStatus Error:",
        error,
      );
      throw new InternalServerError("Gagal memperbarui status rekomendasi.");
    }
  }

  /**
   * Soft Delete recommendation
   */
  async deleteRecommendation(id: string) {
    try {
      const rec = await db.query.recommendations.findFirst({
        where: and(
          eq(recommendations.id, id),
          isNull(recommendations.deletedAt),
        ),
      });

      if (!rec) {
        throw new NotFoundError("Data rekomendasi tidak ditemukan.");
      }

      await db
        .update(recommendations)
        .set({ deletedAt: new Date() })
        .where(eq(recommendations.id, id));

      return {
        success: true,
        message: "Rekomendasi berhasil dihapus.",
      };
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      console.error(
        "RecommendationsService.deleteRecommendation Error:",
        error,
      );
      throw new InternalServerError("Gagal menghapus rekomendasi.");
    }
  }
}

export default new RecommendationsService();
