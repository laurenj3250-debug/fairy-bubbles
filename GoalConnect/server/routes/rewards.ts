import type { Express } from "express";
import { storage } from "../storage";
import { requireUser } from "../simple-auth";
import { insertCustomRewardSchema } from "@shared/schema";
import { log } from "../lib/logger";

const getUserId = (req: any) => requireUser(req).id;

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function registerRewardRoutes(app: Express) {
  // GET /api/rewards — list all rewards for user
  app.get("/api/rewards", async (req, res) => {
    try {
      const userId = getUserId(req);
      const rewards = await storage.getRewards(userId);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  // POST /api/rewards — create a new reward
  app.post("/api/rewards", async (req, res) => {
    try {
      const userId = getUserId(req);
      const validated = insertCustomRewardSchema.parse({ ...req.body, userId });
      const reward = await storage.createReward(validated);
      res.status(201).json(reward);
    } catch (error: any) {
      log.error('[rewards] Create failed:', error);
      res.status(400).json({ error: error.message || "Invalid reward data" });
    }
  });

  // PATCH /api/rewards/:id — update reward details
  app.patch("/api/rewards/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid ID" });

      const existing = await storage.getReward(id);

      // Uniform 404 prevents reward ID enumeration
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Reward not found" });
      }
      if (existing.redeemed) {
        return res.status(400).json({ error: "Cannot edit a redeemed reward" });
      }

      // Whitelist allowed fields
      const { title, description, cost, imageUrl } = req.body;
      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      if (cost !== undefined) {
        if (typeof cost !== 'number' || cost < 10) {
          return res.status(400).json({ error: "Minimum reward cost is 10 XP" });
        }
        updates.cost = cost;
      }

      const reward = await storage.updateReward(id, updates);
      res.json(reward);
    } catch (error: any) {
      log.error('[rewards] Update failed:', error);
      res.status(400).json({ error: error.message || "Failed to update reward" });
    }
  });

  // DELETE /api/rewards/:id — delete unredeemed reward
  app.delete("/api/rewards/:id", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid ID" });

      const existing = await storage.getReward(id);

      // Uniform 404
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: "Reward not found" });
      }
      if (existing.redeemed) {
        return res.status(400).json({ error: "Cannot delete a redeemed reward" });
      }

      await storage.deleteReward(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reward" });
    }
  });

  // POST /api/rewards/:id/redeem — redeem a reward
  app.post("/api/rewards/:id/redeem", async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid ID" });

      const reward = await storage.getReward(id);

      // Uniform 404
      if (!reward || reward.userId !== userId) {
        return res.status(404).json({ error: "Reward not found" });
      }
      if (reward.redeemed) {
        return res.status(400).json({ error: "Reward already redeemed" });
      }

      // Atomic spend — returns false if insufficient balance (race-safe)
      const success = await storage.spendPoints(
        userId, reward.cost, "reward_redeem", `Redeemed: ${reward.title}`
      );
      if (!success) {
        return res.status(400).json({ error: `Insufficient XP (need ${reward.cost})` });
      }

      // Mark as redeemed
      const updated = await storage.updateReward(id, {
        redeemed: true,
        redeemedAt: new Date(),
      });

      const updatedPoints = await storage.getUserPoints(userId);

      log.info(`[rewards] User ${userId} redeemed "${reward.title}" for ${reward.cost} XP`);

      res.json({
        reward: updated,
        pointsRemaining: updatedPoints.available,
      });
    } catch (error: any) {
      log.error('[rewards] Redeem failed:', error);
      res.status(500).json({ error: error.message || "Failed to redeem reward" });
    }
  });
}
