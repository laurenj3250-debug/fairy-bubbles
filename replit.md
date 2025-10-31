# GoalConnect - Gremlin Dashboard

## Overview

GoalConnect (Gremlin Dashboard) is a whimsical, gamified Progressive Web App for habit tracking, goal management, and personal productivity. The application features a virtual pet companion that evolves based on user progress, creating an engaging and motivational experience. Built with modern web technologies, it emphasizes a playful, pastel aesthetic with touch-optimized interactions and comprehensive tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**:
- React 18+ with TypeScript as the core framework
- Vite for fast development and optimized production builds
- Wouter for lightweight client-side routing (bottom navigation pattern)

**UI Component System**:
- shadcn/ui component library built on Radix UI primitives
- "new-york" style variant with extensive customization
- Tailwind CSS with custom design tokens for whimsical pastel theming
- Component organization:
  - `client/src/components/ui/` - Base shadcn/ui components
  - `client/src/components/` - Domain-specific components (habits, goals, pet, etc.)
  - Comprehensive set of pre-built UI primitives (dialogs, cards, forms, badges, etc.)

**Design System**:
- Whimsical gamification aesthetic with soft pastels and rounded shapes
- Touch-optimized with minimum 44×44px tap targets
- Custom color palette: Soft Teal (primary), Warm Peach (secondary), Soft Lavender (accent), Soft Sage (muted)
- Custom gradient primitives (sunrise, lagoon, radial highlights)
- Font stack: Comfortaa, Quicksand, Architects Daughter, DM Sans for playful typography
- Dark/light mode support with smooth theme transitions

**State Management**:
- TanStack Query (React Query) v5 for server state and caching
- React Hook Form with Zod validation for type-safe form handling
- Local component state for UI interactions
- No global state management library (leverages React Query's intelligent caching)

**Progressive Web App**:
- PWA manifest configured for standalone mobile experience
- Portrait-primary orientation optimized
- Service worker ready for offline capabilities
- App shortcuts for quick habit logging
- Icons sized at 192x192 and 512x512 for various display contexts

**Routing Structure**:
- `/` - Dashboard (overview with pet, stats, and quick actions)
- `/habits` - Habit management and tracking
- `/goals` - Goal creation and progress tracking
- `/todos` - Task list management
- `/calendar` - Unified calendar view of all activities
- `/pet` - Virtual pet interaction and stats
- `/shop` - Costume shop for pet customization
- `/settings` - User preferences and data export

### Backend Architecture

**Server Framework**:
- Express.js with TypeScript running on Node.js
- ESM module system throughout
- Custom middleware for request logging and JSON parsing with raw body capture

**API Design**:
- RESTful API structure under `/api` prefix
- Resource-based endpoints for habits, goals, todos, pet management
- Automated pet stat calculation based on habit completion data
- Points system with transactions for gamification rewards

**Database Layer**:
- Drizzle ORM for type-safe database operations
- PostgreSQL dialect configuration (via Neon serverless driver)
- Database abstraction through storage interface pattern (`IStorage`)
- Schema-first design with Zod validation integration

**Key Business Logic**:
- Automatic pet evolution system based on user level and XP
- Streak calculation for habit consistency tracking
- Points and coins system for completing habits and goals
- Milestone tracking with celebration triggers
- Weekly completion rate analytics for happiness calculation

### Data Models

**Core Entities**:
- **Users**: Basic user profile with email
- **Habits**: Recurring tasks with icon, color, and cadence (daily/weekly)
- **HabitLogs**: Completion records with optional notes
- **Goals**: Long-term objectives with target values, deadlines, and categories
- **GoalUpdates**: Progress entries for goals
- **Todos**: One-time tasks with optional due dates and point values
- **VirtualPet**: Pet companion with stats (happiness, health, level, XP, evolution stage)
- **Costumes**: Unlockable pet customization items
- **UserCostumes**: Ownership and equipped status of costumes
- **PointTransactions**: Audit log for points earned/spent
- **UserPoints**: Current available points balance
- **UserSettings**: Theme preferences and notification settings

**Pet Evolution System**:
- Evolution stages: seed → sprout → sapling → tree → ancient
- Level-based progression (every 100 XP = 1 level)
- Happiness calculated from weekly completion rates
- Visual customization through costume system with categories (hat, accessory, outfit)

### External Dependencies

**Database**:
- Neon Serverless PostgreSQL (via `@neondatabase/serverless`)
- WebSocket connection support for real-time capabilities
- Connection pooling for performance

**UI Libraries**:
- Radix UI component primitives (17 different primitive sets)
- Tailwind CSS for utility-first styling
- Lucide React for icon system
- date-fns for date manipulation
- embla-carousel-react for carousel interactions
- cmdk for command palette functionality

**Form & Validation**:
- React Hook Form for form state management
- Zod for runtime type validation
- @hookform/resolvers for Zod integration

**Development Tools**:
- Replit-specific plugins (cartographer, dev-banner, runtime-error-modal)
- TypeScript with strict mode enabled
- ESBuild for server bundling
- PostCSS with Autoprefixer

**Custom Asset System**:
- Custom costume loader from `attached_assets/custom_costumes/`
- JSON-based costume configuration with automatic discovery
- Support for user-uploaded costume images