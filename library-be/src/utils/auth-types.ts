export const ROLES = {
  STUDENT: "student",
  LECTURER: "lecturer",
  STAFF: "staff",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.STUDENT]: "Mahasiswa",
  [ROLES.LECTURER]: "Dosen",
  [ROLES.STAFF]: "Staff",
  [ROLES.SUPER_ADMIN]: "Super Admin",
};

// --- Permissions Logic ---

// Infer Permission keys from Student
export type Permission = keyof (typeof ROLE_PERMISSIONS)[typeof ROLES.STUDENT];

export const ROLE_PERMISSIONS = {
  [ROLES.STUDENT]: {
    canManageOtherUsers: false,
    canRecommendBook: false, // Typo fixed
    canVerifyFines: false,
    canManageLoans: false,
    canManageBibliographies: false, // CRUD Buku (Baru)
  },
  [ROLES.LECTURER]: {
    canManageOtherUsers: false,
    canRecommendBook: true,
    canVerifyFines: false,
    canManageLoans: false,
    canManageBibliographies: false,
  },
  [ROLES.STAFF]: {
    canManageOtherUsers: false,
    canRecommendBook: false,
    canVerifyFines: true,
    canManageLoans: true,
    canManageBibliographies: true, // Staff bisa Tambah/Edit/Hapus Buku
  },
  [ROLES.SUPER_ADMIN]: {
    canManageOtherUsers: true,
    canRecommendBook: true,
    canVerifyFines: true,
    canManageLoans: true,
    canManageBibliographies: true,
  },
} as const;

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return (permissions as any)?.[permission] === true;
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === ROLES.SUPER_ADMIN;
}
