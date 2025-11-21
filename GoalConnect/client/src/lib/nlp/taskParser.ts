import { parseDateAndTime } from './dateParser';

export interface ParsedTask {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  projectName: string | null;
  labelNames: string[];
  priority: number | null;
  notes: string | null;
}

/**
 * Parse a natural language task input string into structured task data
 *
 * Supported patterns:
 * - Priority: p1, p2, p3, p4 (case insensitive)
 * - Projects: #project-name
 * - Labels: @label-name (multiple allowed)
 * - Dates: tomorrow, next Monday, Jan 15, in 3 days, etc.
 * - Times: 3pm, 9:30am, 15:00, at 2pm, by 5pm
 * - Notes: // followed by note text
 *
 * @example
 * parseTaskInput("Fix bug tomorrow 3pm #backend @urgent p1")
 * // Returns: {
 * //   title: "Fix bug",
 * //   dueDate: "2025-01-16",
 * //   dueTime: "15:00",
 * //   projectName: "backend",
 * //   labelNames: ["urgent"],
 * //   priority: 1,
 * //   notes: null
 * // }
 */
export function parseTaskInput(input: string): ParsedTask {
  if (!input || typeof input !== 'string') {
    return {
      title: '',
      dueDate: null,
      dueTime: null,
      projectName: null,
      labelNames: [],
      priority: null,
      notes: null,
    };
  }

  let remaining = input.trim();
  const result: ParsedTask = {
    title: '',
    dueDate: null,
    dueTime: null,
    projectName: null,
    labelNames: [],
    priority: null,
    notes: null,
  };

  // Extract notes (everything after //)
  const notesMatch = remaining.match(/\/\/\s*(.+)$/);
  if (notesMatch) {
    result.notes = notesMatch[1].trim();
    remaining = remaining.substring(0, notesMatch.index).trim();
  }

  // Extract priority (p1-p4)
  const priorityMatch = remaining.match(/\bp([1-4])\b/i);
  if (priorityMatch) {
    result.priority = parseInt(priorityMatch[1], 10);
    remaining = remaining.replace(priorityMatch[0], '').trim();
  }

  // Extract project (#project or #project-name or #project_name)
  const projectMatch = remaining.match(/#([\w-]+)/);
  if (projectMatch) {
    result.projectName = projectMatch[1];
    remaining = remaining.replace(projectMatch[0], '').trim();
  }

  // Extract labels (@label-name, multiple allowed)
  const labelMatches = remaining.matchAll(/@([\w-]+)/g);
  result.labelNames = Array.from(labelMatches, m => m[1]);
  remaining = remaining.replace(/@[\w-]+/g, '').trim();

  // Try to extract date and time using dateParser
  // We need to find date/time patterns and parse them
  const dateTimeResult = parseDateAndTime(remaining);
  if (dateTimeResult) {
    result.dueDate = dateTimeResult.date;
    result.dueTime = dateTimeResult.time;

    // Remove the date/time portion from the remaining text to get the title
    // This is tricky because we need to identify what part was the date/time
    // We'll use a heuristic approach: remove common date/time keywords
    const dateTimeKeywords = [
      'tomorrow',
      'today',
      'next week',
      'this week',
      'next monday',
      'next tuesday',
      'next wednesday',
      'next thursday',
      'next friday',
      'next saturday',
      'next sunday',
      'in \\d+ days?',
      'in \\d+ weeks?',
      'jan(?:uary)?\\s+\\d+',
      'feb(?:ruary)?\\s+\\d+',
      'mar(?:ch)?\\s+\\d+',
      'apr(?:il)?\\s+\\d+',
      'may\\s+\\d+',
      'jun(?:e)?\\s+\\d+',
      'jul(?:y)?\\s+\\d+',
      'aug(?:ust)?\\s+\\d+',
      'sep(?:tember)?\\s+\\d+',
      'oct(?:ober)?\\s+\\d+',
      'nov(?:ember)?\\s+\\d+',
      'dec(?:ember)?\\s+\\d+',
      '\\d{4}-\\d{2}-\\d{2}',
      '\\d{1,2}:\\d{2}(?:\\s*(?:am|pm))?',
      '\\d{1,2}\\s*(?:am|pm)',
      'at\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?',
      'by\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?',
    ];

    // Create a regex pattern that matches any of the date/time keywords
    const dateTimePattern = new RegExp(
      `\\b(${dateTimeKeywords.join('|')})\\b`,
      'gi'
    );

    remaining = remaining.replace(dateTimePattern, '').trim();
  }

  // Clean up remaining text (remove extra spaces)
  result.title = remaining.replace(/\s+/g, ' ').trim();

  return result;
}
