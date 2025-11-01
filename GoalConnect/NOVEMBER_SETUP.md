# November 2025 Goals & Habits Setup

## Summary

Your November goals and weekly habits have been successfully configured in the Fairy Bubbles (GoalConnect) app! Once you copy the Neon credentials into a local `.env` file (see `DATABASE_SETUP.md`) or run the new `./scripts/bootstrap-neon.sh` helper, the app will use the hosted database so your progress persists across restarts and devices.

If you just want to explore locally first, you can skip Neon entirely—run `npm run dev`, sign in with **demo / demo1234**, and everything will work using the built-in in-memory store (data resets on restart). Prefer to bypass the login screen altogether while experimenting? Set `AUTH_DISABLED=true` in `.env` and restart the dev server.

## What Was Set Up

### Monthly Goals (15 total)

#### Learning (5 goals)
1. **Pimsleur: Complete 16 Lessons** - Finish Level 1 (27-30) + reach Level 2 Lesson 12
2. **Duolingo: Finish Current Unit** - Complete approximately ¼ progress per week
3. **RemNote: Complete Chapters 6 & 7** - Finish Chapters 6 and 7 (de Lahunta)
4. **Convert 10 Papers to Flashcards** - Transform 10 academic papers into flashcards
5. **Watch 2 MRI Education Videos** - Complete MRI education videos for Weeks 2 and 3

#### Creative (2 goals)
6. **Complete 1 Audiobook** - Finish one full audiobook this month
7. **Play Piano 12 Times** - Practice piano at least 12 times (~3x per week)

#### Fitness (3 goals)
8. **Complete 16 Gym Sessions** - Go to gym 16 times (~4x per week)
9. **4 Outdoor Climbing Sessions** - 4 outdoor climbing sessions including 1 overnight trip
10. **Complete 4 Runs** - Run once per week (4 total for the month)

#### Outdoors (1 goal)
11. **8+ Daylight Exposures** - ≥10 min outside on 3 days each week (minimum 8 total)

#### Projects & Personal (4 goals)
12. **Ship 1 App Feature** - Deploy one concrete feature by Nov 30
13. **Play Video Game Once** - Enjoy one video game session this month
14. **Hang Out with Coworker** - Spend social time with a coworker
15. **Try 1 New Thing** - Experience something new and novel

All goals have a deadline of **November 30, 2025** and start at **0 progress**.

---

### Weekly Habits (10 total)

1. **Pimsleur (4 lessons/week)** - Complete 4 Pimsleur lessons (~1 full lesson + short sessions)
2. **Duolingo (5 sessions/week)** - Complete 5 Duolingo sessions of at least 10 minutes each
3. **Gym (4 sessions/week)** - Mon/Tue + pre-shift Wed-Fri workouts
4. **Piano (3 sessions/week)** - 20-30 minute practice sessions
5. **Daylight (3 times/week)** - ≥10 min outside, minimum 2 if busy week
6. **RemNote Study (1 chapter/week)** - Wk 1 = Ch 6 • Wk 2 = Ch 7 + 2-3 papers per week
7. **Create Flashcards (2-3 papers/week)** - Convert 2-3 papers to flashcards weekly (finish 10 by Nov 30)
8. **MRI Video (Wks 2 & 3 only)** - Watch 1 MRI education video (Nov 10-23)
9. **Outdoor Climbing (1 session/week)** - One outdoor climbing session (Week 2 overnight optional)
10. **Run (1 time/week)** - One run per week on flexible day

---

## User Profile

- **User ID**: 1
- **Virtual Pet**: "Forest Friend" (Gremlin)
  - Level: 1 (just starting!)
  - Health: 90
  - Happiness: 85
  - Experience: 0
- **Points Available**: 250 points to spend on costumes
- **Dark Mode**: Enabled
- **Notifications**: Enabled
- **Login**: Defaults to `demo / demo1234` unless you override `APP_USERNAME` / `APP_PASSWORD`

---

## How to Run the App

```bash
cd /home/user/fairy-bubbles/GoalConnect
# optional: ./scripts/bootstrap-neon.sh   # runs the env/migration/seed flow for you
npm run dev
```

The app will start in development mode. Sign in with the credentials from your `.env` (defaults are demo / demo1234) and your November goals and habits will be ready to go!

---

## Technical Details

### Changes Made

1. **Automatic storage selection** (`GoalConnect/server/storage.ts`)
   - Uses Neon (`DbStorage`) when `DATABASE_URL` is set
   - Falls back to the seeded in-memory store for quick demos without any setup

2. **Customized seed data** (`GoalConnect/server/storage.ts:105-178`)
   - Replaced demo habits with your 10 weekly habits
   - Replaced demo goals with your 15 monthly goals
   - Kept all other features (virtual pet, costumes, points system)

3. **Added simple username/password auth** (`GoalConnect/server/auth.ts`)
   - Express session + Passport local strategy protect all `/api` routes (unless you set `AUTH_DISABLED=true` for local dev)
   - Credentials come from `APP_USERNAME` / `APP_PASSWORD` with safe defaults

### Data Persistence Note

✅ **With the Neon credentials in `.env`, your data now lives in the hosted database.** Run through the four setup steps in `DATABASE_SETUP.md` to apply migrations and seed everything once.

Want a temporary offline demo? Just leave `DATABASE_URL` empty. The app will automatically use the seeded in-memory store (progress resets whenever the server restarts).

---

## Features Available

The app includes gamification features to keep you motivated:

- **Virtual Pet System** - Your pet "Forest Friend" grows as you complete goals
- **Points & Rewards** - Earn points for completing habits and goals
- **Costume Shop** - Spend points on fun costumes for your pet
- **Progress Tracking** - Visual progress bars for all your goals
- **Habit Logging** - Mark weekly habits as complete
- **Goal Updates** - Incrementally update progress on your monthly goals

---

## Next Steps

1. Start the app: `npm run dev`
2. Explore your goals and habits in the dashboard
3. Begin tracking your progress!
4. Earn points and unlock costumes for your pet

Good luck with your November goals! 🎯
