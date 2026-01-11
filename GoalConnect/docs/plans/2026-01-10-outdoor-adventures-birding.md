# Outdoor Adventures + Birding Feature

**Date:** 2026-01-10
**Status:** Approved, implementing

## Overview

Photo-centric tracking for outdoor adventures and bird life list, integrated with yearly goals.

**Two tabs on `/adventures` page:**
1. **Adventures** - Photo board of outdoor days → feeds "52 outdoor days" goal
2. **Birds** - Life list of species → feeds "100 new bird species" goal

## Data Model

### outdoor_adventures

```sql
CREATE TABLE outdoor_adventures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,              -- YYYY-MM-DD (multiple per day allowed)
  activity TEXT NOT NULL,                 -- "birding", "hiking", "climbing", etc
  location TEXT,                          -- "Smith Rock, OR"
  photo_path TEXT,                        -- "/uploads/{userId}/adventures/xxx.jpg"
  thumb_path TEXT,                        -- "/uploads/{userId}/adventures/xxx_thumb.jpg"
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_adventures_user_date ON outdoor_adventures(user_id, date);
```

### bird_sightings (life list)

```sql
CREATE TABLE bird_sightings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_name TEXT NOT NULL,             -- "Northern Cardinal"
  first_seen_date VARCHAR(10) NOT NULL,   -- YYYY-MM-DD
  first_seen_adventure_id INTEGER REFERENCES outdoor_adventures(id) ON DELETE SET NULL,
  location TEXT,                          -- Where first spotted
  photo_path TEXT,                        -- Best photo (can be updated)
  thumb_path TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, species_name)           -- One entry per species per user
);

CREATE INDEX idx_birds_user ON bird_sightings(user_id);
CREATE INDEX idx_birds_first_seen ON bird_sightings(user_id, first_seen_date);
```

## Photo Storage

**Location:** `/public/uploads/{userId}/adventures/` and `/public/uploads/{userId}/birds/`

**Upload flow:**
1. Client resizes to max 1200px (browser-image-compression library)
2. Client validates: max 5MB, image/* only
3. Server saves original + generates 400px thumbnail (sharp library)
4. Store both paths in DB

**File naming:** `{timestamp}-{random}.jpg`

## API Routes

### Adventures
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/adventures` | List adventures (paginated, by date desc) |
| GET | `/api/adventures/:id` | Get single adventure |
| POST | `/api/adventures` | Create with photo upload |
| PUT | `/api/adventures/:id` | Update (can replace photo) |
| DELETE | `/api/adventures/:id` | Delete entry + files |

### Birds
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/birds` | List life list (sortable, searchable) |
| GET | `/api/birds/:id` | Get single species entry |
| POST | `/api/birds` | Add species to life list |
| PUT | `/api/birds/:id` | Update (can replace photo) |
| DELETE | `/api/birds/:id` | Remove from life list |

## Goal Integration

### "52 outdoor days" (existing goal)

**Change:** Count unique dates from BOTH tables (union, no double-count)

```typescript
case "outdoor_days": {
  sourceLabel = "Adventures";

  // Union of dates from climbing ticks + adventures
  const result = await db.execute(sql`
    SELECT COUNT(DISTINCT date) as count FROM (
      SELECT date FROM outdoor_climbing_ticks
      WHERE user_id = ${userId} AND date >= ${startDate} AND date <= ${endDate}
      UNION
      SELECT date FROM outdoor_adventures
      WHERE user_id = ${userId} AND date >= ${startDate} AND date <= ${endDate}
    ) AS all_dates
  `);
  computedValue = Number(result.rows[0]?.count ?? 0);
  break;
}
```

### "100 new bird species" (new goal)

**Add:** New `linkedJourneyKey: "bird_species"`

```typescript
case "bird_species": {
  sourceLabel = "Life List";

  // Count species FIRST spotted in current year
  const result = await db
    .select({ count: count() })
    .from(birdSightings)
    .where(and(
      eq(birdSightings.userId, userId),
      gte(birdSightings.firstSeenDate, startDate),
      lte(birdSightings.firstSeenDate, endDate)
    ));
  computedValue = Number(result[0]?.count ?? 0);
  break;
}
```

**Seed goal:**
```typescript
{
  title: "Spot 100 new bird species",
  category: "outdoor",
  goalType: "count",
  targetValue: 100,
  linkedJourneyKey: "bird_species",
  year: "2026"
}
```

## UI Components

### /adventures page

```
┌─────────────────────────────────────────────┐
│ Outdoor Adventures          [12/52 days]    │
├─────────────────────────────────────────────┤
│ [Adventures] [Birds]                        │  ← Tab navigation
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │photo│ │photo│ │photo│                   │  ← Photo grid
│  │Jan15│ │Jan12│ │Jan10│                   │     (3 cols desktop, 2 mobile)
│  └─────┘ └─────┘ └─────┘                   │
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │photo│ │photo│ │photo│                   │
│  │Jan8 │ │Jan5 │ │Jan2 │                   │
│  └─────┘ └─────┘ └─────┘                   │
│                                             │
│                              [+] FAB        │
└─────────────────────────────────────────────┘
```

### Birds tab

```
┌─────────────────────────────────────────────┐
│ Life List                    [23 species]   │
├─────────────────────────────────────────────┤
│ Sort: [Alphabetical ▼]  Search: [________]  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │photo│ │photo│ │photo│                   │
│  │Blue │ │Card-│ │Robin│                   │
│  │Jay  │ │inal │ │     │                   │
│  └─────┘ └─────┘ └─────┘                   │
│                                             │
│                              [+] FAB        │
└─────────────────────────────────────────────┘
```

### Add/Edit Modal

**Adventures:**
- Date picker (default today)
- Activity input (autocomplete from previous entries)
- Location input
- Photo dropzone with preview
- Notes textarea

**Birds:**
- Species name input
- Date first spotted
- Location
- Photo dropzone
- Notes
- Optional: Link to adventure (dropdown of adventures on that date)

## Implementation Phases

### Phase 1: Infrastructure
- [ ] DB migrations
- [ ] Photo upload API with thumbnail generation
- [ ] File validation (size, type)

### Phase 2: Adventures
- [ ] Adventures CRUD API
- [ ] Adventures grid UI
- [ ] Add/Edit modal
- [ ] Update outdoor_days goal query

### Phase 3: Birds
- [ ] Birds CRUD API
- [ ] Life list UI with sort/search
- [ ] Add sighting modal
- [ ] Add bird_species goal tracking
- [ ] Seed 100 species goal

### Phase 4: Polish
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error handling + toasts
- [ ] Delete confirmations
- [ ] Mobile optimization

## Edge Cases

| Case | Handling |
|------|----------|
| Multiple adventures same day | Allowed, all shown in grid |
| Adventure without photo | Allowed, show placeholder |
| Update bird photo | Allowed, deletes old files |
| Delete adventure linked to bird | Bird keeps record, adventure_id set NULL |
| Upload fails | Show error toast, keep form data |
| File too large | Client-side validation, reject > 5MB |

## Out of Scope (v1)

- Map view of sightings
- eBird import
- Sighting log (multiple sightings per species)
- Social sharing
- Offline support
