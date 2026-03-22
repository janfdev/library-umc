import { type Request, type Response } from "express";
import { GuestService } from "../service/guest.service";

const guestService = new GuestService();

export class GuestController {
  /**
   * GET /guests/search - Search users from Campus API
   */
  async searchCampusUsers(req: Request, res: Response) {
    try {
      const { name, faculty, major, email } = req.query;

      const result = await guestService.searchUsersFromCampus({
        name: name as string,
        faculty: faculty as string,
        major: major as string,
        email: email as string,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("[GuestController] Error searching campus users:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * GET /guests/campus - Get ALL users from Campus API
   */
  async getAllCampusUsers(req: Request, res: Response) {
    try {
      const result = await guestService.getAllUsersFromCampus();

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("[GuestController] Error getting all campus users:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * GET /guests/campus/:email - Get User from Campus API
   */
  async getUserFromCampus(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email is required",
          data: null,
        });
        return;
      }

      const result = await guestService.getDataUserFromCampus(email as string);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("[GuestController] Error getting campus user:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * POST /guests - Create Guest Log
   */
  async createGuestLog(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email is required",
          data: null,
        });
        return;
      }

      const result = await guestService.createGuestLog(email);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("[GuestController] Error creating guest log:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * GET /guests - Get All Guest Logs
   */
  async getGuestLogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await guestService.getAllGuestLogs(limit, page);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("[GuestController] Error getting guest logs:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * GET /guests/stats - Get Guest Stats
   */
  async getGuestStats(req: Request, res: Response) {
    try {
      const result = await guestService.getGuestStats();

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("[GuestController] Error getting guest stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }

  /**
   * DELETE /guests/:id - Delete Guest Log
   */
  async deleteGuestLog(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID is required",
          data: null,
        });
        return;
      }

      const result = await guestService.deleteGuestLog(id as string);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("[GuestController] Error deleting guest log:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        data: null,
      });
    }
  }
}
