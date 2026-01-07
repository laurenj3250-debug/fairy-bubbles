# Code Readability

Naming conventions, documentation standards, and review practices.

## Naming Conventions

### Files and Directories

| Type | Convention | Example |
|------|------------|---------|
| Files (general) | kebab-case | `user-service.ts` |
| React components | PascalCase | `UserProfile.tsx` |
| Test files | Same as source + .test | `user-service.test.ts` |
| Type files | Same as source + .types | `user.types.ts` |
| Directories | kebab-case | `user-management/` |

### Code Elements

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `UserService` |
| Interfaces | PascalCase (no I prefix) | `User`, `ApiResponse` |
| Types | PascalCase | `UserRole`, `RequestConfig` |
| Functions | camelCase | `getUserById`, `formatDate` |
| Variables | camelCase | `userName`, `isActive` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Enums | PascalCase (values SCREAMING_SNAKE) | `UserRole.ADMIN` |
| Private members | camelCase (no underscore prefix) | `privateMethod()` |

### Naming Quality

```
GOOD NAMES:
├─ Reveal intent: isUserActive not flag
├─ Are pronounceable: customerId not cstmrId
├─ Are searchable: MAX_CONNECTIONS not 10
├─ Avoid encoding: name not strName
└─ Use domain language: invoice not document42

BAD NAMES:
├─ Single letters: x, y, i (except loop counters)
├─ Abbreviations: usr, msg, btn
├─ Misleading: userList when it's a Map
├─ Generic: data, info, temp, thing
└─ Hungarian notation: strName, intCount
```

### Function Naming

```
VERBS FOR ACTIONS:
├─ get/fetch: Retrieve data (getUser, fetchOrders)
├─ set: Assign value (setUserName)
├─ create/make: Construct new (createUser, makeRequest)
├─ update: Modify existing (updateProfile)
├─ delete/remove: Eliminate (deleteUser, removeItem)
├─ is/has/can: Boolean check (isValid, hasPermission, canEdit)
├─ handle: Event handler (handleClick, handleSubmit)
├─ on: Event callback (onClick, onSubmit)
└─ transform/convert: Change form (transformResponse, convertToJSON)
```

## Documentation Standards

### When to Document

```
ALWAYS DOCUMENT:
├─ Public APIs (functions, classes, modules)
├─ Complex algorithms (explain the why)
├─ Non-obvious behavior (gotchas, edge cases)
├─ Configuration options
├─ Error conditions and handling
└─ Performance considerations

DON'T DOCUMENT:
├─ Self-explanatory code
├─ Implementation details of simple functions
├─ What the code does (code shows that)
└─ Obvious type information
```

### JSDoc/TSDoc Format

```typescript
/**
 * Calculates the discount for an order based on customer tier.
 *
 * @param order - The order to calculate discount for
 * @param customerTier - Customer's loyalty tier (bronze, silver, gold)
 * @returns The discount amount in cents
 * @throws {InvalidOrderError} If order total is negative
 *
 * @example
 * const discount = calculateDiscount(order, 'gold');
 * // Returns 1500 for a $100 order (15% gold discount)
 */
function calculateDiscount(order: Order, customerTier: CustomerTier): number {
  // ...
}
```

### Comment Quality

```
GOOD COMMENTS (explain WHY):
// Use retry with exponential backoff because the payment
// provider rate-limits aggressive retry attempts
await retryWithBackoff(processPayment);

// Cache TTL is 5 minutes because user preferences rarely
// change and we want to reduce database load
const CACHE_TTL = 5 * 60 * 1000;

BAD COMMENTS (explain WHAT):
// Loop through users
for (const user of users) {

// Increment counter
counter++;

// Get the user
const user = getUser(id);
```

### TODO Comments

```
FORMAT:
// TODO(username): Description - JIRA-123

EXAMPLE:
// TODO(jsmith): Implement retry logic for flaky API - API-456

RULES:
├─ Always include owner
├─ Always include ticket reference
├─ Review TODOs before merge
├─ Don't merge TODOs for critical paths
└─ Track TODOs in backlog
```

## Code Organization

### File Structure

```
SINGLE RESPONSIBILITY:
├─ One primary export per file
├─ Related helpers can coexist
├─ Types with their implementations
└─ Tests adjacent to source

EXAMPLE FILE:
user.ts
├─ User interface
├─ createUser function
├─ validateUser function (helper)
└─ Export: User, createUser
```

### Import Order

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal absolute imports
import { UserService } from '@/services/user';
import { Button } from '@/components/ui';

// 3. Relative imports
import { formatUserName } from './utils';
import { UserProps } from './types';

// 4. Types (if separate)
import type { User } from '@/types';

// 5. Styles (if applicable)
import styles from './User.module.css';
```

### Function Organization

```
WITHIN A FILE, ORDER:
├─ Constants
├─ Types/Interfaces
├─ Main exported function/class
├─ Helper functions (private)
└─ Export statement (if not inline)

WITHIN A CLASS:
├─ Static properties
├─ Instance properties
├─ Constructor
├─ Public methods
├─ Private methods
└─ Static methods
```

## Code Review Standards

### Review Turnaround

| Priority | First Response | Complete Review |
|----------|----------------|-----------------|
| Urgent (blocking) | 1 hour | 4 hours |
| Normal | 4 hours | 24 hours |
| Low (refactor) | 24 hours | 48 hours |

### Review Checklist

```
CORRECTNESS:
├─ [ ] Does it do what it claims?
├─ [ ] Are edge cases handled?
├─ [ ] Are errors handled appropriately?
├─ [ ] Are there any bugs?

DESIGN:
├─ [ ] Is this the right abstraction level?
├─ [ ] Does it follow existing patterns?
├─ [ ] Is it appropriately simple?
├─ [ ] Are there any code smells?

TESTING:
├─ [ ] Are there adequate tests?
├─ [ ] Do tests cover edge cases?
├─ [ ] Are tests readable?

READABILITY:
├─ [ ] Are names clear and consistent?
├─ [ ] Is the code self-documenting?
├─ [ ] Are comments helpful (not redundant)?
├─ [ ] Is the structure logical?
```

### Review Comments

```
REQUIRED VS OPTIONAL:
├─ No prefix: Must be addressed
├─ "Nit:": Optional style suggestion
├─ "Question:": Seeking clarification
├─ "Suggestion:": Alternative approach
└─ "FYI:": Educational, no change needed

EXAMPLES:
"This could cause a null pointer if user is undefined."
"Nit: Consider renaming to getUserById for clarity."
"Question: Why did you choose this approach over X?"
"Suggestion: You could use Array.find() here for cleaner code."
```

### Approval Standards

```
LGTM (Looks Good To Me):
├─ Code improves overall health
├─ All blocking issues addressed
├─ Tests pass
└─ Ready to merge

REJECT when:
├─ Code worsens codebase health
├─ Security vulnerability introduced
├─ Missing tests for new functionality
├─ Blocking issues not addressed
└─ Doesn't meet requirements
```

## Formatting

### Automated Formatting

```
USE AUTOMATED TOOLS:
├─ Prettier for code formatting
├─ ESLint for code quality
├─ Stylelint for CSS
├─ EditorConfig for consistency
└─ Pre-commit hooks to enforce

BENEFITS:
├─ No bike-shedding on style
├─ Consistent across team
├─ Faster reviews
└─ Less cognitive load
```

### Configuration Example

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Magic numbers | Unclear meaning | Use named constants |
| Deep nesting | Hard to follow | Early returns, extract functions |
| Long functions | Too many responsibilities | Split into smaller functions |
| Boolean parameters | Unclear at call site | Use options object or enum |
| Comment-out code | Clutters, confuses | Delete (git has history) |
| Inconsistent naming | Cognitive overhead | Follow conventions |
| Copy-paste code | Maintenance burden | Extract shared logic |
