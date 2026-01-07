# Cross-Team Coordination

Managing breaking changes, API contracts, and dependencies.

## Breaking Change Process

### What Counts as Breaking

```
BREAKING CHANGES:
├─ Removing API endpoints
├─ Removing fields from responses
├─ Changing field types
├─ Changing required/optional status
├─ Changing authentication requirements
├─ Changing error codes/formats
├─ Changing behavior semantics
└─ Removing database tables/columns others use

NOT BREAKING:
├─ Adding new endpoints
├─ Adding optional fields
├─ Adding new optional parameters
├─ Adding new error codes (if gracefully handled)
└─ Performance improvements
```

### Breaking Change Timeline

```
TIMELINE:
├─ Week 0:  Announce planned change
├─ Week 2:  Share migration guide
├─ Week 4:  Deprecation begins (code + docs)
├─ Week 8:  Follow up with dependent teams
├─ Week 12: Final warning
├─ Week 14+: Remove (only after all migrated)

MINIMUM NOTICE: 2 weeks for minor, 6 weeks for major
```

### Announcement Template

```markdown
## Breaking Change Notice: [Change Name]

**Change:** [What's changing]
**Why:** [Reason for change]
**Impact:** [Who/what is affected]
**Timeline:**
- Deprecation: [Date]
- Removal: [Date]

**Migration Path:**
1. [Step 1]
2. [Step 2]

**Support:**
- Questions: #[slack-channel]
- Migration help: [contact]

**Action Required:**
- [ ] Review migration guide
- [ ] Update your code by [date]
- [ ] Confirm migration complete
```

## API Contract Management

### Contract Definition

```
EVERY API MUST HAVE:
├─ OpenAPI/Swagger spec
├─ Request/response examples
├─ Error code documentation
├─ Authentication requirements
├─ Rate limit documentation
└─ Deprecation status for old fields
```

### Contract Testing

```
PRODUCER (API owner):
├─ Publish contract spec
├─ Run contract tests in CI
├─ Notify consumers of changes
└─ Maintain backward compatibility

CONSUMER (API user):
├─ Generate client from spec
├─ Run contract tests against mock
├─ Report contract violations
└─ Handle deprecation warnings
```

### Versioning Strategy

```
URL VERSIONING (recommended):
├─ /v1/users
├─ /v2/users
└─ Clear, explicit, easy to route

HEADER VERSIONING (alternative):
├─ Accept: application/vnd.api+json; version=1
└─ Less visible, harder to debug
```

### Version Lifecycle

| Stage | Support Level | Duration |
|-------|---------------|----------|
| Current | Full support | Active |
| Deprecated | Bug fixes only | 6-12 months |
| Sunset | No support | 30 days notice |
| Removed | 410 Gone | Permanent |

## Dependency Management

### Internal Dependencies

```
DEPENDENCY RULES:
├─ Explicit version pinning
├─ Automated update notifications
├─ Breaking change impact analysis
├─ Dependency graph visualization
└─ Circular dependency prevention
```

### Service Dependencies

```
SERVICE DEPENDENCY CHECKLIST:
├─ [ ] Service discovery configured
├─ [ ] Health checks implemented
├─ [ ] Circuit breaker in place
├─ [ ] Timeout configured
├─ [ ] Retry policy defined
├─ [ ] Fallback behavior documented
└─ [ ] SLA documented and agreed
```

### Dependency SLAs

```
BETWEEN TEAMS, DEFINE:
├─ Availability target (e.g., 99.9%)
├─ Latency target (e.g., p95 < 100ms)
├─ Error rate target (e.g., < 0.01%)
├─ Support response time
└─ Escalation path
```

## Communication Channels

### Required Channels

```
FOR EACH SERVICE/API:
├─ Slack/Teams channel for questions
├─ Email list for announcements
├─ Wiki/Confluence for documentation
├─ JIRA/Linear for tracking requests
└─ On-call rotation for incidents
```

### Communication Protocol

| Urgency | Channel | Response Time |
|---------|---------|---------------|
| Incident | PagerDuty + Slack | < 15 min |
| Blocker | Direct message + Slack | < 1 hour |
| Question | Slack channel | < 4 hours |
| Request | JIRA ticket | < 2 days |
| FYI | Email/Slack | Async |

## Integration Testing

### Cross-Team Test Strategy

```
LEVELS:
├─ Unit: Each team tests own code
├─ Contract: Mock other services, verify contracts
├─ Integration: Real services in staging
└─ E2E: Full user journeys across services

OWNERSHIP:
├─ Contract tests: Both teams maintain
├─ Integration tests: Shared responsibility
├─ E2E tests: Platform/QA team
```

### Staging Environment

```
SHARED STAGING RULES:
├─ No production data
├─ Isolated from production
├─ Feature flags match production default
├─ Real service-to-service calls
├─ Shared test data management
└─ Regular data refresh schedule
```

## Change Management

### RFC Process (Request for Comments)

```
USE RFC FOR:
├─ Changes affecting multiple teams
├─ New shared infrastructure
├─ API design decisions
├─ Architecture changes
└─ Process changes

RFC TEMPLATE:
├─ Problem statement
├─ Proposed solution
├─ Alternatives considered
├─ Impact on other teams
├─ Migration plan
├─ Timeline
└─ Open questions
```

### Review Requirements

| Change Scope | Required Reviews |
|--------------|------------------|
| Internal to team | Team lead |
| Affects one other team | Both team leads |
| Affects multiple teams | Architecture review |
| Company-wide | Engineering leadership |

## Incident Response

### Cross-Team Incidents

```
WHEN INCIDENT AFFECTS MULTIPLE TEAMS:
1. Incident commander assigned (first responder)
2. Create shared incident channel
3. Bring in affected teams
4. Parallel investigation
5. Coordinated fix
6. Shared postmortem
```

### Postmortem Attendance

```
REQUIRED ATTENDEES:
├─ All contributing teams
├─ Affected teams
├─ On-call engineers involved
└─ Optional: leadership for P0/P1
```

## Documentation

### API Documentation Requirements

```
EVERY API MUST DOCUMENT:
├─ Purpose and use cases
├─ Authentication
├─ Endpoints with examples
├─ Error codes and handling
├─ Rate limits
├─ Changelog
├─ Migration guides
└─ Support contact
```

### Service Documentation

```
EVERY SERVICE MUST DOCUMENT:
├─ What it does (high level)
├─ Dependencies (what it needs)
├─ Dependents (who uses it)
├─ How to run locally
├─ How to deploy
├─ How to troubleshoot
└─ On-call runbooks
```

## Ownership

### Service Ownership

```
EVERY SERVICE HAS:
├─ Primary owner (team)
├─ Secondary owner (backup team)
├─ On-call rotation
├─ Escalation path
└─ Documented in service catalog
```

### Shared Code Ownership

```
SHARED LIBRARIES:
├─ Clear ownership (one team)
├─ Contribution guidelines
├─ Review requirements
├─ Release process
└─ Version support policy
```
