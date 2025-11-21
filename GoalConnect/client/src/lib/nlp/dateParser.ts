import * as chrono from 'chrono-node';
import { format, addDays, addWeeks, endOfWeek, startOfWeek, addMonths, endOfMonth } from 'date-fns';

export interface ParsedDateTime {
  date: string | null;
  time: string | null;
  raw: string;
}

/**
 * Parse a natural language date string into ISO format (YYYY-MM-DD)
 */
export function parseDate(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalized = input.toLowerCase().trim();
  const now = new Date();

  // Handle common date patterns manually for better control
  if (normalized === 'today') {
    return format(now, 'yyyy-MM-dd');
  }

  if (normalized === 'tomorrow') {
    return format(addDays(now, 1), 'yyyy-MM-dd');
  }

  if (normalized === 'this week') {
    // End of this week (Saturday to match date-fns week ending)
    return format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
  }

  if (normalized === 'next week') {
    // Next week same day (7 days from now)
    return format(addWeeks(now, 1), 'yyyy-MM-dd');
  }

  // Handle "in X days"
  const inDaysMatch = normalized.match(/^in (\d+) days?$/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    return format(addDays(now, days), 'yyyy-MM-dd');
  }

  // Handle "in X weeks"
  const inWeeksMatch = normalized.match(/^in (\d+) weeks?$/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1], 10);
    return format(addWeeks(now, weeks), 'yyyy-MM-dd');
  }

  // Use chrono-node for more complex parsing
  try {
    const parsed = chrono.parseDate(input, now);
    if (parsed) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }

  return null;
}

/**
 * Parse a time string into HH:mm format
 */
export function parseTime(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalized = input.toLowerCase().trim();

  // Remove common prefixes
  const cleaned = normalized.replace(/^(at|by)\s+/, '');

  // Handle 24-hour format (HH:mm or H:mm)
  const time24Match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (time24Match) {
    const hours = parseInt(time24Match[1], 10);
    const minutes = parseInt(time24Match[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  // Handle 12-hour format with am/pm
  const time12Match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (time12Match) {
    let hours = parseInt(time12Match[1], 10);
    const minutes = time12Match[2] ? parseInt(time12Match[2], 10) : 0;
    const meridiem = time12Match[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes >= 60) {
      return null;
    }

    // Convert to 24-hour format
    if (meridiem === 'pm' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Try chrono-node for complex time parsing
  try {
    const parsed = chrono.parseDate(input);
    if (parsed) {
      return format(parsed, 'HH:mm');
    }
  } catch (error) {
    console.error('Error parsing time:', error);
  }

  return null;
}

/**
 * Parse a string containing both date and time
 */
export function parseDateAndTime(input: string): ParsedDateTime | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalized = input.trim();
  let date: string | null = null;
  let time: string | null = null;

  // Try to use chrono-node to parse the entire string
  try {
    const chronoParsed = chrono.parse(normalized);
    if (chronoParsed && chronoParsed.length > 0) {
      const parsed = chronoParsed[0];
      const parsedDate = parsed.start.date();

      date = format(parsedDate, 'yyyy-MM-dd');

      // Check if time components are EXPLICITLY available (not implied)
      // Check if hour was explicitly mentioned in the text
      const hasExplicitTime = /\d{1,2}(?::\d{2})?\s*(?:am|pm)|at\s+\d{1,2}|by\s+\d{1,2}|\d{1,2}:\d{2}/i.test(normalized);

      if (hasExplicitTime && parsed.start.get('hour') !== null) {
        time = format(parsedDate, 'HH:mm');
      }

      // Try to extract additional time info from the text
      if (!time) {
        // Look for time patterns in the remaining text
        const timeMatch = normalized.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})/i);
        if (timeMatch) {
          time = parseTime(timeMatch[0]);
        }
      }

      return {
        date,
        time,
        raw: normalized,
      };
    }
  } catch (error) {
    console.error('Error parsing date and time:', error);
  }

  // Fallback: try to parse date separately
  date = parseDate(normalized);
  if (date) {
    // Look for time in the string
    const timeMatch = normalized.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{1,2}:\d{2})/i);
    if (timeMatch) {
      time = parseTime(timeMatch[0]);
    }

    return {
      date,
      time,
      raw: normalized,
    };
  }

  return null;
}
