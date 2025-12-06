import type { Express } from "express";
import { getDb } from "../db.js";
import {
  studyBooks,
  studyChapters,
  studyPapers,
  studyMriLectures,
  studyScheduleLogs,
  studyScheduleConfig,
} from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireUser } from "../simple-auth";
import { log } from "../lib/logger";

export function registerStudyPlannerRoutes(app: Express) {
  // ========== STUDY BOOKS ==========

  // GET /api/study/books - Get all books with chapters
  app.get("/api/study/books", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const books = await db
        .select()
        .from(studyBooks)
        .where(eq(studyBooks.userId, user.id))
        .orderBy(studyBooks.position, studyBooks.createdAt);

      // Get chapters for each book
      const booksWithChapters = await Promise.all(
        books.map(async (book) => {
          const chapters = await db
            .select()
            .from(studyChapters)
            .where(eq(studyChapters.bookId, book.id))
            .orderBy(studyChapters.position, studyChapters.createdAt);
          return { ...book, chapters };
        })
      );

      res.json(booksWithChapters);
    } catch (error) {
      log.error("[study-planner] Error fetching books:", error);
      res.status(500).send("Failed to fetch books");
    }
  });

  // POST /api/study/books - Create new book
  app.post("/api/study/books", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const { title, abbreviation } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).send("Book title is required");
      }

      const [newBook] = await db
        .insert(studyBooks)
        .values({
          userId: user.id,
          title: title.trim(),
          abbreviation: abbreviation?.trim() || null,
        })
        .returning();

      res.json({ ...newBook, chapters: [] });
    } catch (error) {
      log.error("[study-planner] Error creating book:", error);
      res.status(500).send("Failed to create book");
    }
  });

  // PATCH /api/study/books/:id - Update book
  app.patch("/api/study/books/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const bookId = parseInt(req.params.id);
      const { title, abbreviation } = req.body;

      const [updatedBook] = await db
        .update(studyBooks)
        .set({
          ...(title && { title: title.trim() }),
          ...(abbreviation !== undefined && { abbreviation: abbreviation?.trim() || null }),
        })
        .where(and(eq(studyBooks.id, bookId), eq(studyBooks.userId, user.id)))
        .returning();

      if (!updatedBook) {
        return res.status(404).send("Book not found");
      }

      res.json(updatedBook);
    } catch (error) {
      log.error("[study-planner] Error updating book:", error);
      res.status(500).send("Failed to update book");
    }
  });

  // DELETE /api/study/books/:id - Delete book and its chapters
  app.delete("/api/study/books/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const bookId = parseInt(req.params.id);

      const [deletedBook] = await db
        .delete(studyBooks)
        .where(and(eq(studyBooks.id, bookId), eq(studyBooks.userId, user.id)))
        .returning();

      if (!deletedBook) {
        return res.status(404).send("Book not found");
      }

      res.json({ success: true });
    } catch (error) {
      log.error("[study-planner] Error deleting book:", error);
      res.status(500).send("Failed to delete book");
    }
  });

  // ========== STUDY CHAPTERS ==========

  // POST /api/study/books/:bookId/chapters - Add chapter to book
  app.post("/api/study/books/:bookId/chapters", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const bookId = parseInt(req.params.bookId);
      const { title } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).send("Chapter title is required");
      }

      // Verify book belongs to user
      const [book] = await db
        .select()
        .from(studyBooks)
        .where(and(eq(studyBooks.id, bookId), eq(studyBooks.userId, user.id)));

      if (!book) {
        return res.status(404).send("Book not found");
      }

      const [newChapter] = await db
        .insert(studyChapters)
        .values({
          userId: user.id,
          bookId,
          title: title.trim(),
        })
        .returning();

      res.json(newChapter);
    } catch (error) {
      log.error("[study-planner] Error creating chapter:", error);
      res.status(500).send("Failed to create chapter");
    }
  });

  // PATCH /api/study/chapters/:id - Update chapter
  app.patch("/api/study/chapters/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const chapterId = parseInt(req.params.id);
      const { title } = req.body;

      const [updatedChapter] = await db
        .update(studyChapters)
        .set({
          ...(title && { title: title.trim() }),
        })
        .where(and(eq(studyChapters.id, chapterId), eq(studyChapters.userId, user.id)))
        .returning();

      if (!updatedChapter) {
        return res.status(404).send("Chapter not found");
      }

      res.json(updatedChapter);
    } catch (error) {
      log.error("[study-planner] Error updating chapter:", error);
      res.status(500).send("Failed to update chapter");
    }
  });

  // PATCH /api/study/chapters/:id/images - Toggle images complete
  app.patch("/api/study/chapters/:id/images", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const chapterId = parseInt(req.params.id);

      // Get current state
      const [chapter] = await db
        .select()
        .from(studyChapters)
        .where(and(eq(studyChapters.id, chapterId), eq(studyChapters.userId, user.id)));

      if (!chapter) {
        return res.status(404).send("Chapter not found");
      }

      const newValue = !chapter.imagesCompleted;

      const [updatedChapter] = await db
        .update(studyChapters)
        .set({
          imagesCompleted: newValue,
          imagesCompletedAt: newValue ? new Date() : null,
        })
        .where(eq(studyChapters.id, chapterId))
        .returning();

      res.json(updatedChapter);
    } catch (error) {
      log.error("[study-planner] Error toggling images:", error);
      res.status(500).send("Failed to toggle images");
    }
  });

  // PATCH /api/study/chapters/:id/cards - Toggle cards complete
  app.patch("/api/study/chapters/:id/cards", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const chapterId = parseInt(req.params.id);

      // Get current state
      const [chapter] = await db
        .select()
        .from(studyChapters)
        .where(and(eq(studyChapters.id, chapterId), eq(studyChapters.userId, user.id)));

      if (!chapter) {
        return res.status(404).send("Chapter not found");
      }

      const newValue = !chapter.cardsCompleted;

      const [updatedChapter] = await db
        .update(studyChapters)
        .set({
          cardsCompleted: newValue,
          cardsCompletedAt: newValue ? new Date() : null,
        })
        .where(eq(studyChapters.id, chapterId))
        .returning();

      res.json(updatedChapter);
    } catch (error) {
      log.error("[study-planner] Error toggling cards:", error);
      res.status(500).send("Failed to toggle cards");
    }
  });

  // DELETE /api/study/chapters/:id - Delete chapter
  app.delete("/api/study/chapters/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const chapterId = parseInt(req.params.id);

      const [deletedChapter] = await db
        .delete(studyChapters)
        .where(and(eq(studyChapters.id, chapterId), eq(studyChapters.userId, user.id)))
        .returning();

      if (!deletedChapter) {
        return res.status(404).send("Chapter not found");
      }

      res.json({ success: true });
    } catch (error) {
      log.error("[study-planner] Error deleting chapter:", error);
      res.status(500).send("Failed to delete chapter");
    }
  });

  // ========== STUDY PAPERS ==========

  // GET /api/study/papers - Get all papers
  app.get("/api/study/papers", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const papers = await db
        .select()
        .from(studyPapers)
        .where(eq(studyPapers.userId, user.id))
        .orderBy(studyPapers.completed, studyPapers.position, studyPapers.createdAt);

      res.json(papers);
    } catch (error) {
      log.error("[study-planner] Error fetching papers:", error);
      res.status(500).send("Failed to fetch papers");
    }
  });

  // POST /api/study/papers - Create new paper
  app.post("/api/study/papers", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const { title, url } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).send("Paper title is required");
      }

      const [newPaper] = await db
        .insert(studyPapers)
        .values({
          userId: user.id,
          title: title.trim(),
          url: url?.trim() || null,
        })
        .returning();

      res.json(newPaper);
    } catch (error) {
      log.error("[study-planner] Error creating paper:", error);
      res.status(500).send("Failed to create paper");
    }
  });

  // PATCH /api/study/papers/:id - Update paper
  app.patch("/api/study/papers/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const paperId = parseInt(req.params.id);
      const { title, url } = req.body;

      const [updatedPaper] = await db
        .update(studyPapers)
        .set({
          ...(title && { title: title.trim() }),
          ...(url !== undefined && { url: url?.trim() || null }),
        })
        .where(and(eq(studyPapers.id, paperId), eq(studyPapers.userId, user.id)))
        .returning();

      if (!updatedPaper) {
        return res.status(404).send("Paper not found");
      }

      res.json(updatedPaper);
    } catch (error) {
      log.error("[study-planner] Error updating paper:", error);
      res.status(500).send("Failed to update paper");
    }
  });

  // PATCH /api/study/papers/:id/toggle - Toggle paper completed
  app.patch("/api/study/papers/:id/toggle", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const paperId = parseInt(req.params.id);

      // Get current state
      const [paper] = await db
        .select()
        .from(studyPapers)
        .where(and(eq(studyPapers.id, paperId), eq(studyPapers.userId, user.id)));

      if (!paper) {
        return res.status(404).send("Paper not found");
      }

      const newValue = !paper.completed;

      const [updatedPaper] = await db
        .update(studyPapers)
        .set({
          completed: newValue,
          completedAt: newValue ? new Date() : null,
        })
        .where(eq(studyPapers.id, paperId))
        .returning();

      res.json(updatedPaper);
    } catch (error) {
      log.error("[study-planner] Error toggling paper:", error);
      res.status(500).send("Failed to toggle paper");
    }
  });

  // DELETE /api/study/papers/:id - Delete paper
  app.delete("/api/study/papers/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const paperId = parseInt(req.params.id);

      const [deletedPaper] = await db
        .delete(studyPapers)
        .where(and(eq(studyPapers.id, paperId), eq(studyPapers.userId, user.id)))
        .returning();

      if (!deletedPaper) {
        return res.status(404).send("Paper not found");
      }

      res.json({ success: true });
    } catch (error) {
      log.error("[study-planner] Error deleting paper:", error);
      res.status(500).send("Failed to delete paper");
    }
  });

  // ========== MRI LECTURES ==========

  // GET /api/study/mri-lectures - Get all MRI lectures
  app.get("/api/study/mri-lectures", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const lectures = await db
        .select()
        .from(studyMriLectures)
        .where(eq(studyMriLectures.userId, user.id))
        .orderBy(studyMriLectures.completed, studyMriLectures.position, studyMriLectures.createdAt);

      res.json(lectures);
    } catch (error) {
      log.error("[study-planner] Error fetching MRI lectures:", error);
      res.status(500).send("Failed to fetch MRI lectures");
    }
  });

  // POST /api/study/mri-lectures - Create new MRI lecture
  app.post("/api/study/mri-lectures", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const { title, url } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).send("Lecture title is required");
      }

      const [newLecture] = await db
        .insert(studyMriLectures)
        .values({
          userId: user.id,
          title: title.trim(),
          url: url?.trim() || null,
        })
        .returning();

      res.json(newLecture);
    } catch (error) {
      log.error("[study-planner] Error creating MRI lecture:", error);
      res.status(500).send("Failed to create MRI lecture");
    }
  });

  // PATCH /api/study/mri-lectures/:id - Update MRI lecture
  app.patch("/api/study/mri-lectures/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const lectureId = parseInt(req.params.id);
      const { title, url } = req.body;

      const [updatedLecture] = await db
        .update(studyMriLectures)
        .set({
          ...(title && { title: title.trim() }),
          ...(url !== undefined && { url: url?.trim() || null }),
        })
        .where(and(eq(studyMriLectures.id, lectureId), eq(studyMriLectures.userId, user.id)))
        .returning();

      if (!updatedLecture) {
        return res.status(404).send("MRI lecture not found");
      }

      res.json(updatedLecture);
    } catch (error) {
      log.error("[study-planner] Error updating MRI lecture:", error);
      res.status(500).send("Failed to update MRI lecture");
    }
  });

  // PATCH /api/study/mri-lectures/:id/toggle - Toggle MRI lecture completed
  app.patch("/api/study/mri-lectures/:id/toggle", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const lectureId = parseInt(req.params.id);

      // Get current state
      const [lecture] = await db
        .select()
        .from(studyMriLectures)
        .where(and(eq(studyMriLectures.id, lectureId), eq(studyMriLectures.userId, user.id)));

      if (!lecture) {
        return res.status(404).send("MRI lecture not found");
      }

      const newValue = !lecture.completed;

      const [updatedLecture] = await db
        .update(studyMriLectures)
        .set({
          completed: newValue,
          completedAt: newValue ? new Date() : null,
        })
        .where(eq(studyMriLectures.id, lectureId))
        .returning();

      res.json(updatedLecture);
    } catch (error) {
      log.error("[study-planner] Error toggling MRI lecture:", error);
      res.status(500).send("Failed to toggle MRI lecture");
    }
  });

  // DELETE /api/study/mri-lectures/:id - Delete MRI lecture
  app.delete("/api/study/mri-lectures/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const lectureId = parseInt(req.params.id);

      const [deletedLecture] = await db
        .delete(studyMriLectures)
        .where(and(eq(studyMriLectures.id, lectureId), eq(studyMriLectures.userId, user.id)))
        .returning();

      if (!deletedLecture) {
        return res.status(404).send("MRI lecture not found");
      }

      res.json({ success: true });
    } catch (error) {
      log.error("[study-planner] Error deleting MRI lecture:", error);
      res.status(500).send("Failed to delete MRI lecture");
    }
  });

  // ========== WEEKLY SCHEDULE ==========

  // GET /api/study/schedule/week - Get week's logs
  app.get("/api/study/schedule/week", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      // Get date from query or use current date
      const dateParam = req.query.date as string;
      const targetDate = dateParam ? new Date(dateParam) : new Date();

      // Find the Sunday of the week containing targetDate
      const dayOfWeek = targetDate.getDay();
      const sunday = new Date(targetDate);
      sunday.setDate(targetDate.getDate() - dayOfWeek);

      // Find Saturday
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      // Format dates as YYYY-MM-DD
      const startDate = sunday.toISOString().split("T")[0];
      const endDate = saturday.toISOString().split("T")[0];

      const logs = await db
        .select()
        .from(studyScheduleLogs)
        .where(
          and(
            eq(studyScheduleLogs.userId, user.id),
            gte(studyScheduleLogs.date, startDate),
            lte(studyScheduleLogs.date, endDate)
          )
        )
        .orderBy(studyScheduleLogs.date);

      res.json({
        weekStart: startDate,
        weekEnd: endDate,
        logs,
      });
    } catch (error) {
      log.error("[study-planner] Error fetching weekly schedule:", error);
      res.status(500).send("Failed to fetch weekly schedule");
    }
  });

  // POST /api/study/schedule/log - Create or toggle a schedule log
  app.post("/api/study/schedule/log", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const { date, taskType, completed, linkedItemId, linkedItemType, notes } = req.body;

      if (!date || !taskType) {
        return res.status(400).send("Date and task type are required");
      }

      // Check if log exists for this date/task
      const [existingLog] = await db
        .select()
        .from(studyScheduleLogs)
        .where(
          and(
            eq(studyScheduleLogs.userId, user.id),
            eq(studyScheduleLogs.date, date),
            eq(studyScheduleLogs.taskType, taskType)
          )
        );

      if (existingLog) {
        // Update existing log
        const newCompleted = completed !== undefined ? completed : !existingLog.completed;
        const [updatedLog] = await db
          .update(studyScheduleLogs)
          .set({
            completed: newCompleted,
            ...(linkedItemId !== undefined && { linkedItemId }),
            ...(linkedItemType !== undefined && { linkedItemType }),
            ...(notes !== undefined && { notes }),
          })
          .where(eq(studyScheduleLogs.id, existingLog.id))
          .returning();

        res.json(updatedLog);
      } else {
        // Create new log
        const [newLog] = await db
          .insert(studyScheduleLogs)
          .values({
            userId: user.id,
            date,
            taskType,
            completed: completed ?? true,
            linkedItemId: linkedItemId || null,
            linkedItemType: linkedItemType || null,
            notes: notes || null,
          })
          .returning();

        res.json(newLog);
      }
    } catch (error) {
      log.error("[study-planner] Error logging schedule:", error);
      res.status(500).send("Failed to log schedule");
    }
  });

  // DELETE /api/study/schedule/log/:id - Delete a schedule log
  app.delete("/api/study/schedule/log/:id", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const logId = parseInt(req.params.id);

      const [deletedLog] = await db
        .delete(studyScheduleLogs)
        .where(and(eq(studyScheduleLogs.id, logId), eq(studyScheduleLogs.userId, user.id)))
        .returning();

      if (!deletedLog) {
        return res.status(404).send("Schedule log not found");
      }

      res.json({ success: true });
    } catch (error) {
      log.error("[study-planner] Error deleting schedule log:", error);
      res.status(500).send("Failed to delete schedule log");
    }
  });

  // POST /api/study/schedule/reset-week - Reset all logs for a given week
  app.post("/api/study/schedule/reset-week", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const { weekStart, weekEnd } = req.body;

      if (!weekStart || !weekEnd) {
        return res.status(400).send("Week start and end dates are required");
      }

      // Delete all logs for this user within the date range
      const deleted = await db
        .delete(studyScheduleLogs)
        .where(
          and(
            eq(studyScheduleLogs.userId, user.id),
            gte(studyScheduleLogs.date, weekStart),
            lte(studyScheduleLogs.date, weekEnd)
          )
        )
        .returning();

      res.json({ success: true, deletedCount: deleted.length });
    } catch (error) {
      log.error("[study-planner] Error resetting week:", error);
      res.status(500).send("Failed to reset week");
    }
  });

  // GET /api/study/stats - Get study progress statistics
  app.get("/api/study/stats", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      // Get all chapters
      const chapters = await db
        .select()
        .from(studyChapters)
        .where(eq(studyChapters.userId, user.id));

      // Get all papers
      const papers = await db
        .select()
        .from(studyPapers)
        .where(eq(studyPapers.userId, user.id));

      // Get all MRI lectures
      const lectures = await db
        .select()
        .from(studyMriLectures)
        .where(eq(studyMriLectures.userId, user.id));

      // Get all RemNote review logs (for streak calculation)
      const remnoteReviews = await db
        .select()
        .from(studyScheduleLogs)
        .where(
          and(
            eq(studyScheduleLogs.userId, user.id),
            eq(studyScheduleLogs.taskType, "remnote_review"),
            eq(studyScheduleLogs.completed, true)
          )
        )
        .orderBy(desc(studyScheduleLogs.date));

      // Calculate RemNote streaks
      const reviewDates = new Set(remnoteReviews.map(r => r.date));
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(today);
      // Start from today, but if today isn't done yet, start from yesterday
      if (!reviewDates.has(todayStr)) {
        checkDate = new Date(yesterday);
      }
      while (reviewDates.has(checkDate.toISOString().split("T")[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = Array.from(reviewDates).sort();
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      // Find last missed date (for "never miss twice" feature)
      let lastMissedDate: string | null = null;
      if (!reviewDates.has(yesterdayStr) && reviewDates.size > 0) {
        lastMissedDate = yesterdayStr;
      }

      // Get all schedule logs for weekly trends (last 4 weeks)
      const fourWeeksAgo = new Date(today);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const allLogs = await db
        .select()
        .from(studyScheduleLogs)
        .where(
          and(
            eq(studyScheduleLogs.userId, user.id),
            eq(studyScheduleLogs.completed, true),
            gte(studyScheduleLogs.date, fourWeeksAgo.toISOString().split("T")[0])
          )
        );

      // Calculate weekly trends
      const weeklyTrends = [];
      for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (weekOffset * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekStartStr = weekStart.toISOString().split("T")[0];
        const weekEndStr = weekEnd.toISOString().split("T")[0];

        const weekLogs = allLogs.filter(
          log => log.date >= weekStartStr && log.date <= weekEndStr
        );

        weeklyTrends.push({
          weekStart: weekStartStr,
          tasksCompleted: weekLogs.length,
          tasksPossible: 7 * 5, // 7 days x 5 task types (rough estimate)
        });
      }

      // Calculate completion by task type
      const completionByType: Record<string, { completed: number; total: number }> = {};
      const taskTypes = ["remnote_review", "email_cases", "chapter", "mri_lecture", "papers"];
      for (const taskType of taskTypes) {
        const taskLogs = allLogs.filter(log => log.taskType === taskType);
        completionByType[taskType] = {
          completed: taskLogs.length,
          total: 28, // 4 weeks
        };
      }

      const chaptersWithBothDone = chapters.filter(c => c.imagesCompleted && c.cardsCompleted);
      const papersCompleted = papers.filter(p => p.completed);
      const lecturesCompleted = lectures.filter(l => l.completed);

      res.json({
        chapters: {
          total: chapters.length,
          imagesCompleted: chapters.filter(c => c.imagesCompleted).length,
          cardsCompleted: chapters.filter(c => c.cardsCompleted).length,
          fullyCompleted: chaptersWithBothDone.length,
        },
        papers: {
          total: papers.length,
          completed: papersCompleted.length,
        },
        mriLectures: {
          total: lectures.length,
          completed: lecturesCompleted.length,
        },
        remnoteReviews: {
          totalDays: remnoteReviews.length,
        },
        // Enhanced stats
        streaks: {
          remnoteCurrentStreak: currentStreak,
          remnoteLongestStreak: longestStreak,
          lastMissedDate,
        },
        weeklyTrends,
        completionByType,
      });
    } catch (error) {
      log.error("[study-planner] Error fetching stats:", error);
      res.status(500).send("Failed to fetch stats");
    }
  });

  // ========== SCHEDULE CONFIG ==========

  // Default weekly schedule tasks (used when no config exists)
  const DEFAULT_SCHEDULE_CONFIG = [
    // Sunday
    { dayOfWeek: 0, tasks: ["remnote_review", "chapter"] },
    // Monday
    { dayOfWeek: 1, tasks: ["remnote_review", "email_cases", "mri_lecture"] },
    // Tuesday
    { dayOfWeek: 2, tasks: ["remnote_review", "papers"] },
    // Wednesday
    { dayOfWeek: 3, tasks: ["remnote_review", "chapter", "mri_lecture"] },
    // Thursday
    { dayOfWeek: 4, tasks: ["remnote_review", "email_cases", "papers"] },
    // Friday
    { dayOfWeek: 5, tasks: ["remnote_review", "chapter"] },
    // Saturday
    { dayOfWeek: 6, tasks: ["remnote_review", "mri_lecture", "papers"] },
  ];

  // GET /api/study/schedule/config - Get user's schedule config
  app.get("/api/study/schedule/config", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const config = await db
        .select()
        .from(studyScheduleConfig)
        .where(eq(studyScheduleConfig.userId, user.id))
        .orderBy(studyScheduleConfig.dayOfWeek, studyScheduleConfig.taskType);

      // If no config exists, return the default
      if (config.length === 0) {
        return res.json({
          hasCustomConfig: false,
          config: DEFAULT_SCHEDULE_CONFIG,
        });
      }

      // Transform to grouped format
      const grouped: Record<number, string[]> = {};
      for (let i = 0; i <= 6; i++) grouped[i] = [];

      config.forEach(item => {
        if (item.isActive) {
          grouped[item.dayOfWeek].push(item.taskType);
        }
      });

      const configArray = Object.entries(grouped).map(([day, tasks]) => ({
        dayOfWeek: parseInt(day),
        tasks,
      }));

      res.json({
        hasCustomConfig: true,
        config: configArray,
      });
    } catch (error) {
      log.error("[study-planner] Error fetching schedule config:", error);
      res.status(500).send("Failed to fetch schedule config");
    }
  });

  // POST /api/study/schedule/config - Save schedule config
  app.post("/api/study/schedule/config", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      const { config } = req.body; // Array of { dayOfWeek, tasks: string[] }

      if (!Array.isArray(config)) {
        return res.status(400).send("Config must be an array");
      }

      // Delete existing config
      await db
        .delete(studyScheduleConfig)
        .where(eq(studyScheduleConfig.userId, user.id));

      // Insert new config
      const newConfigs: { userId: number; taskType: string; dayOfWeek: number; isActive: boolean }[] = [];

      for (const day of config) {
        for (const taskType of day.tasks) {
          newConfigs.push({
            userId: user.id,
            taskType,
            dayOfWeek: day.dayOfWeek,
            isActive: true,
          });
        }
      }

      if (newConfigs.length > 0) {
        await db.insert(studyScheduleConfig).values(newConfigs as any);
      }

      res.json({ success: true });
    } catch (error) {
      log.error("[study-planner] Error saving schedule config:", error);
      res.status(500).send("Failed to save schedule config");
    }
  });

  // POST /api/study/schedule/config/reset - Reset to default config
  app.post("/api/study/schedule/config/reset", async (req, res) => {
    const user = requireUser(req);
    const db = getDb();

    try {
      // Delete all custom config (will fall back to default)
      await db
        .delete(studyScheduleConfig)
        .where(eq(studyScheduleConfig.userId, user.id));

      res.json({ success: true, config: DEFAULT_SCHEDULE_CONFIG });
    } catch (error) {
      log.error("[study-planner] Error resetting schedule config:", error);
      res.status(500).send("Failed to reset schedule config");
    }
  });
}
