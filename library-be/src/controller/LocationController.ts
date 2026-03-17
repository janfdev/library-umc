import { type Request, type Response } from "express";
import locationService from "../service/location.service";

class LocationController {
  /**
   * GET /locations
   * Semua user terautentikasi bisa akses
   */
  async getAllLocations(req: Request, res: Response) {
    try {
      const result = await locationService.getAllLocations();
      return res.status(200).json(result);
    } catch (error) {
      console.error("[LocationController] Error getting all locations:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get all locations",
        data: null,
      });
    }
  }

  /**
   * GET /locations/:id
   * Semua user terautentikasi bisa akses
   */
  async getLocationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validasi: id harus bilangan bulat positif
      const numericId = parseInt(id as string, 10);
      if (isNaN(numericId) || numericId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID lokasi tidak valid. Harus berupa angka bulat positif.",
          data: null,
        });
      }

      const result = await locationService.getLocationById(numericId);

      // Service mengembalikan success: false jika not found
      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error(
        "[LocationController] Error getting location by ID:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to get location by ID",
        data: null,
      });
    }
  }

  /**
   * POST /locations
   * Hanya Admin / Staff
   */
  async createLocation(req: Request, res: Response) {
    try {
      const { room, rack, shelf } = req.body;

      // Validasi input wajib
      if (!room?.trim() || !rack?.trim() || !shelf?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Room, rack, dan shelf wajib diisi dan tidak boleh kosong.",
          data: null,
        });
      }

      // Panjang maksimal sesuai schema (200 karakter)
      if (room.length > 200 || rack.length > 200 || shelf.length > 200) {
        return res.status(400).json({
          success: false,
          message: "Panjang room, rack, dan shelf tidak boleh melebihi 200 karakter.",
          data: null,
        });
      }

      const result = await locationService.createLocation({
        room: room.trim(),
        rack: rack.trim(),
        shelf: shelf.trim(),
      });

      // Service mengembalikan success: false jika sudah ada (duplicate)
      if (!result.success) {
        return res.status(409).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("[LocationController] Error creating location:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create location",
        data: null,
      });
    }
  }

  /**
   * PUT /locations/:id
   * Hanya Admin / Staff
   */
  async updateLocation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { room, rack, shelf } = req.body;

      // Validasi ID
      const numericId = parseInt(id as string, 10);
      if (isNaN(numericId) || numericId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID lokasi tidak valid. Harus berupa angka bulat positif.",
          data: null,
        });
      }

      // Validasi input wajib
      if (!room?.trim() || !rack?.trim() || !shelf?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Room, rack, dan shelf wajib diisi dan tidak boleh kosong.",
          data: null,
        });
      }

      if (room.length > 200 || rack.length > 200 || shelf.length > 200) {
        return res.status(400).json({
          success: false,
          message: "Panjang room, rack, dan shelf tidak boleh melebihi 200 karakter.",
          data: null,
        });
      }

      const result = await locationService.updateLocation(numericId, {
        room: room.trim(),
        rack: rack.trim(),
        shelf: shelf.trim(),
      });

      // Service mengembalikan success: false jika not found
      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("[LocationController] Error updating location:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update location",
        data: null,
      });
    }
  }

  /**
   * DELETE /locations/:id
   * Hanya Super Admin — soft delete
   */
  async deleteLocation(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validasi ID
      const numericId = parseInt(id as string, 10);
      if (isNaN(numericId) || numericId <= 0) {
        return res.status(400).json({
          success: false,
          message: "ID lokasi tidak valid. Harus berupa angka bulat positif.",
          data: null,
        });
      }

      const result = await locationService.deleteLocation(numericId);

      // Service mengembalikan success: false jika not found
      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error("[LocationController] Error deleting location:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete location",
        data: null,
      });
    }
  }
}

export default new LocationController();
