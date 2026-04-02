import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../service/auth.service';
import { db } from '../../../db';
import { auth } from '../../../lib/auth';
import { AppError, UnauthorizedError } from '../../../exceptions/AppError';

// 1. ARRANGE: MOCK DATABASE (Drizzle ORM)
vi.mock('../../../db', () => ({
  db: {
    query: {
      Users: { findFirst: vi.fn() },
      members: { findFirst: vi.fn() }
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn()
      })
    })
  }
}));

// 2. ARRANGE: MOCK LIBRARY "BETTER AUTH"
vi.mock('../../../lib/auth', () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
      signInEmail: vi.fn()
    }
  }
}));

describe('AuthService Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
  });

  describe('registerWithCredentials', () => {
    it('harus throw error 409 jika email sudah terdaftar di Database', async () => {
      // Rekayasa seolah-olah Database menemukan email yang sama
      (db.query.Users.findFirst as any).mockResolvedValueOnce({ id: '1', email: 'test@example.com' });

      // Cek apakah function membalas dengan lemparan Error AppError
      await expect(
        authService.registerWithCredentials('Nama', 'test@example.com', 'password123')
      ).rejects.toThrowError(new AppError("Email sudah terdaftar", 409));
    });

    it('harus sukses register jika email unik dan BetterAuth berhasil', async () => {
      // Rekayasa Database kosong (email belum dipakai)
      (db.query.Users.findFirst as any).mockResolvedValueOnce(null);
      // Rekayasa BetterAuth sukses membuat User
      (auth.api.signUpEmail as any).mockResolvedValueOnce({
        user: { id: 'auth-id', name: 'User Baru', email: 'test@example.com', role: 'student', createdAt: new Date() },
        token: 'token-rahasia'
      });

      const result = await authService.registerWithCredentials('User Baru', 'test@example.com', 'password123');

      expect(result.user.id).toBe('auth-id');
      expect(result.token).toBe('token-rahasia');
      expect(auth.api.signUpEmail).toHaveBeenCalledWith({
        body: { name: 'User Baru', email: 'test@example.com', password: 'password123' }
      });
    });
  });

  describe('loginWithCredentials', () => {
    it('harus throw error Unauthorized jika respon BetterAuth menolak password', async () => {
      // Rekayasa BetterAuth gagal (passwords tidak cocok)
      (auth.api.signInEmail as any).mockResolvedValueOnce(null);

      await expect(
        authService.loginWithCredentials('test@example.com', 'passwordsalah')
      ).rejects.toThrowError(new UnauthorizedError("Email atau password salah"));
    });

    it('harus mengembalikan Data User dan Token jika login sukses', async () => {
      (auth.api.signInEmail as any).mockResolvedValueOnce({
        user: { id: 'u1', name: 'Budi', email: 'budi@example.com', role: 'student' },
        token: 'token-valid'
      });

      const result = await authService.loginWithCredentials('budi@example.com', 'passwordbenar');

      expect(result.token).toBe('token-valid');
      expect(result.user.name).toBe('Budi');
      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: { email: 'budi@example.com', password: 'passwordbenar' }
      });
    });
  });
});
