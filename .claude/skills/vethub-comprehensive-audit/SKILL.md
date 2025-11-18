---
name: vethub-comprehensive-audit
description: This skill should be used when comprehensive testing and auditing of all VetHub features is needed. It systematically tests patient management, task workflows, data parsing, MRI calculations, API endpoints, database operations, and VetRadar integration to identify what's working and what's broken.
---

# VetHub Comprehensive Audit

This skill provides systematic testing and auditing of all VetHub veterinary patient management application features.

## When to Use This Skill

Use this skill when:
- Need to verify all features are working after code changes
- VetRadar or other integrations may have broken existing features
- Comprehensive health check of the application is required
- Need detailed report of what's working vs what's broken

## What This Skill Tests

### 1. Patient Data Management
- Loading patients from database
- Creating new patients
- Updating patient information
- Deleting patients
- Patient type field (Medical, MRI, Surgery, Discharge)

### 2. Task Management Workflows
- Creating morning/evening tasks
- Task completion workflows
- Task auto-creation based on patient type
- Task filtering by time of day
- Task priority handling

### 3. Blood Work Parsing
- Extracting blood work data from text
- Analyzing blood work values
- Flagging abnormal values
- Blood work visualization

### 4. MRI Anesthesia Calculations
- Weight-based dosing calculations
- Scan type-specific protocols
- Anesthesia sheet generation

### 5. Patient Demographics Parsing
- Extracting patient info from various formats
- VetRadar data parsing
- EasyVet data parsing
- Manual data entry validation

### 6. CSV Export Functionality
- Exporting patient data to CSV
- Exporting task lists
- Exporting rounding sheets
- Data format validation

### 7. Rounding Sheet Generation
- Creating daily rounding sheets
- Neuro-specific protocols
- Template auto-fill
- Data persistence

### 8. Database Operations
- Connection testing
- CRUD operations on all tables
- Schema validation (especially patient.type field)
- Migration status

### 9. API Endpoints
- GET /api/patients
- POST /api/patients
- PUT /api/patients/:id
- DELETE /api/patients/:id
- Task endpoints (CRUD)
- VetRadar parsing endpoints

### 10. VetRadar Integration
- Login authentication
- Patient list scraping
- Medical records parsing
- Medication parsing
- Integration with existing features

## How to Run the Audit

1. Ensure dev server is running on http://localhost:3000
2. Run the audit script: `npx tsx .claude/skills/vethub-comprehensive-audit/scripts/run-audit.ts`
3. Review the generated report: `vethub-audit-report.md`

## Bundled Resources

- `scripts/run-audit.ts` - Main audit script that runs all tests
- `scripts/test-api.ts` - API endpoint testing
- `scripts/test-database.ts` - Database operations testing
- `scripts/test-parsing.ts` - Data parsing testing

## Audit Output

The audit generates a detailed markdown report with:
- **PASS/FAIL** status for each feature
- Error messages and stack traces for failures
- Root cause analysis
- Recommendations for fixes
- Summary of application health

## Workflow

When this skill is invoked:

1. **Preparation**
   - Verify dev server is running
   - Check database connectivity
   - Validate environment variables

2. **Execute Tests**
   - Run each test category sequentially
   - Log detailed results
   - Capture errors with full context

3. **Generate Report**
   - Compile all test results
   - Analyze failure patterns
   - Identify root causes
   - Provide actionable recommendations

4. **Present Findings**
   - Show summary to user
   - Highlight critical failures
   - Suggest next steps

## Example Usage

```
User: "I need to audit all VetHub features"
Claude: *Invokes vethub-comprehensive-audit skill*
Claude: Running comprehensive audit of VetHub...
Claude: *Generates and presents audit report*
```

## Integration with VetHub

This skill is aware of:
- VetHub's Next.js 15 + Prisma architecture
- Railway PostgreSQL database
- Patient type field (Medical, MRI, Surgery, Discharge)
- Task engine with templates
- VetRadar integration
- Known issues (patient.type column may not exist in production)

## Success Criteria

A successful audit provides:
- Clear PASS/FAIL status for all 10 feature categories
- Detailed error messages for failures
- Root cause identification
- Actionable fix recommendations
- Overall application health score
