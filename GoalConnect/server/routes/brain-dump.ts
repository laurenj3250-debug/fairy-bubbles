/**
 * Brain Dump Routes — Airtable proxy for the Captures table.
 *
 * Keeps the Airtable PAT server-side (was previously hardcoded in a
 * standalone HTML). Reads captures, toggles Done.
 */

import type { Express, Request, Response } from "express";
import https from "node:https";
import { URL } from "node:url";
import { requireUser } from "../simple-auth";

const TABLE_NAME = "Captures";

function getAirtableConfig() {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) {
    throw new Error("AIRTABLE_PAT and AIRTABLE_BASE_ID must be set in .env");
  }
  return { pat, baseId };
}

/**
 * Use node:https directly instead of global `fetch` because the server
 * sets NODE_TLS_REJECT_UNAUTHORIZED=0 for Supabase, which poisons the
 * undici connection pool and causes Airtable calls to hang.
 */
function airtableFetch(path: string, options: { method?: string; body?: string } = {}): Promise<any> {
  const { pat, baseId } = getAirtableConfig();
  const url = `https://api.airtable.com/v0/${baseId}${path}`;

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: options.method || "GET",
        headers: {
          Authorization: `Bearer ${pat}`,
          "Content-Type": "application/json",
        },
        rejectUnauthorized: true,
      },
      (res: any) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Airtable ${res.statusCode}: ${data.substring(0, 200)}`));
          } else {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error(`Airtable: invalid JSON`));
            }
          }
        });
      }
    );

    req.on("error", (err: Error) => reject(err));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Airtable request timeout (15s)"));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: {
    Item?: string;
    Project?: { id: string; name: string };
    Type?: { id: string; name: string };
    Done?: boolean;
  };
}

export function registerBrainDumpRoutes(app: Express) {
  /**
   * GET /api/brain-dump/captures
   * Returns all captures from Airtable, sorted by created time desc.
   * Optional query: ?project=Life&done=false
   */
  app.get("/api/brain-dump/captures", async (req: Request, res: Response) => {
    try {
      requireUser(req);
      let allRecords: AirtableRecord[] = [];
      let offset: string | undefined;

      do {
        const params = new URLSearchParams({
          "sort[0][field]": "Item",
          "sort[0][direction]": "asc",
        });
        if (offset) params.set("offset", offset);

        const data = await airtableFetch(`/${TABLE_NAME}?${params.toString()}`);
        allRecords = allRecords.concat(data.records || []);
        offset = data.offset;
      } while (offset);

      // Transform to a cleaner shape
      const captures = allRecords.map((r: AirtableRecord) => ({
        id: r.id,
        item: r.fields.Item || "",
        // Airtable REST API returns singleSelect as plain string, not {id,name}
        project: (typeof r.fields.Project === "string" ? r.fields.Project : r.fields.Project?.name) || null,
        type: (typeof r.fields.Type === "string" ? r.fields.Type : r.fields.Type?.name) || null,
        done: !!r.fields.Done,
        createdTime: r.createdTime,
      }));

      res.json({ captures, total: captures.length });
    } catch (error: any) {
      console.error("[brain-dump] Error fetching captures:", error.message);
      res.status(500).json({ error: "Failed to fetch captures" });
    }
  });

  /**
   * PATCH /api/brain-dump/captures/:id
   * Toggle or set Done status on an Airtable record.
   * Body: { done: boolean }
   */
  app.patch("/api/brain-dump/captures/:id", async (req: Request, res: Response) => {
    try {
      requireUser(req);
      const recordId = req.params.id;
      const { done } = req.body;

      if (typeof done !== "boolean") {
        return res.status(400).json({ error: "done must be a boolean" });
      }

      const data = await airtableFetch(`/${TABLE_NAME}`, {
        method: "PATCH",
        body: JSON.stringify({
          records: [{ id: recordId, fields: { Done: done } }],
        }),
      });

      res.json({ record: data.records?.[0] || null });
    } catch (error: any) {
      console.error("[brain-dump] Error updating capture:", error.message);
      res.status(500).json({ error: "Failed to update capture" });
    }
  });
}
