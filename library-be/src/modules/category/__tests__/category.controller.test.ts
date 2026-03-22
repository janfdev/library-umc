import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { CategoryController } from '../controller/category.controller';
import { CategoryService } from '../service/category.service';

const app = express();
app.use(express.json());

const categoryController = new CategoryController();

// Setup routing palsu untuk testing fungsi Controller
app.get('/categories', (req, res) => categoryController.getAllCategories(req, res));
app.get('/categories/:id', (req, res) => categoryController.getCategoryById(req, res));
app.post('/categories', (req, res) => {
  // Mock req.user karena kita tidak memakai Middleware asli dari express di test file ini
  (req as any).user = { id: "admin-id", role: "admin" };
  categoryController.createCategory(req, res);
});

describe('CategoryController Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /categories', () => {
    it('harus mengembalikan 200 dengan list categories', async () => {
      const mockData = [
        { id: 1, name: "Fiksi", description: "Buku fiksi" }
      ];
      
      const spy = vi.spyOn(CategoryService.prototype, 'getAllCategories')
        .mockResolvedValueOnce({ success: true, count: 1, data: mockData } as any);

      const response = await request(app).get('/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('GET /categories/:id', () => {
    it('harus return 400 jika ID bukan format angka', async () => {
      const response = await request(app).get('/categories/salah');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid Category ID');
    });
  });

  describe('POST /categories', () => {
    it('harus error 400 jika Zod gagal divalidasi (nama kategori kosong)', async () => {
      const response = await request(app).post('/categories').send({
        name: "", // Kosong, harus dicegah Zod
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation Error');
      expect(response.body.data.fieldErrors).toHaveProperty('name');
    });

    it('harus sukses 201 membuat kategori baru', async () => {
      const spy = vi.spyOn(CategoryService.prototype, 'createCategory')
        .mockResolvedValueOnce({
          success: true,
          message: "Kategori berhasil ditambahkan.",
          data: { id: 2, name: "Novel", description: "Kategori Novel" }
        } as any);

      const response = await request(app).post('/categories').send({
        name: "Novel",
        description: "Kategori Novel"
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Novel", description: "Kategori Novel" }),
        "admin-id",  // IP dari mock route req.user
        expect.any(String)  // IP dari supertest request (bisa kosong atau ::ffff:127.0.0.1)
      );
    });
  });
});
