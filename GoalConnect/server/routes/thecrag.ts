/**
 * theCrag Import Routes
 *
 * Handles CSV import from theCrag.com logbook exports.
 */

import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import { outdoorClimbingTicks } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { parseTheCragCSV, type TheCragImportResult } from "../importers/thecrag-parser";
import { log } from "../lib/logger";

const getUserId = (req: Request) => requireUser(req).id;

export function registerTheCragRoutes(app: Express) {
  /**
   * POST /api/import/thecrag/csv
   * Import climbing ticks from a theCrag CSV export
   *
   * Body:
   *   - csvContent: The raw CSV content as a string
   *   - skipDuplicates: boolean (default: true) - Skip entries with same route+date
   */
  app.post("/api/import/thecrag/csv", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { csvContent, skipDuplicates = true } = req.body;

      if (!csvContent || typeof csvContent !== "string") {
        return res.status(400).json({
          error: "csvContent is required and must be a string",
        });
      }

      log.info(`[theCrag] Starting CSV import for user ${userId}`);

      // Parse the CSV
      const { ticks, errors: parseErrors } = parseTheCragCSV(csvContent, userId);

      if (ticks.length === 0 && parseErrors.length > 0) {
        return res.status(400).json({
          error: "Failed to parse CSV",
          details: parseErrors,
        });
      }

      const db = getDb();
      const result: TheCragImportResult = {
        imported: 0,
        duplicatesSkipped: 0,
        errors: [...parseErrors],
      };

      // Get existing ticks for duplicate detection
      const existingTicks = await db
        .select({ routeName: outdoorClimbingTicks.routeName, date: outdoorClimbingTicks.date })
        .from(outdoorClimbingTicks)
        .where(eq(outdoorClimbingTicks.userId, userId));

      const existingSet = new Set(
        existingTicks.map((t) => `${t.routeName.toLowerCase()}|${t.date}`)
      );

      // Insert ticks
      for (const tick of ticks) {
        const key = `${tick.routeName.toLowerCase()}|${tick.date}`;

        if (skipDuplicates && existingSet.has(key)) {
          result.duplicatesSkipped++;
          continue;
        }

        try {
          await db.insert(outdoorClimbingTicks).values({
            ...tick,
            userId,
          });
          result.imported++;
          existingSet.add(key); // Prevent duplicates within same import
        } catch (err: any) {
          result.errors.push(`Failed to insert "${tick.routeName}": ${err.message}`);
        }
      }

      log.info(
        `[theCrag] Import complete for user ${userId}: ${result.imported} imported, ${result.duplicatesSkipped} skipped`
      );

      res.json({
        success: true,
        ...result,
        totalParsed: ticks.length,
      });
    } catch (error: any) {
      log.error("[theCrag] Import error:", error);
      res.status(500).json({
        error: "Failed to import CSV",
        details: error.message,
      });
    }
  });

  /**
   * GET /api/import/thecrag/template
   * Get a sample CSV template showing the expected format
   */
  app.get("/api/import/thecrag/template", (_req: Request, res: Response) => {
    const template = `route,grade,date,crag,sector,country,style,type,stars,comments
"Midnight Lightning",V8,2024-06-15,"Yosemite","Camp 4",USA,Flash,boulder,5,"Classic highball!"
"The Nose",5.14a,2024-07-20,"Yosemite","El Capitan",USA,Redpoint,trad,5,"Free ascent"
"Silence",5.15d,2024-08-01,"Flatanger","Hanshelleren",Norway,Onsight,sport,5,"First 9c"`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=thecrag-template.csv");
    res.send(template);
  });

  /**
   * GET /api/import/thecrag/info
   * Get information about theCrag import capabilities
   */
  app.get("/api/import/thecrag/info", (_req: Request, res: Response) => {
    res.json({
      name: "theCrag Import",
      description: "Import climbing logbook from theCrag.com CSV export",
      instructions: [
        "1. Go to theCrag.com and log in",
        "2. Navigate to your logbook",
        "3. Click 'Action' → 'Export logbook as CSV'",
        "4. Save the CSV file",
        "5. Upload it here",
      ],
      supportedColumns: [
        "route / name (required)",
        "grade (required)",
        "date (required)",
        "crag / location",
        "sector / area",
        "country",
        "style / ascent style",
        "type / route type",
        "flags",
        "stars / quality / rating",
        "comment / comments / notes",
        "pitches / pitch",
      ],
      supportedStyles: [
        "onsight",
        "flash",
        "redpoint",
        "pinkpoint",
        "send",
        "attempt",
        "toprope",
      ],
      supportedTypes: ["sport", "trad", "boulder", "alpine", "ice"],
    });
  });
}
