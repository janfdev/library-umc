import { createAuthClient } from "better-auth/react";

// Mendefinisikan interface eksplisit agar TypeScript mengenali metode forgetPassword 
// tanpa harus melakukan infer tipe dari backend (yang membutuhkan setup monorepo khusus).
export interface ExtendedAuthClient {
  forgetPassword: (options: {
    email: string;
    redirectTo: string;
  }) => Promise<{
    data: { status: boolean } | null;
    error: { message: string; code?: string } | null;
  }>;
}

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL
}) as ReturnType<typeof createAuthClient> & ExtendedAuthClient;
