import { Response } from "express";
import * as purchaseService from "../services/purchaseService";
import { formatSuccess, formatError } from "../utils/responseFormatter";
import logger from "../utils/logger";
import { AuthRequest } from "../middlewares/authMiddleware";

export const createPurchase = async (req: AuthRequest, res: Response) => {
  try {
    const outletId = req.user?.outlet_id;
    const userId = req.user?.id;
    if (!outletId)
      return res.status(400).json(formatError("Outlet ID is required"));

    const {
      vendor_id,
      date,
      payment_method,
      payment_account_id,
      notes,
      items,
    } = req.body;

    if (!vendor_id || !date || !payment_method || !items) {
      return res
        .status(400)
        .json(
          formatError(
            "vendor_id, date, payment_method, and items are required",
          ),
        );
    }

    const purchase = await purchaseService.createPurchase(outletId, {
      vendor_id,
      date,
      payment_method,
      payment_account_id,
      notes,
      created_by: userId,
      items,
    });

    return res.status(201).json(formatSuccess(purchase));
  } catch (error: any) {
    logger.error("purchaseController.createPurchase error:", error);
    return res.status(400).json(formatError(error.message));
  }
};

export const getPurchases = async (req: AuthRequest, res: Response) => {
  try {
    const outletId = req.user?.outlet_id;
    if (!outletId)
      return res.status(400).json(formatError("Outlet ID is required"));

    const status = req.query.status as string;
    const search = req.query.search as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    const unfinishedOnly = req.query.unfinished_only === "true";

    const purchases = await purchaseService.getPurchases(outletId, {
      status,
      search,
      startDate,
      endDate,
      unfinishedOnly,
    });

    return res.json(formatSuccess(purchases));
  } catch (error: any) {
    logger.error("purchaseController.getPurchases error:", error);
    return res.status(500).json(formatError(error.message));
  }
};

export const getPurchaseById = async (req: AuthRequest, res: Response) => {
  try {
    const outletId = req.user?.outlet_id;
    if (!outletId)
      return res.status(400).json(formatError("Outlet ID is required"));

    const purchase = await purchaseService.getPurchaseById(
      outletId,
      req.params.id as string,
    );
    if (!purchase)
      return res.status(404).json(formatError("Purchase Order not found"));

    return res.json(formatSuccess(purchase));
  } catch (error: any) {
    logger.error("purchaseController.getPurchaseById error:", error);
    return res.status(500).json(formatError(error.message));
  }
};

export const receiveGoods = async (req: AuthRequest, res: Response) => {
  try {
    const outletId = req.user?.outlet_id;
    if (!outletId)
      return res.status(400).json(formatError("Outlet ID is required"));

    const { items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json(
          formatError(
            "items array with product_id and quantity_received is required",
          ),
        );
    }

    const result = await purchaseService.receiveGoods(
      outletId,
      req.params.id as string,
      items,
      notes,
    );
    return res.json(formatSuccess(result));
  } catch (error: any) {
    logger.error("purchaseController.receiveGoods error:", error);
    return res.status(400).json(formatError(error.message));
  }
};

export const deletePurchase = async (req: AuthRequest, res: Response) => {
  try {
    const outletId = req.user?.outlet_id;
    if (!outletId)
      return res.status(400).json(formatError("Outlet ID is required"));

    await purchaseService.deletePurchase(outletId, req.params.id as string);
    return res.json(
      formatSuccess({ message: "Purchase Order deleted successfully" }),
    );
  } catch (error: any) {
    logger.error("purchaseController.deletePurchase error:", error);
    return res.status(400).json(formatError(error.message));
  }
};
