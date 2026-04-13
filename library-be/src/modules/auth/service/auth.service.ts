import { db } from "../../../db";
import { Users as UserTable, members as MemberTable } from "../../../db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  AppError,
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../../../exceptions/AppError";

export interface CampusUserData {
  id: string;
  name: string;
  email: string;
  role: string;
  nim?: string;
  nidn?: string;
  faculty?: string;
  phone?: string;
}

export interface AuthResponseData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    createdAt?: Date;
  };
  token: string | null;
}

export class AuthService {
  private readonly CAMPUS_API_TIMEOUT = 15000;

  private mapCampusRoleToMemberType(campusUser: CampusUserData) {
    let memberType: "student" | "lecturer" | "staff" | "super_admin" =
      "student";
    let nimNidnValue = campusUser.nim;

    if (campusUser.nidn) {
      memberType = "lecturer";
      nimNidnValue = campusUser.nidn;
    }

    if (campusUser.role === "dosen") memberType = "lecturer";
    if (campusUser.role === "staff") memberType = "staff";

    return {
      memberType,
      nimNidn: nimNidnValue || "-",
      faculty: campusUser.faculty || "-",
      phone: campusUser.phone || null,
    };
  }

  async getCampusUser(email: string): Promise<CampusUserData> {
    if (!email || !email.includes("@")) {
      throw new BadRequestError("Format email tidak valid");
    }

    const baseUrl = process.env.BASE_URL_API_UMC;
    if (!baseUrl) {
      throw new InternalServerError("Konfigurasi API Kampus belum tersedia");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.CAMPUS_API_TIMEOUT,
    );

    try {
      const response = await fetch(`${baseUrl}/oauth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new InternalServerError(`API Kampus error: ${response.status}`);
      }

      const responseData = (await response.json()) as {
        success: boolean;
        data?: { user: CampusUserData };
      };

      if (!responseData.success || !responseData.data?.user) {
        throw new NotFoundError("User tidak ditemukan di sistem kampus");
      }

      return responseData.data.user;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (
        err instanceof BadRequestError ||
        err instanceof NotFoundError ||
        err instanceof InternalServerError
      ) {
        throw err;
      }

      if (err instanceof Error && err.name === "AbortError") {
        throw new InternalServerError("Request ke API Kampus timeout");
      }

      console.error("[AuthService] Campus API Exception:", err);
      throw new InternalServerError("Gagal terhubung ke API Kampus");
    }
  }

  async syncMember(userId: string, campusUser: CampusUserData) {
    if (!userId) {
      throw new BadRequestError("User ID wajib diisi");
    }

    try {
      const existingMember = await db.query.members.findFirst({
        where: eq(MemberTable.userId, userId),
      });

      if (existingMember) {
        return existingMember;
      }

      const memberPayload = this.mapCampusRoleToMemberType(campusUser);

      const [newMember] = await db
        .insert(MemberTable)
        .values({
          userId: userId,
          memberType: memberPayload.memberType,
          nimNidn: memberPayload.nimNidn,
          faculty: memberPayload.faculty,
          phone: memberPayload.phone,
        })
        .returning();

      return newMember;
    } catch (error) {
      console.error(`[AuthService] Sync Member FAILED:`, error);
      throw new InternalServerError(
        "Gagal sinkronisasi data member ke database",
      );
    }
  }

  async syncUserMemberByUserId(userId: string) {
    if (!userId) {
      throw new BadRequestError("User ID wajib diisi");
    }

    const user = await db.query.Users.findFirst({
      where: and(eq(UserTable.id, userId), isNull(UserTable.deletedAt)),
    });

    if (!user) {
      throw new NotFoundError("User tidak ditemukan");
    }

    const campusUser = await this.getCampusUser(user.email);
    const memberPayload = this.mapCampusRoleToMemberType(campusUser);

    const existingMember = await db.query.members.findFirst({
      where: eq(MemberTable.userId, userId),
    });

    if (existingMember?.deletedAt === null) {
      throw new BadRequestError(
        "User sudah tersinkronisasi. Sync manual hanya untuk user yang belum sinkron.",
      );
    }

    if (!existingMember) {
      const [newMember] = await db
        .insert(MemberTable)
        .values({
          userId,
          memberType: memberPayload.memberType,
          nimNidn: memberPayload.nimNidn,
          faculty: memberPayload.faculty,
          phone: memberPayload.phone,
          deletedAt: null,
        })
        .returning();

      return {
        userId,
        email: user.email,
        mode: "created" as const,
        member: newMember,
      };
    }

    const [updatedMember] = await db
      .update(MemberTable)
      .set({
        memberType: memberPayload.memberType,
        nimNidn: memberPayload.nimNidn,
        faculty: memberPayload.faculty,
        phone: memberPayload.phone,
        updatedAt: new Date(),
        deletedAt: null,
      })
      .where(eq(MemberTable.id, existingMember.id))
      .returning();

    return {
      userId,
      email: user.email,
      mode: "restored" as const,
      member: updatedMember,
    };
  }

  async verifyWithCampus(email: string) {
    const campusUser = await this.getCampusUser(email);

    const localUser = await db.query.Users.findFirst({
      where: eq(UserTable.email, email),
      with: { member: true },
    });

    return { campusData: campusUser, localUser };
  }

  async registerWithCredentials(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponseData> {
    const existingUser = await db.query.Users.findFirst({
      where: eq(UserTable.email, email),
    });

    if (existingUser) {
      throw new AppError("Email sudah terdaftar", 409);
    }

    const { auth } = await import("../../../lib/auth");

    try {
      const result = await auth.api.signUpEmail({
        body: { name, email, password },
      });

      if (!result?.user) {
        throw new InternalServerError("Gagal membuat akun");
      }

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role || "student",
          createdAt: result.user.createdAt,
        },
        token: result.token,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }

      const error = err as Error;
      if (error.message?.includes("already exists")) {
        throw new AppError("Email sudah terdaftar", 409);
      }
      throw new InternalServerError(
        error.message || "Gagal melakukan registrasi",
      );
    }
  }

  async loginWithCredentials(
    email: string,
    password: string,
  ): Promise<AuthResponseData> {
    const { auth } = await import("../../../lib/auth");

    try {
      const result = await auth.api.signInEmail({
        body: { email, password },
      });

      if (!result?.user) {
        throw new UnauthorizedError("Email atau password salah");
      }

      return {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role || "student",
          image: result.user.image,
        },
        token: result.token,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        throw err;
      }

      const error = err as Error;
      if (
        error.message?.includes("Invalid") ||
        error.message?.includes("credentials") ||
        error.message?.includes("authenticated")
      ) {
        throw new UnauthorizedError("Email atau password salah");
      }
      throw new InternalServerError(error.message || "Gagal melakukan login");
    }
  }
}
