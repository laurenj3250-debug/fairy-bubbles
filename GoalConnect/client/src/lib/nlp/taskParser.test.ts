import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseTaskInput } from './taskParser';

describe('taskParser', () => {
  beforeEach(() => {
    // Mock the current date to 2025-01-15 12:00:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00'));
  });

  it('should parse a complete task with all metadata', () => {
    const result = parseTaskInput('Fix auth bug tomorrow 3pm #backend @urgent p1');

    expect(result).toEqual({
      title: 'Fix auth bug',
      dueDate: '2025-01-16',
      dueTime: '15:00',
      projectName: 'backend',
      labelNames: ['urgent'],
      priority: 1,
      notes: null,
    });
  });

  it('should parse task with multiple labels', () => {
    const result = parseTaskInput('Review code @urgent @high-priority @bug');

    expect(result).toEqual({
      title: 'Review code',
      dueDate: null,
      dueTime: null,
      projectName: null,
      labelNames: ['urgent', 'high-priority', 'bug'],
      priority: null,
      notes: null,
    });
  });

  it('should parse priority levels (p1-p4)', () => {
    expect(parseTaskInput('Task p1').priority).toBe(1);
    expect(parseTaskInput('Task p2').priority).toBe(2);
    expect(parseTaskInput('Task p3').priority).toBe(3);
    expect(parseTaskInput('Task p4').priority).toBe(4);
    expect(parseTaskInput('Task P1').priority).toBe(1); // case insensitive
  });

  it('should parse project with # prefix', () => {
    const result = parseTaskInput('Deploy app #production');

    expect(result.projectName).toBe('production');
    expect(result.title).toBe('Deploy app');
  });

  it('should handle dates without times', () => {
    const result = parseTaskInput('Meeting tomorrow #work');

    expect(result.dueDate).toBe('2025-01-16');
    expect(result.dueTime).toBeNull();
  });

  it('should handle times with dates', () => {
    const result = parseTaskInput('Call client Jan 20 at 2pm');

    expect(result.dueDate).toBe('2025-01-20');
    expect(result.dueTime).toBe('14:00');
    expect(result.title).toBe('Call client');
  });

  it('should preserve title when no metadata is found', () => {
    const result = parseTaskInput('Just a simple task');

    expect(result).toEqual({
      title: 'Just a simple task',
      dueDate: null,
      dueTime: null,
      projectName: null,
      labelNames: [],
      priority: null,
      notes: null,
    });
  });

  it('should handle complex natural language dates', () => {
    const result = parseTaskInput('Submit report next Monday 9am');

    expect(result.dueDate).toBe('2025-01-20');
    expect(result.dueTime).toBe('09:00');
    expect(result.title).toBe('Submit report');
  });

  it('should handle task with notes after //', () => {
    const result = parseTaskInput('Fix bug #backend // Remember to test thoroughly');

    expect(result.title).toBe('Fix bug');
    expect(result.projectName).toBe('backend');
    expect(result.notes).toBe('Remember to test thoroughly');
  });

  it('should remove metadata tokens from title', () => {
    const result = parseTaskInput('Review PR p2 @code-review #frontend tomorrow');

    expect(result.title).toBe('Review PR');
    expect(result.priority).toBe(2);
    expect(result.labelNames).toEqual(['code-review']);
    expect(result.projectName).toBe('frontend');
  });

  it('should handle empty input gracefully', () => {
    const result = parseTaskInput('');

    expect(result.title).toBe('');
  });

  it('should handle input with only metadata', () => {
    const result = parseTaskInput('#project @label p1');

    expect(result.title).toBe('');
    expect(result.projectName).toBe('project');
    expect(result.labelNames).toEqual(['label']);
    expect(result.priority).toBe(1);
  });

  it('should handle hyphenated project and label names', () => {
    const result = parseTaskInput('Task #my-project @high-priority');

    expect(result.projectName).toBe('my-project');
    expect(result.labelNames).toEqual(['high-priority']);
  });

  it('should handle underscored names', () => {
    const result = parseTaskInput('Task #my_project @my_label');

    expect(result.projectName).toBe('my_project');
    expect(result.labelNames).toEqual(['my_label']);
  });

  it('should parse "in 3 days" correctly', () => {
    const result = parseTaskInput('Follow up in 3 days');

    expect(result.dueDate).toBe('2025-01-18');
    expect(result.title).toBe('Follow up');
  });

  it('should handle multiple time keywords', () => {
    const result = parseTaskInput('Meeting tomorrow at 3pm @important');

    expect(result.dueDate).toBe('2025-01-16');
    expect(result.dueTime).toBe('15:00');
    expect(result.labelNames).toEqual(['important']);
  });

  it('should handle ISO date format', () => {
    const result = parseTaskInput('Deadline 2025-02-01 #project');

    expect(result.dueDate).toBe('2025-02-01');
    expect(result.projectName).toBe('project');
  });
});
