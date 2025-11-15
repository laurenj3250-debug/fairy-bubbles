# GoalConnect - Quick Reference

Fast reference for common development tasks.

## 🚀 Quick Commands

### Development
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Run production build
npm run check            # TypeScript check
```

### Testing
```bash
npm test                 # Run all tests
npm run test:ui          # Playwright UI mode
npm run test:headed      # Run tests with visible browser
npm run test:debug       # Debug mode
npm run test:report      # View test report
```

### Authentication & Browsing
```bash
npm run browse           # Interactive browser (desktop)
npm run browse:mobile    # Interactive browser (mobile)
npm run browse:tablet    # Interactive browser (tablet)
npm run screenshot       # Capture all pages
```

### Database
```bash
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:verify        # Verify database
```

## 🔐 Authentication

### Email/Password (Built-in)
- Test User: `playwright-test@test.com`
- Password: `testpass123`

### GitHub OAuth (Optional)
1. Create OAuth app: https://github.com/settings/developers
2. Add to `.env`:
   ```bash
   GITHUB_CLIENT_ID=your_id
   GITHUB_CLIENT_SECRET=your_secret
   GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
   ```
3. Restart server

See `docs/GITHUB_OAUTH_SETUP.md` for detailed instructions.

## 🎭 Playwright Commands

### Browse with Authentication
```bash
# Default (desktop, codegen mode)
./scripts/browse-authenticated.sh

# Different viewports
./scripts/browse-authenticated.sh codegen mobile
./scripts/browse-authenticated.sh codegen tablet
./scripts/browse-authenticated.sh codegen 1920,1080

# Different modes
./scripts/browse-authenticated.sh ui
./scripts/browse-authenticated.sh debug
./scripts/browse-authenticated.sh headed
```

### Screenshots
```bash
# Take screenshots of all pages
npm run screenshot

# View screenshots
open screenshots/
```

### Manual Auth Setup
```bash
# Reset and re-authenticate
rm -rf playwright/.auth/user.json
npx playwright test tests/auth.setup.ts
```

## 📁 Project Structure

```
GoalConnect/
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/       # Route pages
│   │   ├── components/  # React components
│   │   └── contexts/    # React contexts (auth, etc.)
│   └── index.html
├── server/              # Backend (Express)
│   ├── index.ts         # Server entry
│   ├── simple-auth.ts   # Email/password auth
│   ├── github-auth.ts   # GitHub OAuth
│   ├── routes.ts        # API routes
│   └── db.ts            # Database connection
├── tests/               # Playwright E2E tests
│   ├── auth.setup.ts    # Auth setup for tests
│   ├── habits.spec.ts
│   └── goals.spec.ts
├── scripts/             # Utility scripts
│   ├── screenshot-all-pages.ts
│   └── browse-authenticated.sh
└── docs/                # Documentation
    ├── QUICK_REFERENCE.md (this file)
    ├── PLAYWRIGHT_AUTH_GUIDE.md
    └── GITHUB_OAUTH_SETUP.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/session` - Check session
- `GET /api/auth/github` - GitHub OAuth (redirects)
- `GET /api/auth/github/callback` - GitHub callback

### Habits
- `GET /api/habits` - List all habits
- `POST /api/habits` - Create habit
- `GET /api/habits/:id` - Get habit
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit
- `POST /api/habits/:id/complete` - Mark complete

### Goals
- `GET /api/goals` - List all goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:id` - Get goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

## 🔧 Configuration Files

### `.env` - Environment Variables
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=random-secret
GITHUB_CLIENT_ID=optional
GITHUB_CLIENT_SECRET=optional
GITHUB_CALLBACK_URL=optional
```

### `playwright.config.ts` - Test Configuration
- Base URL: `http://localhost:5000`
- Auth storage: `playwright/.auth/user.json`
- Browsers: Chrome, Firefox, Safari

### `package.json` - Scripts & Dependencies
All npm scripts are defined here.

## 🐛 Debugging

### Check Auth Status
```bash
# View saved session
cat playwright/.auth/user.json

# Test session endpoint
curl http://localhost:5000/api/auth/session
```

### View Logs
```bash
# Server logs are in console
npm run dev

# Playwright logs
npm run test:debug
```

### Database Issues
```bash
# Verify database connection
npm run db:verify

# Re-run migrations
npm run db:migrate
```

## 📸 Taking Screenshots

### For GitHub/Documentation
```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, take screenshots
npm run screenshot

# 3. Screenshots saved to screenshots/
open screenshots/
```

### For Mockups/Design
```bash
# Interactive browser to navigate and inspect
npm run browse

# Mobile preview
npm run browse:mobile

# Take manual screenshot in codegen:
# - Navigate to page
# - Right-click > Take screenshot
# - Or use Playwright inspector
```

## 🚢 Deployment

### Railway (Current)
1. Connect GitHub repo
2. Railway auto-detects npm project
3. Add environment variables in dashboard
4. Railway runs `npm run build` and `npm start`

### Environment Variables for Production
Required:
- `DATABASE_URL` (Railway provides automatically)
- `SESSION_SECRET` (generate with `openssl rand -base64 32`)

Optional (for GitHub OAuth):
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (update to production URL)

## 📚 Documentation

- **QUICK_REFERENCE.md** (this file) - Fast command reference
- **PLAYWRIGHT_AUTH_GUIDE.md** - Complete Playwright auth guide
- **GITHUB_OAUTH_SETUP.md** - GitHub OAuth setup instructions

## 💡 Tips

### Development Workflow
1. `npm run dev` - Start server
2. `npm run browse` - Interactive testing
3. `npm test` - Run automated tests
4. `npm run screenshot` - Document changes

### Writing New Tests
1. Use codegen to generate test code:
   ```bash
   npm run browse
   ```
2. Copy generated code to new spec file
3. Run test:
   ```bash
   npx playwright test tests/your-test.spec.ts
   ```

### Testing GitHub OAuth
1. Set up OAuth app (see `docs/GITHUB_OAUTH_SETUP.md`)
2. Add credentials to `.env`
3. Restart server
4. Test in browser:
   ```bash
   npm run browse
   # Navigate to /login
   # Click "Sign in with GitHub"
   ```

## 🆘 Getting Help

- Check `docs/` folder for detailed guides
- View test examples in `tests/` folder
- Playwright docs: https://playwright.dev
- Express docs: https://expressjs.com
