import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
  fetchOptions: {
    onRequest: (ctx) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        ctx.headers.set("Authorization", `Bearer ${token}`);
      }
    },
  },
});
