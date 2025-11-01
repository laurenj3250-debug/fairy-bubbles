# Database Setup Instructions

Your Neon database is configured but needs to be set up from your **local machine** or **deployment environment** (this coding environment doesn't have network access to external databases).

## Quick Setup (Pick Your Style)

### Prefer to Skip Neon?

If you just want to explore GoalConnect locally without provisioning the hosted database yet:

1. Run `npm install` and then `npm run dev` inside `GoalConnect/`.
2. Sign in with the default credentials **demo / demo1234**.
3. Update `APP_USERNAME`, `APP_PASSWORD`, and `SESSION_SECRET` in `.env` whenever you want to change them.

This mode uses the in-memory storage so data resets on server restart. Follow the Neon steps below when you're ready for long-term persistence.

### Option A — One Command (Recommended)

From the `GoalConnect` directory run:

```bash
./scripts/bootstrap-neon.sh
```

The script will:

1. Create `.env` from `.env.example` if it doesn't exist yet
2. Install npm dependencies
3. Push the latest Drizzle migrations to Neon
4. Seed all November data (user, goals, habits, pet, costumes, starting points)

It prints each step so you can watch the progress and flags anything that needs your attention (for example, reviewing the `.env`).

### Option B — Manual 4-Step Flow

If you prefer to run the commands yourself, follow the steps below.

#### Step 1: Create Your `.env`

Copy the provided Neon credentials into a new `.env` file so the server and Drizzle migrations can connect to your database:

```bash
cd GoalConnect
cp .env.example .env
# (Optional) open .env and verify the values match the ones below
```

#### Step 2: Install Dependencies

Run this from the `GoalConnect` directory (Step 1 already moved you there):

```bash
npm install
```

#### Step 3: Run Database Migrations

This creates all the tables (users, goals, habits, virtual_pets, costumes, etc.):

```bash
npm run db:push
```

You should see:
```
✓ Pulling schema from database...
✓ Changes applied
```

#### Step 4: Seed Your November Data

This populates your database with:
- Your user account (Lauren)
- 15 monthly goals
- 10 weekly habits
- Virtual pet (Forest Friend)
- 10 costumes in the shop
- 250 starting points

```bash
npm exec tsx server/setup-november-goals.ts
```

You should see:
```
🎯 Setting up complete database with November goals and habits...
👤 Creating user...
✅ Created user: Lauren (lauren@fairybubbles.com)
📋 Inserting monthly goals...
✅ Created 15 monthly goals
🔄 Inserting weekly habits...
✅ Created 10 weekly habits
🐾 Creating virtual pet...
✅ Created virtual pet: Forest Friend
⚙️ Creating user settings...
✅ Created user settings
💰 Initializing points...
✅ Starting with 250 points
👔 Creating costume shop...
✅ Created 10 costumes
🎉 Database setup complete!
```

### Start the App!

```bash
npm run dev
```

Your data will now **persist** across:
- ✅ Server restarts
- ✅ Multiple devices
- ✅ Different browsers

---

## What's Already Configured

✅ `.env.example` filled with your Neon connection strings
✅ Database storage automatically enabled in `server/storage.ts` when `DATABASE_URL` is set
✅ Simple username/password auth via `APP_USERNAME` and `APP_PASSWORD`
✅ Complete seed script with all your November goals and habits

---

## Your Database Connection

Your `.env` should contain the following values:

```env
DATABASE_URL="postgresql://neondb_owner:npg_JGAL7QpaKHc6@ep-odd-math-adxm5eam-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_JGAL7QpaKHc6@ep-odd-math-adxm5eam.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

Optional additions for local auth:

```env
APP_USERNAME="your-username"
APP_PASSWORD="choose-a-strong-password"
SESSION_SECRET="unique-random-string"
```

Reference details:

- **Pooled host (app + migrations):** `ep-odd-math-adxm5eam-pooler.c-2.us-east-1.aws.neon.tech`
- **Direct host (optional tools):** `ep-odd-math-adxm5eam.c-2.us-east-1.aws.neon.tech`
- **Database:** `neondb`
- **User:** `neondb_owner`
- **Password:** `npg_JGAL7QpaKHc6`
- **Region:** `us-east-1` (AWS)

The `.env` file you created is gitignored, so your credentials stay local to your machine.

---

## Troubleshooting

### "Cannot connect to database"
- Make sure you're running this on your local machine or deployment environment
- Check that your network allows outbound connections
- Verify the DATABASE_URL in `.env` is correct

### "Table already exists"
- You've already run migrations! Skip Step 3
- If you need to reset, use Neon's dashboard to drop/recreate tables

### "User already exists" (when running seed script)
- Your database is already seeded!
- To re-seed: Drop all data from Neon dashboard and re-run Steps 3-4
- Or just keep your existing data

---

## What Gets Seeded

### User Account
- Name: Lauren
- Email: lauren@fairybubbles.com
- User ID: 1

### Monthly Goals (15)
1. Pimsleur: Complete 16 Lessons
2. Duolingo: Finish Current Unit
3. RemNote: Complete Chapters 6 & 7
4. Convert 10 Papers to Flashcards
5. Watch 2 MRI Education Videos
6. Complete 1 Audiobook
7. Play Piano 12 Times
8. Complete 16 Gym Sessions
9. 4 Outdoor Climbing Sessions
10. Complete 4 Runs
11. 8+ Daylight Exposures
12. Ship 1 App Feature
13. Play Video Game Once
14. Hang Out with Coworker
15. Try 1 New Thing

All goals have deadline: **November 30, 2025**

### Weekly Habits (10)
1. Pimsleur (4 lessons/week)
2. Duolingo (5 sessions/week)
3. Gym (4 sessions/week)
4. Piano (3 sessions/week)
5. Daylight (3 times/week)
6. RemNote Study (1 chapter/week)
7. Create Flashcards (2-3 papers/week)
8. MRI Video (Wks 2 & 3 only)
9. Outdoor Climbing (1 session/week)
10. Run (1 time/week)

### Virtual Pet
- Name: Forest Friend
- Species: Gremlin
- Level: 1
- Evolution: Seed
- Experience: 0

### Starting Points
- 250 points to spend on costumes

### Costume Shop (10 items)
- Party Hat (50 pts, common)
- Crown (200 pts, rare)
- Wizard Hat (150 pts, rare)
- Superhero Cape (100 pts, common)
- Ninja Outfit (250 pts, epic)
- Sunglasses (75 pts, common)
- Gold Medal (300 pts, epic)
- Space Background (400 pts, legendary)
- Forest Background (150 pts, rare)
- Rainbow Background (100 pts, common)

---

## Files Modified

- ✅ `.env.example` - Copy to `.env` for your DATABASE_URL values
- ✅ `server/storage.ts` - Switched to DbStorage
- ✅ `server/setup-november-goals.ts` - Complete seed script

---

## Next Steps After Setup

1. ✅ Clone/pull this branch to your local machine
2. ✅ Run the 4 setup steps above
3. ✅ Start the app with `npm run dev`
4. 🎉 Your data now persists forever!
5. 📱 Access from any device (same data everywhere)

---

## Need Help?

If you run into issues:
1. Check that you're on your local machine (not the coding environment)
2. Make sure Node.js is installed (`node --version`)
3. Verify .env file exists and has the DATABASE_URL
4. Try running migrations again: `npm run db:push`

Your Neon database is ready to go - just run the setup steps from your local machine! 🚀
