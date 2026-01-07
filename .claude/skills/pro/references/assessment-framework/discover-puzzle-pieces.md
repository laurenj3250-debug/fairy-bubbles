# Step 2: Discover the Puzzle Pieces

Map what already exists before writing new code.

## Existing Code

### What related code already exists?

```bash
# Search for related keywords
grep -r "relatedKeyword" --include="*.ts"

# Find similar files
find . -name "*Similar*"

# Check imports
grep -r "from.*moduleName" --include="*.ts"
```

Questions to answer:
- Is there existing code that does something similar?
- Are there utilities/helpers I should reuse?
- What patterns does this codebase use?

### What would break if I change X?

- Who calls this function/API?
- What depends on this behavior?
- What tests cover this?

**Don't assume.** Search the codebase.

## Integration Points

### What systems does this need to connect to?

Map the data flow:
```
User action
  → Frontend component
    → API call
      → Backend handler
        → Database/service
          → Response
            → UI update
```

### What imports/exports are involved?

- What modules need to import my new code?
- What do I need to import?
- Are there circular dependency risks?

### What API contracts exist?

- Request/response formats
- Error handling conventions
- Authentication requirements
- Rate limits

### What state needs to update?

- Local component state?
- Global app state?
- Server-side state?
- Cache invalidation?

## Constraints

### Legacy code limitations

- Technical debt that can't be fixed now
- Patterns that must be followed for consistency
- Code that "works but nobody understands why"

### Third-party API quirks

- Rate limits
- Undocumented behavior
- Known bugs/workarounds
- Timeout characteristics

### Performance requirements

- Response time expectations
- Data volume considerations
- Concurrent user load

### Database schema constraints

- Foreign keys
- Required fields
- Data types
- Index coverage

### Deployment environment

- Environment variables needed
- Service dependencies
- Network restrictions
- Secrets management

## Output

A map of all pieces that need to fit together:

```
THIS TASK NEEDS TO:
├─ Modify: [list of files]
├─ Integrate with: [list of systems]
├─ Respect constraints: [list]
├─ Follow patterns: [existing patterns to match]
└─ Reuse: [existing code to leverage]
```

## Common Mistakes

1. **Not searching first** - Duplicating existing functionality
2. **Assuming patterns** - Not checking how similar things are done
3. **Missing dependencies** - Forgetting what calls what
4. **Ignoring constraints** - Building something that can't deploy

Time spent discovering is time saved debugging.
