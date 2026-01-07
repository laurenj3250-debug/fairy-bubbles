# Dependency Management

Evaluation, security, and update strategies for external dependencies.

## Before Adding a Dependency

### Evaluation Checklist

```
MUST EVALUATE:
├─ Is it actively maintained?
│  └─ Commits in last 3 months?
│  └─ Issues responded to?
│  └─ Multiple maintainers?
│
├─ Security track record?
│  └─ Check CVE history (snyk.io/advisor)
│  └─ Security policy documented?
│  └─ Responsible disclosure process?
│
├─ License compatible?
│  └─ MIT, Apache 2.0, BSD: Generally OK
│  └─ GPL: Requires legal review
│  └─ AGPL: Usually avoid for SaaS
│  └─ Proprietary: Requires procurement
│
├─ Size impact?
│  └─ Bundle size (bundlephobia.com)
│  └─ Install size (packagephobia.com)
│  └─ Tree-shakeable?
│
├─ Transitive dependencies?
│  └─ How many indirect deps?
│  └─ Any known problematic deps?
│  └─ Supply chain risk?
│
└─ Build vs buy analysis?
   └─ Could we implement in < 1 day?
   └─ Is external dep worth the risk?
   └─ Core functionality or utility?
```

### Decision Matrix

| Factor | Weight | Score (1-5) |
|--------|--------|-------------|
| Maintenance activity | 20% | |
| Security history | 25% | |
| Community size | 10% | |
| Bundle size impact | 15% | |
| Transitive deps | 15% | |
| API stability | 15% | |
| **Weighted Score** | | |

**Threshold:** Score > 3.5 to add dependency

## Security Scanning

### Automated Scanning

```
REQUIRED TOOLS:
├─ Dependabot or Renovate (PR automation)
├─ npm audit / yarn audit (local)
├─ Snyk or Sonatype (deep analysis)
└─ GitHub Security Advisories

CI PIPELINE:
├─ Run on every PR
├─ Block merge on critical/high
├─ Alert on medium
├─ Log low for review
```

### Response SLAs

| Severity | Response Time | Action Required |
|----------|---------------|-----------------|
| Critical | 24 hours | Immediate patch or mitigation |
| High | 48 hours | Patch in next release |
| Medium | 1 week | Add to sprint backlog |
| Low | 30 days | Add to technical debt |

### Vulnerability Response Process

```
1. ASSESS
   ├─ Is the vulnerable code path used?
   ├─ Is it exploitable in our context?
   └─ What's the actual risk?

2. MITIGATE
   ├─ Update dependency (preferred)
   ├─ Patch vulnerable code
   ├─ Disable affected feature
   └─ Add compensating controls

3. VERIFY
   ├─ Confirm fix applied
   ├─ Test functionality
   └─ Re-scan to confirm

4. DOCUMENT
   ├─ What was the vulnerability?
   ├─ How was it fixed?
   └─ What's the ongoing plan?
```

## Update Strategy

### Auto-Update Rules

| Update Type | Automation | Review Required |
|-------------|------------|-----------------|
| Patch (1.0.x) | Auto-merge if tests pass | No |
| Minor (1.x.0) | Auto-PR | Quick review |
| Major (x.0.0) | Auto-PR | Full review |
| Security | Auto-PR (priority) | Quick review |

### Update Configuration

```yaml
# renovate.json example
{
  "extends": ["config:base"],
  "packageRules": [
    {
      "matchUpdateTypes": ["patch"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["minor"],
      "automerge": false
    },
    {
      "matchUpdateTypes": ["major"],
      "labels": ["major-update"],
      "reviewers": ["team:platform"]
    },
    {
      "matchPackagePatterns": ["*"],
      "matchUpdateTypes": ["security"],
      "labels": ["security"],
      "priority": 1
    }
  ],
  "schedule": ["before 7am on Monday"]
}
```

### Major Version Updates

```
PROCESS FOR MAJOR UPDATES:
├─ Read changelog and migration guide
├─ Check for breaking changes
├─ Update in separate branch
├─ Run full test suite
├─ Manual testing of affected features
├─ Update usage if API changed
└─ Document any gotchas
```

## Version Pinning

### Pinning Strategy

```
EXACT PINNING (Recommended):
├─ "lodash": "4.17.21"
├─ Predictable builds
├─ Must actively manage updates
└─ Use for production dependencies

RANGE PINNING:
├─ "lodash": "^4.17.0"
├─ Gets compatible updates automatically
├─ Less predictable
└─ Use for dev dependencies only
```

### Lock Files

```
ALWAYS COMMIT LOCK FILES:
├─ package-lock.json (npm)
├─ yarn.lock (yarn)
├─ pnpm-lock.yaml (pnpm)

PURPOSE:
├─ Reproducible builds
├─ Same versions across environments
├─ Audit trail of changes
└─ Security scanning accuracy
```

## Dependency Auditing

### Regular Audit Schedule

| Task | Frequency |
|------|-----------|
| Security scan | Every CI run |
| Dependency updates | Weekly |
| License audit | Monthly |
| Full dependency review | Quarterly |
| Major version planning | Semi-annually |

### Audit Checklist

```
QUARTERLY REVIEW:
├─ [ ] Any unused dependencies? (depcheck)
├─ [ ] Any duplicate dependencies?
├─ [ ] Any deprecated dependencies?
├─ [ ] Any dependencies with alternatives?
├─ [ ] Bundle size still within budget?
├─ [ ] Any new security advisories?
└─ [ ] Documentation up to date?
```

## Reducing Dependencies

### Signs of Too Many Dependencies

```
RED FLAGS:
├─ > 100 direct dependencies
├─ > 500 total dependencies (including transitive)
├─ Multiple deps doing same thing
├─ Deps for trivial functionality
├─ Unmaintained deps (> 1 year stale)
└─ Deps with many vulnerabilities
```

### Reduction Strategies

```
REMOVE:
├─ Unused dependencies (depcheck)
├─ Duplicate functionality
├─ Dev dependencies in prod

REPLACE:
├─ Heavy deps with lighter alternatives
├─ Multiple small deps with one comprehensive
├─ Unmaintained with maintained fork/alternative

INLINE:
├─ Trivial functions (< 10 lines)
├─ Single-use utilities
├─ Frequently-breaking deps
```

## Supply Chain Security

### Best Practices

```
PREVENTION:
├─ Use lock files
├─ Pin exact versions
├─ Verify package integrity (npm ci)
├─ Use private registry for sensitive code
├─ Review new dependencies before adding
└─ Use SBOM (Software Bill of Materials)

DETECTION:
├─ Monitor for typosquatting
├─ Watch for maintainer takeovers
├─ Track dependency changes in PRs
├─ Use npm audit / yarn audit
└─ Subscribe to security advisories

RESPONSE:
├─ Have rollback plan
├─ Know how to fork if needed
├─ Document critical dependencies
└─ Test without network (offline builds)
```

### Critical Dependencies

```
IDENTIFY CRITICAL DEPS:
├─ Used in security-sensitive code
├─ Handles user data
├─ Core to business logic
├─ Hard to replace
└─ Deep in dependency tree

FOR CRITICAL DEPS:
├─ Monitor more closely
├─ Have backup plan
├─ Consider vendor copy
├─ Review updates more carefully
└─ Contribute to maintenance
```

## Documentation

### Dependency Documentation

```markdown
# Dependencies

## Core Dependencies

### React (^18.2.0)
- **Purpose:** UI framework
- **Why chosen:** Team expertise, ecosystem
- **Alternatives considered:** Vue, Svelte
- **Critical:** Yes
- **Owner:** Frontend team

### Express (^4.18.0)
- **Purpose:** HTTP server
- **Why chosen:** Simplicity, middleware ecosystem
- **Alternatives considered:** Fastify, Koa
- **Critical:** Yes
- **Owner:** Backend team

## Development Dependencies

[List with same format...]

## Deprecated Dependencies

### lodash (4.17.21) - DEPRECATED
- **Replacement:** Native JS methods
- **Migration deadline:** 2024-Q2
- **Migration guide:** [link]
```

## Tooling Setup

### Essential Tools

```json
// package.json scripts
{
  "scripts": {
    "deps:check": "depcheck",
    "deps:audit": "npm audit",
    "deps:outdated": "npm outdated",
    "deps:licenses": "license-checker --summary",
    "deps:size": "bundlesize"
  }
}
```

### CI Integration

```yaml
# Example CI job
dependency-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Install
      run: npm ci
    - name: Security Audit
      run: npm audit --audit-level=high
    - name: License Check
      run: npx license-checker --failOn 'GPL'
    - name: Bundle Size
      run: npm run deps:size
```
