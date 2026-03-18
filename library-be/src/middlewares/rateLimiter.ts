import rateLimit from "express-rate-limit";

/**
 * Rate Limiter Configuration for Production
 *
 * Security Strategy:
 * 1. Strict limits for authentication endpoints (prevent brute force)
 * 2. Moderate limits for public API endpoints (prevent abuse)
 * 3. Relaxed limits for authenticated users
 *
 * NOTE: express-rate-limit v7+ sudah menangani IPv4-mapped IPv6 bypass
 * (CVE #28) secara internal. Tidak perlu custom keyGenerator.
 * Menggunakan custom keyGenerator yang membaca req.ip secara manual
 * justru akan memunculkan ValidationError: ERR_ERL_KEY_GEN_IPV6.
 */

// 1. STRICT - Authentication endpoints (login, register, password reset)
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  limit: 5, // maks 5 request per windowMs
  message: {
    status: 429,
    message: "Terlalu banyak percobaan login. Silakan coba lagi dalam 10 menit.",
  },
  standardHeaders: "draft-7", // RateLimit headers IETF draft-7
  legacyHeaders: false,       // Nonaktifkan X-RateLimit-*
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// 2. MODERATE - Public GET endpoints (books, categories, etc)
export const publicApiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  limit: 100,                // maks 100 request per windowMs
  message: {
    status: 429,
    message: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// 3. GENERAL - All other API endpoints
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  limit: 300,               // maks 300 request per menit
  message: {
    status: 429,
    message: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// 4. VERY STRICT - For sensitive operations (delete, admin actions)
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  limit: 10,                 // maks 10 request per jam
  message: {
    status: 429,
    message: "Terlalu banyak operasi sensitif. Silakan coba lagi dalam 1 jam.",
  },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
