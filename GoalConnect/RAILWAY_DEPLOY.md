# Deploy to Railway - Quick Guide

Railway is the **simplest** way to deploy this app. Everything is built-in!

## ✨ Why Railway?

- ✅ Built-in PostgreSQL database (one click!)
- ✅ Auto-deploy from GitHub
- ✅ No complex environment variable setup
- ✅ Free tier ($5 credit/month)
- ✅ Fast and simple

---

## 🚀 Deploy Steps (5 minutes)

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Sign in with GitHub

### 2. Deploy from GitHub

1. Click **"Deploy from GitHub repo"**
2. Select your `fairy-bubbles` repository
3. Railway will automatically detect it's a Node.js app

### 3. Add PostgreSQL Database

1. In your project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically connects it to your app! 🎉

### 4. Set Environment Variable

1. Click on your web service
2. Go to **"Variables"** tab
3. Add one variable:
   ```
   SESSION_SECRET = <click "Generate" button>
   ```
4. Railway will auto-generate a secure random string

### 5. Deploy!

1. Railway automatically deploys when you push to GitHub
2. Wait ~2-3 minutes for first deploy
3. Click the generated URL to open your app!

---

## 🎯 First Time Setup

### Create Your Account

1. Visit your Railway app URL
2. Click **"Sign up"**
3. Enter:
   - Name: Your Name
   - Email: your@email.com
   - Password: (min 6 characters)
4. Click **"Sign up"**
5. You're in! 🎊

---

## 📊 Database Migration

If you have existing data from Vercel/Supabase:

### Option A: Start Fresh (Easiest)
Just sign up as a new user - Railway creates a clean database automatically!

### Option B: Migrate Existing Data

1. Go to Railway dashboard → PostgreSQL
2. Click **"Connect"** → Copy the connection string
3. Run the migration:
   ```bash
   psql <CONNECTION_STRING> -f migrations/railway_migration.sql
   ```

4. Export data from old database and import to Railway

---

## 🔧 How It Works

**Authentication**: Simple session-based auth with bcrypt
- No Supabase needed!
- No JWT complexity!
- Sessions stored in PostgreSQL
- Passwords hashed with bcrypt

**Database**: PostgreSQL (provided by Railway)
- Automatic backups
- Automatic scaling
- Connection pooling included

**Deployment**: Git push = auto-deploy
```bash
git push origin main
```
Railway automatically redeploys!

---

## 💰 Cost

**Free Tier**: $5 credit/month
- Covers ~20-40 hours of runtime
- Perfect for personal use
- Sleeps after inactivity

**Paid**: $5/month for always-on
- No sleep
- More resources
- Priority support

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Wait 1-2 minutes after adding PostgreSQL
- Check that DATABASE_URL is set (Railway does this automatically)

### "Session secret not set"
- Go to Variables tab
- Add SESSION_SECRET variable
- Redeploy

### "Build failed"
- Check the build logs in Railway dashboard
- Make sure `package.json` has all dependencies

---

## 🎨 Custom Domain (Optional)

1. Go to your web service in Railway
2. Click **"Settings"**
3. Under **"Domains"**, click **"Generate Domain"**
4. Or add your own custom domain!

---

## ✅ You're Done!

Your app is now:
- ✅ Deployed on Railway
- ✅ Connected to PostgreSQL
- ✅ Auto-deploying from GitHub
- ✅ Ready for multi-user use

**No Supabase. No Vercel complexity. Just Railway.** 🚂

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- This repo's issues: Create an issue if something's not working!
