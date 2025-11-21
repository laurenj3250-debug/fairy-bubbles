/**
 * Recurrence API Routes
 */

import type { Express, Request, Response } from 'express';
import {
  setTaskRecurrence,
  removeTaskRecurrence,
  skipNextOccurrence,
  getRecurringTaskInstances
} from '../lib/recurrenceScheduler';
import { validateRecurrencePattern, type RecurrencePattern } from '../../shared/lib/recurrenceEngine';

export function registerRecurrenceRoutes(app: Express) {
  /**
   * POST /api/todos/:id/recurrence
   * Set recurrence pattern for a task
   */
  app.post('/api/todos/:id/recurrence', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const { pattern, startDate } = req.body as {
      pattern: RecurrencePattern;
      startDate?: string;
    };

    if (!pattern) {
      return res.status(400).json({ error: 'Recurrence pattern is required' });
    }

    // Validate pattern
    const validation = validateRecurrencePattern(pattern);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid recurrence pattern',
        details: validation.errors
      });
    }

    await setTaskRecurrence(taskId, pattern, startDate);

    res.json({ success: true, message: 'Recurrence set successfully' });
  } catch (error) {
    console.error('Error setting recurrence:', error);
    res.status(500).json({ error: 'Failed to set recurrence' });
  }
});

  /**
   * DELETE /api/todos/:id/recurrence
   * Remove recurrence from a task
   */
  app.delete('/api/todos/:id/recurrence', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    await removeTaskRecurrence(taskId);

    res.json({ success: true, message: 'Recurrence removed successfully' });
  } catch (error) {
    console.error('Error removing recurrence:', error);
    res.status(500).json({ error: 'Failed to remove recurrence' });
  }
});

  /**
   * POST /api/todos/:id/skip-next
   * Skip the next occurrence of a recurring task
   */
  app.post('/api/todos/:id/skip-next', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    await skipNextOccurrence(taskId);

    res.json({ success: true, message: 'Next occurrence skipped' });
  } catch (error) {
    console.error('Error skipping occurrence:', error);
    res.status(500).json({ error: 'Failed to skip occurrence' });
  }
});

  /**
   * GET /api/todos/:id/instances
   * Get all instances of a recurring task
   */
  app.get('/api/todos/:id/instances', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const instances = await getRecurringTaskInstances(taskId);

    res.json(instances);
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
});
}
