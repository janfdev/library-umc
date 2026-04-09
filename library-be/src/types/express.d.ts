import { type Session, type User } from "better-auth";

declare global {
  namespace Express {
    interface Request {
      user?: User & { role?: string | null };
      session?: Session;
    }
  }
}