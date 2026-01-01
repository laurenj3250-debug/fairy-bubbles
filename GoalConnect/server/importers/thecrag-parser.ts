/**
 * theCrag CSV Parser
 *
 * Parses CSV exports from theCrag.com logbook and converts to outdoor climbing ticks.
 *
 * theCrag CSV format typically includes:
 * - route: Route name
 * - grade: Grade in various formats (5.12a, V8, 7a, etc.)
 * - date: Date of ascent
 * - crag: Crag/area name
 * - sector: Sub-area
 * - country: Country
 * - style: Ascent style (Onsight, Flash, Redpoint, etc.)
 * - flags: Additional flags (may contain route type)
 * - stars: Quality rating
 * - comment/comments: Notes
 */

import type { InsertOutdoorClimbingTick } from "@shared/schema";

interface TheCragRow {
  route?: string;
  name?: string; // Alternative column name
  grade?: string;
  date?: string;
  crag?: string;
  sector?: string;
  area?: string;
  country?: string;
  style?: string;
  "ascent style"?: string;
  flags?: string;
  type?: string;
  stars?: string;
  quality?: string;
  comment?: string;
  comments?: string;
  notes?: string;
  pitches?: string;
}

// Map theCrag style values to our ascent style enum
const STYLE_MAP: Record<string, string> = {
  // Standard styles
  "onsight": "onsight",
  "on-sight": "onsight",
  "flash": "flash",
  "redpoint": "redpoint",
  "red point": "redpoint",
  "pinkpoint": "pinkpoint",
  "pink point": "pinkpoint",
  "send": "send",
  "sent": "send",
  "clean": "send",
  "attempt": "attempt",
  "working": "attempt",
  "hang": "attempt",
  "fell": "attempt",
  "toprope": "toprope",
  "top rope": "toprope",
  "tr": "toprope",
  "seconded": "toprope",
  // Default
  "tick": "send",
  "ascent": "send",
};

// Map theCrag type/flags to our route type enum
const TYPE_MAP: Record<string, string> = {
  "sport": "sport",
  "trad": "trad",
  "traditional": "trad",
  "boulder": "boulder",
  "bouldering": "boulder",
  "alpine": "alpine",
  "ice": "ice",
  "mixed": "ice",
  "aid": "trad", // Map aid to trad as closest
};

/**
 * Detect route type from grade format or flags
 */
function detectRouteType(grade: string, flags?: string, type?: string): string {
  // Check explicit type first
  if (type) {
    const normalized = type.toLowerCase().trim();
    if (TYPE_MAP[normalized]) return TYPE_MAP[normalized];
  }

  // Check flags
  if (flags) {
    const normalizedFlags = flags.toLowerCase();
    for (const [key, value] of Object.entries(TYPE_MAP)) {
      if (normalizedFlags.includes(key)) return value;
    }
  }

  // Detect from grade format
  const normalizedGrade = grade.toLowerCase().trim();

  // V-grades are bouldering
  if (/^v\d/.test(normalizedGrade)) return "boulder";

  // Fontainebleau grades (6a, 7b+, etc.) - check if short (likely boulder)
  if (/^[4-8][abc][+]?$/.test(normalizedGrade)) return "boulder";

  // WI/M grades are ice
  if (/^(wi|m)\d/.test(normalizedGrade)) return "ice";

  // YDS grades (5.x) default to sport
  if (/^5\.\d/.test(normalizedGrade)) return "sport";

  // Default to sport
  return "sport";
}

/**
 * Normalize ascent style
 */
function normalizeStyle(style?: string): string {
  if (!style) return "send";

  const normalized = style.toLowerCase().trim();

  // Direct match
  if (STYLE_MAP[normalized]) return STYLE_MAP[normalized];

  // Partial match
  for (const [key, value] of Object.entries(STYLE_MAP)) {
    if (normalized.includes(key)) return value;
  }

  return "send";
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr?: string): string | null {
  if (!dateStr) return null;

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try common formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  // Try DD/MM/YYYY or MM/DD/YYYY
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    // Assume YYYY-MM-DD if first part is 4 digits
    if (a > 1000) {
      return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`;
    }
    // Assume DD/MM/YYYY if day > 12
    if (a > 12) {
      return `${c}-${String(b).padStart(2, "0")}-${String(a).padStart(2, "0")}`;
    }
    // Default to MM/DD/YYYY
    return `${c}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
  }

  return null;
}

/**
 * Parse stars/quality rating
 */
function parseStars(stars?: string): number | null {
  if (!stars) return null;

  // Handle numeric
  const num = parseInt(stars, 10);
  if (!isNaN(num) && num >= 1 && num <= 5) return num;

  // Handle star symbols
  const starCount = (stars.match(/★|⭐|\*/g) || []).length;
  if (starCount > 0) return Math.min(starCount, 5);

  return null;
}

/**
 * Parse CSV content and return climbing ticks
 */
export function parseTheCragCSV(
  csvContent: string,
  userId: number
): { ticks: Omit<InsertOutdoorClimbingTick, "userId">[]; errors: string[] } {
  const errors: string[] = [];
  const ticks: Omit<InsertOutdoorClimbingTick, "userId">[] = [];

  // Split into lines and get headers
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    errors.push("CSV file must have at least a header row and one data row");
    return { ticks, errors };
  }

  // Parse header row (handle quoted values)
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

  // Find column indices
  const routeIdx = headers.findIndex((h) => h === "route" || h === "name" || h === "route name");
  const gradeIdx = headers.findIndex((h) => h === "grade");
  const dateIdx = headers.findIndex((h) => h === "date");
  const cragIdx = headers.findIndex((h) => h === "crag" || h === "location");
  const sectorIdx = headers.findIndex((h) => h === "sector" || h === "area");
  const countryIdx = headers.findIndex((h) => h === "country");
  const styleIdx = headers.findIndex((h) => h === "style" || h === "ascent style");
  const typeIdx = headers.findIndex((h) => h === "type" || h === "route type");
  const flagsIdx = headers.findIndex((h) => h === "flags");
  const starsIdx = headers.findIndex((h) => h === "stars" || h === "quality" || h === "rating");
  const notesIdx = headers.findIndex((h) => h === "comment" || h === "comments" || h === "notes");
  const pitchesIdx = headers.findIndex((h) => h === "pitches" || h === "pitch");

  if (routeIdx === -1) {
    errors.push("CSV must have a 'route' or 'name' column");
    return { ticks, errors };
  }

  if (gradeIdx === -1) {
    errors.push("CSV must have a 'grade' column");
    return { ticks, errors };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);

      const routeName = values[routeIdx]?.trim();
      const grade = values[gradeIdx]?.trim();

      if (!routeName || !grade) {
        errors.push(`Row ${i + 1}: Missing route name or grade`);
        continue;
      }

      const date = parseDate(dateIdx >= 0 ? values[dateIdx] : undefined);
      if (!date) {
        errors.push(`Row ${i + 1}: Invalid or missing date for "${routeName}"`);
        continue;
      }

      const crag = cragIdx >= 0 ? values[cragIdx]?.trim() : undefined;
      const sector = sectorIdx >= 0 ? values[sectorIdx]?.trim() : undefined;
      const country = countryIdx >= 0 ? values[countryIdx]?.trim() : undefined;
      const style = styleIdx >= 0 ? values[styleIdx]?.trim() : undefined;
      const type = typeIdx >= 0 ? values[typeIdx]?.trim() : undefined;
      const flags = flagsIdx >= 0 ? values[flagsIdx]?.trim() : undefined;
      const stars = starsIdx >= 0 ? values[starsIdx]?.trim() : undefined;
      const notes = notesIdx >= 0 ? values[notesIdx]?.trim() : undefined;
      const pitchesStr = pitchesIdx >= 0 ? values[pitchesIdx]?.trim() : undefined;

      // Build location string
      const locationParts = [crag, country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(", ") : undefined;

      // Parse pitches
      const pitches = pitchesStr ? parseInt(pitchesStr, 10) || 1 : 1;

      ticks.push({
        routeName,
        grade,
        routeType: detectRouteType(grade, flags, type) as any,
        ascentStyle: normalizeStyle(style) as any,
        date,
        location: location || null,
        area: sector || null,
        pitches,
        stars: parseStars(stars),
        notes: notes || null,
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: Parse error - ${err}`);
    }
  }

  return { ticks, errors };
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else if (char === '"') {
        // End of quoted value
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted value
        inQuotes = true;
      } else if (char === ",") {
        // End of field
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }

  // Don't forget the last value
  values.push(current);

  return values;
}

/**
 * Summary of import results
 */
export interface TheCragImportResult {
  imported: number;
  duplicatesSkipped: number;
  errors: string[];
}
