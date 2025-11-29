/**
 * Climbing Grade Utilities
 * Parse and compare climbing grades across different systems
 */

/**
 * Parse a YDS route grade (e.g., "5.10a", "5.12d") to a numeric value for sorting
 * Higher number = harder grade
 */
export function parseYdsGrade(grade: string): number {
  const match = grade.match(/5\.(\d+)([a-d])?/i);
  if (!match) return 0;
  const base = parseInt(match[1], 10);
  const letter = match[2]?.toLowerCase();
  const letterValue = letter ? "abcd".indexOf(letter) : 0;
  return base * 10 + letterValue;
}

/**
 * Parse a V-scale boulder grade (e.g., "V5", "V10") to a numeric value
 */
export function parseVGrade(grade: string): number {
  const match = grade.match(/v(\d+)/i);
  if (!match) return -1;
  return parseInt(match[1], 10);
}

/**
 * Check if a grade is a YDS route grade
 */
export function isYdsGrade(grade: string): boolean {
  return /^5\.\d+[a-d]?$/i.test(grade);
}

/**
 * Check if a grade is a V-scale boulder grade
 */
export function isVGrade(grade: string): boolean {
  return /^v\d+$/i.test(grade);
}

/**
 * Find the highest route grade from a list of grades
 */
export function findHighestRouteGrade(grades: string[]): string | undefined {
  const routeGrades = grades.filter(isYdsGrade);
  if (routeGrades.length === 0) return undefined;
  return routeGrades.sort((a, b) => parseYdsGrade(b) - parseYdsGrade(a))[0];
}

/**
 * Find the highest boulder grade from a list of grades
 */
export function findHighestBoulderGrade(grades: string[]): string | undefined {
  const boulderGrades = grades.filter(isVGrade);
  if (boulderGrades.length === 0) return undefined;
  return boulderGrades.sort((a, b) => parseVGrade(b) - parseVGrade(a))[0];
}

/**
 * Sort grades in ascending difficulty order
 */
export function sortGradesAscending(grades: string[]): string[] {
  return [...grades].sort((a, b) => {
    // Route grades first, then boulder
    if (isYdsGrade(a) && isYdsGrade(b)) {
      return parseYdsGrade(a) - parseYdsGrade(b);
    }
    if (isVGrade(a) && isVGrade(b)) {
      return parseVGrade(a) - parseVGrade(b);
    }
    // Route grades before boulder grades
    if (isYdsGrade(a)) return -1;
    if (isYdsGrade(b)) return 1;
    return 0;
  });
}
