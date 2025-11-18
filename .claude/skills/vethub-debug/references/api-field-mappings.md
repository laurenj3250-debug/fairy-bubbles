# VetHub API Field Mappings

Quick reference for field names across different parts of the codebase.

## Task Fields

### API Route Expects (`/api/tasks/patients/[id]/tasks`)
```typescript
{
  title: string,          // REQUIRED
  description?: string,
  category?: string,
  timeOfDay?: 'morning' | 'evening',
  completedAt?: Date
}
```

### Frontend May Send
```typescript
{
  name: string,           // Sometimes used instead of title!
  description?: string,
  category?: string,
  timeOfDay?: string
}
```

### Database Schema (Prisma)
```prisma
model Task {
  id          String   @id @default(cuid())
  title       String            // Stored as 'title'
  description String?
  category    String?
  timeOfDay   String?
  completedAt DateTime?
  patientId   String
  patient     Patient  @relation(fields: [patientId], references: [id])
}
```

## Patient Fields

### UnifiedPatient Structure (Current)
```typescript
{
  id: string,
  source: 'local' | 'vetradar',
  status: string,
  demographics: {
    name: string,
    age: string,
    breed: string,
    species: string,
    sex: string,
    weight: string,
    color: string
  },
  owner: {
    name: string,
    phone: string,
    email: string,
    address: string
  },
  medicalInfo: {
    treatments: string[],
    criticalNotes: string[]
  },
  stickerData?: {
    bigLabelCount: number,
    tinySheetCount: number
  }
}
```

### Old Patient Structure (Legacy)
```typescript
{
  id: string,
  name: string,           // Flattened!
  age: string,
  breed: string,
  species: string
  // ... other flat fields
}
```

## VetRadar Import Fields

### VetRadar API Returns
```typescript
{
  id: string,
  name: string,
  demographics: {
    name: string,
    dateOfBirth: string,
    // ...
  },
  treatments: string[],
  criticalNotes: string[]
}
```

### Mapped to UnifiedPatient
- `vetradar.demographics.name` → `demographics.name`
- `vetradar.treatments` → `medicalInfo.treatments`
- `vetradar.criticalNotes` → `medicalInfo.criticalNotes`

## Common Conversion Patterns

### Accessing Patient Name
```typescript
// WRONG (works for old Patient, breaks for UnifiedPatient):
patient.name

// CORRECT (works for both):
patient.demographics?.name || patient.name || 'Unknown'
```

### Creating a Task
```typescript
// API call should use 'title':
await fetch('/api/tasks/patients/123/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Task name',        // Use 'title', not 'name'!
    description: 'Details',
    category: 'Treatment'
  })
});
```

### Displaying Medical Info
```typescript
// WRONG:
patient.medications  // Doesn't exist in UnifiedPatient

// CORRECT:
patient.medicalInfo?.treatments || []
patient.medicalInfo?.criticalNotes || []
```

## Field Naming Rules

**API Routes:**
- Use explicit, descriptive names
- Follow database schema naming
- Add validation for required fields

**Frontend:**
- Match API expectations
- Add type definitions
- Handle both old/new formats during transition

**Database (Prisma):**
- Single source of truth
- Use camelCase
- Required fields marked clearly
