import rateLimit from "express-rate-limit";
import type { Request } from "express";

/**
 * Rate Limiter Configuration for Production
 *
 * Security Strategy:
 * 1. Strict limits for authentication endpoints (prevent brute force)
 * 2. Moderate limits for public API endpoints (prevent abuse)
 * 3. Relaxed limits for authenticated users
 *
 * FIX: CVE express-rate-limit — IPv4-mapped IPv6 bypass
 * Server dengan dual-stack (IPv4 + IPv6) menerima address seperti "::ffff:1.2.3.4"
 * yang berbeda string dengan "1.2.3.4" padahal klien yang sama.
 * Solusi: normalizeIp() → strip prefix "::ffff:" agar keduanya dihitung 1 client.
 */

/**
 * Normalize IPv4-mapped IPv6 addresses to plain IPv4.
 * e.g. "::ffff:192.168.1.1" → "192.168.1.1"
 */
function normalizeIp(ip: string | undefined): string {
  if (!ip) return "unknown";
  // IPv4-mapped IPv6: "::ffff:x.x.x.x"
  if (ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }
  return ip;
}

/**
 * Custom key generator that normalizes the client IP
 * to prevent IPv4-mapped IPv6 bypass.
 */
function makeKeyGenerator(prefix: string) {
  return (req: Request): string => {
    const raw = (req.ip ?? req.socket?.remoteAddress) as string | undefined;
    return `${prefix}:${normalizeIp(raw)}`;
  };
}

// 1. STRICT - Authentication endpoints (login, register, password reset)
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5, // 5 requests per windowMs (renamed from `max` in v7+)
  message: {
    status: 429,
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 10 menit.",
  },
  standardHeaders: "draft-7", // RateLimit headers (IETF draft-7)
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: makeKeyGenerator("auth"),
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// 2. MODERATE - Public GET endpoints (books, categories, etc)
export const publicApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 100, // 100 requests per windowMs
  message: {
    status: 429,
    message: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: makeKeyGenerator("public"),
  skipSuccessfulRequests: false,
});

// 3. GENERAL - All other API endpoints
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 300, // 300 requests per minute
  message: {
    status: 429,
    message: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: makeKeyGenerator("general"),
});

// 4. VERY STRICT - For sensitive operations (delete, admin actions)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // 10 requests per hour
  message: {
    status: 429,
    message: "Terlalu banyak operasi sensitif. Silakan coba lagi dalam 1 jam.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: makeKeyGenerator("strict"),
});
