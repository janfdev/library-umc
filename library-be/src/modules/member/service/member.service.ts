import { db } from "../../../db";
import { members } from "../../../db/schema";
import { eq, and, isNull } from "drizzle-orm";

type ServiceResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

type UpdateProfileData = {
  nimNidn?: string;
  faculty?: string;
  phone?: string;
};

type MemberCardStatus =
  | "not_requested"
  | "pending"
  | "active"
  | "rejected"
  | "expired";

export class MemberService {
  private generateCardNumber(memberId: string): string {
    const shortId = memberId.replace(/-/g, "").slice(-8).toUpperCase();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `UMCLIB-${date}-${shortId}`;
  }

  /**
   * Get member by user ID
   */
  async getMemberByUserId(userId: string): Promise<ServiceResponse<any>> {
    try {
      // Validate userId
      if (!userId) {
        return {
          success: false,
          message: "User ID is required",
          data: null
        };
      }

      const member = await db.query.members.findFirst({
        where: and(eq(members.userId, userId), isNull(members.deletedAt)),
        with: {
          user: true
        }
      });

      if (!member) {
        return {
          success: false,
          message: "Member not found",
          data: null
        };
      }

      return {
        success: true,
        message: "Member retrieved successfully",
        data: member
      };
    } catch (err) {
      console.error("[MemberService] Error getting member by userId:", err);
      return {
        success: false,
        message: "Failed to get member",
        data: null
      };
    }
  }

  /**
   * Reusable gate for borrowing actions
   */
  async getBorrowEligibilityByUserId(userId: string): Promise<
    ServiceResponse<{
      memberId: string;
      cardStatus: MemberCardStatus;
      cardNumber: string | null;
    }>
  > {
    try {
      if (!userId) {
        return {
          success: false,
          message: "User ID is required",
          data: null
        };
      }

      const member = await db.query.members.findFirst({
        where: and(eq(members.userId, userId), isNull(members.deletedAt))
      });

      if (!member) {
        return {
          success: false,
          message:
            "Profil member belum tersedia. Silakan sinkronisasi data GREAT terlebih dahulu.",
          data: null
        };
      }

      if (member.cardStatus !== "active") {
        const statusMessage: Record<MemberCardStatus, string> = {
          not_requested:
            "Kartu member belum diajukan. Ajukan kartu member terlebih dahulu.",
          pending: "Kartu member Anda masih menunggu persetujuan admin.",
          rejected:
            "Pengajuan kartu member ditolak. Periksa alasan penolakan pada profil Anda.",
          expired:
            "Kartu member Anda sudah kedaluwarsa. Ajukan aktivasi ulang.",
          active: "Kartu member aktif."
        };

        return {
          success: false,
          message: statusMessage[member.cardStatus as MemberCardStatus],
          data: {
            memberId: member.id,
            cardStatus: member.cardStatus as MemberCardStatus,
            cardNumber: member.cardNumber
          }
        };
      }

      return {
        success: true,
        message: "Eligible for borrowing",
        data: {
          memberId: member.id,
          cardStatus: member.cardStatus as MemberCardStatus,
          cardNumber: member.cardNumber
        }
      };
    } catch (err) {
      console.error("[MemberService] Error checking borrow eligibility:", err);
      return {
        success: false,
        message: "Failed to validate borrowing eligibility",
        data: null
      };
    }
  }

  async getMyCardByUserId(userId: string): Promise<ServiceResponse<any>> {
    try {
      const member = await db.query.members.findFirst({
        where: and(eq(members.userId, userId), isNull(members.deletedAt))
      });

      if (!member) {
        return {
          success: false,
          message: "Member not found",
          data: null
        };
      }

      return {
        success: true,
        message: "Member card data retrieved successfully",
        data: {
          memberId: member.id,
          cardStatus: member.cardStatus,
          cardNumber: member.cardNumber,
          cardRequestedAt: member.cardRequestedAt,
          cardApprovedAt: member.cardApprovedAt,
          cardRejectedAt: member.cardRejectedAt,
          cardRejectedReason: member.cardRejectedReason
        }
      };
    } catch (err) {
      console.error("[MemberService] Error getting member card:", err);
      return {
        success: false,
        message: "Failed to get member card",
        data: null
      };
    }
  }

  async requestMemberCard(userId: string): Promise<ServiceResponse<any>> {
    try {
      const member = await db.query.members.findFirst({
        where: and(eq(members.userId, userId), isNull(members.deletedAt))
      });

      if (!member) {
        return {
          success: false,
          message:
            "Profil member belum tersedia. Silakan sinkronisasi data GREAT terlebih dahulu.",
          data: null
        };
      }

      if (member.cardStatus === "active") {
        return {
          success: false,
          message: "Kartu member sudah aktif.",
          data: null
        };
      }

      if (member.cardStatus === "pending") {
        return {
          success: false,
          message: "Pengajuan kartu member Anda masih diproses.",
          data: null
        };
      }

      const [updated] = await db
        .update(members)
        .set({
          cardStatus: "pending",
          cardRequestedAt: new Date(),
          cardRejectedAt: null,
          cardRejectedReason: null,
          updatedAt: new Date()
        })
        .where(eq(members.id, member.id))
        .returning();

      return {
        success: true,
        message: "Pengajuan kartu member berhasil dibuat.",
        data: updated
      };
    } catch (err) {
      console.error("[MemberService] Error requesting member card:", err);
      return {
        success: false,
        message: "Failed to request member card",
        data: null
      };
    }
  }

  async approveMemberCard(
    memberId: string,
    cardNumber?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const member = await db.query.members.findFirst({
        where: and(eq(members.id, memberId), isNull(members.deletedAt))
      });

      if (!member) {
        return {
          success: false,
          message: "Member not found",
          data: null
        };
      }

      const nextCardNumber =
        cardNumber?.trim() ||
        member.cardNumber ||
        this.generateCardNumber(member.id);

      const [updated] = await db
        .update(members)
        .set({
          cardStatus: "active",
          cardNumber: nextCardNumber,
          cardApprovedAt: new Date(),
          cardRejectedAt: null,
          cardRejectedReason: null,
          updatedAt: new Date()
        })
        .where(eq(members.id, member.id))
        .returning();

      return {
        success: true,
        message: "Kartu member berhasil diaktifkan.",
        data: updated
      };
    } catch (err) {
      console.error("[MemberService] Error approving member card:", err);
      return {
        success: false,
        message: "Failed to approve member card",
        data: null
      };
    }
  }

  async rejectMemberCard(
    memberId: string,
    reason: string
  ): Promise<ServiceResponse<any>> {
    try {
      const member = await db.query.members.findFirst({
        where: and(eq(members.id, memberId), isNull(members.deletedAt))
      });

      if (!member) {
        return {
          success: false,
          message: "Member not found",
          data: null
        };
      }

      const [updated] = await db
        .update(members)
        .set({
          cardStatus: "rejected",
          cardRejectedAt: new Date(),
          cardRejectedReason: reason,
          updatedAt: new Date()
        })
        .where(eq(members.id, member.id))
        .returning();

      return {
        success: true,
        message: "Pengajuan kartu member ditolak.",
        data: updated
      };
    } catch (err) {
      console.error("[MemberService] Error rejecting member card:", err);
      return {
        success: false,
        message: "Failed to reject member card",
        data: null
      };
    }
  }

  async getPendingCardMembers(limit = 100): Promise<ServiceResponse<any[]>> {
    try {
      const pendingMembers = await db.query.members.findMany({
        where: and(
          eq(members.cardStatus, "pending"),
          isNull(members.deletedAt)
        ),
        with: {
          user: true
        },
        limit
      });

      return {
        success: true,
        message: "Pending member card requests retrieved successfully",
        data: pendingMembers
      };
    } catch (err) {
      console.error("[MemberService] Error getting pending card members:", err);
      return {
        success: false,
        message: "Failed to get pending member card requests",
        data: null
      };
    }
  }

  /**
   * Update member profile with validation
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileData
  ): Promise<ServiceResponse<any>> {
    try {
      // Validate userId
      if (!userId) {
        return {
          success: false,
          message: "User ID is required",
          data: null
        };
      }

      // Check if member exists
      const member = await db.query.members.findFirst({
        where: and(eq(members.userId, userId), isNull(members.deletedAt))
      });

      if (!member) {
        return {
          success: false,
          message: "Member not found",
          data: null
        };
      }

      // Validate phone number format (if provided)
      if (data.phone && data.phone.trim() !== "") {
        const phoneRegex = /^[\d\s\-+()]+$/;
        if (!phoneRegex.test(data.phone)) {
          return {
            success: false,
            message: "Invalid phone number format",
            data: null
          };
        }
      }

      // Prepare update data
      const updateDataMember = {
        nimNidn: data.nimNidn?.trim() || member.nimNidn,
        faculty: data.faculty?.trim() || member.faculty,
        phone: data.phone?.trim() || member.phone,
        updatedAt: new Date()
      };

      // Update member
      const [updatedMember] = await db
        .update(members)
        .set(updateDataMember)
        .where(and(eq(members.userId, userId), isNull(members.deletedAt)))
        .returning();

      if (!updatedMember) {
        return {
          success: false,
          message: "Failed to update profile",
          data: null
        };
      }

      return {
        success: true,
        message: "Profile updated successfully",
        data: updatedMember
      };
    } catch (err) {
      console.error("[MemberService] Error updating profile:", err);
      return {
        success: false,
        message: "Failed to update profile",
        data: null
      };
    }
  }
}
