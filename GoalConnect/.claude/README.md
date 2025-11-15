# Claude Code Workflows

This project uses automated workflows from [claude-code-workflows](https://github.com/OneRedOak/claude-code-workflows) to ensure code quality, security, and design consistency.

## Available Slash Commands

### `/code-review`
**Automated code review that checks:**
- ✅ Syntax and completeness
- ✅ Code style adherence
- ✅ Bug detection
- ✅ Best practices
- ✅ Performance considerations

**Usage:**
```
/code-review
```

Runs a comprehensive code review on recent changes. Great to use before creating a PR!

---

### `/security-review`
**Proactive security scanner that identifies:**
- 🔒 Security vulnerabilities
- 🔑 Exposed secrets (API keys, passwords)
- ⚠️ Attack vectors (XSS, SQL injection, etc.)
- 🛡️ OWASP Top 10 issues
- 🔐 Authentication/authorization flaws

**Usage:**
```
/security-review
```

Provides severity-classified findings with remediation steps.

---

### `/design-review`
**Front-end UI/UX review that verifies:**
- 🎨 Visual consistency
- ♿ Accessibility compliance (WCAG)
- 📱 Responsive design
- 🎯 Component patterns
- 🌈 Color contrast
- 🔤 Typography consistency

**Usage:**
```
/design-review
```

Especially useful for reviewing the new Base Camp glassmorphism dashboard!

---

## GitHub Actions (Automated PR Checks)

### Code Review Action
**Triggers:** On pull requests
**File:** `.github/workflows/code-review.yml`

Automatically reviews all PR code changes and posts feedback as PR comments.

### Security Scan Action
**Triggers:** On pull requests
**File:** `.github/workflows/security.yml`

Scans PR changes for security vulnerabilities and flags issues before merging.

---

## Configuration

### Design Principles
The design review uses principles defined in `design-principles.md` to evaluate:
- Base Camp travel-poster aesthetic
- Glassmorphism card styling
- Mountain-themed color palettes
- Light/warm sunrise theme

You can customize these principles for your project needs.

---

## Tips

**Before Creating a PR:**
```
/security-review
/code-review
```

**After UI Changes:**
```
/design-review
```

**Quick Security Check:**
```
/security-review
```

---

## Learn More

- [Claude Code Workflows Repo](https://github.com/OneRedOak/claude-code-workflows)
- [Code Review Documentation](https://github.com/OneRedOak/claude-code-workflows/tree/main/code-review)
- [Security Review Documentation](https://github.com/OneRedOak/claude-code-workflows/tree/main/security-review)
- [Design Review Documentation](https://github.com/OneRedOak/claude-code-workflows/tree/main/design-review)
