import type { Express, Request } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { getDb } from "../db";
import { userPoints } from "@shared/schema";
import { eq } from "drizzle-orm";

const getUserId = (req: Request) => requireUser(req).id;

export function registerPointRoutes(app: Express) {
  // Points Routes
  app.get("/api/points", async (req, res) => {
    try {
      const userId = getUserId(req);
      const points = await storage.getUserPoints(userId);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  // Alias for user points
  app.get("/api/user-points", async (req, res) => {
    try {
      const userId = getUserId(req);
      const points = await storage.getUserPoints(userId);
      res.json(points);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  // Set target reward to work toward
  app.patch("/api/points/target-reward", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { rewardId } = req.body; // null to clear target
      const db = getDb();
      await db
        .update(userPoints)
        .set({ targetRewardId: rewardId ?? null })
        .where(eq(userPoints.userId, userId));
      res.json({ targetRewardId: rewardId ?? null });
    } catch (error) {
      res.status(500).json({ error: "Failed to set target reward" });
    }
  });

  app.get("/api/points/transactions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const since = req.query.since as string | undefined;

      const transactions = since
        ? await storage.getPointTransactionsByDateRange(userId, since)
        : await storage.getPointTransactions(userId);

      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
}
