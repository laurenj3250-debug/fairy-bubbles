# Onboarding Path

Learning progression for mastering professional engineering practices.

## Skill Progression

### Level 1: Core Concepts (Day 1)

**Goal:** Understand the philosophy and basic patterns.

```
READ:
├─ SKILL.md (overview)
├─ thinking-patterns/ask-vs-decide.md
├─ thinking-patterns/smell-detection.md
└─ assessment-framework/understand-this-task.md

PRACTICE:
├─ On your next small task:
│  ├─ Write down acceptance criteria before starting
│  ├─ Identify one potential gotcha
│  └─ Verify completion with evidence
└─ Time: ~2 hours reading, 1 task practice
```

### Level 2: Assessment Framework (Week 1)

**Goal:** Use the full assessment flow on real work.

```
READ:
├─ All assessment-framework/*.md files
├─ thinking-patterns/rabbit-hole-detection.md
├─ thinking-patterns/debugging-mindset.md
└─ engineering-standards/testing-pyramid.md

PRACTICE:
├─ On a medium-sized task:
│  ├─ Document puzzle pieces before coding
│  ├─ List task-specific gotchas
│  ├─ Create a mini-plan
│  ├─ Implement with awareness
│  └─ Verify with evidence (show test output)
│
├─ Get feedback from senior on:
│  ├─ Was assessment thorough enough?
│  ├─ Were gotchas identified correctly?
│  └─ Was verification sufficient?
│
└─ Time: Full week of normal work with this overlay
```

### Level 3: Standards Application (Weeks 2-4)

**Goal:** Apply relevant engineering standards to work.

```
READ (as needed):
├─ engineering-standards/api-design.md (if doing APIs)
├─ engineering-standards/data-modeling.md (if doing DB work)
├─ engineering-standards/performance-budgets.md (if optimizing)
├─ engineering-standards/adrs.md
└─ engineering-standards/code-readability.md

PRACTICE:
├─ Write your first ADR for a technical decision
├─ Apply test pyramid ratios to a feature
├─ Review your own PR using code review checklist
├─ Measure and document performance for a feature
│
├─ Get feedback on:
│  ├─ ADR quality and completeness
│  ├─ Test coverage and quality
│  └─ Code review thoroughness
│
└─ Time: 2-4 weeks of applying standards to work
```

### Level 4: Full Proficiency (Month 2+)

**Goal:** Patterns are internalized; can teach others.

```
INDICATORS OF PROFICIENCY:
├─ Automatically assess tasks before starting
├─ Identify gotchas from experience
├─ Know when to apply which standards
├─ Can explain trade-offs to others
├─ Rarely need to reference documents
└─ Can mentor Level 1-2 engineers

ONGOING:
├─ Contribute improvements to skill
├─ Share learnings with team
├─ Review others' assessments
└─ Write new reference materials for gaps
```

## Self-Assessment Checkpoints

### After Week 1

```
CAN YOU:
├─ [ ] Explain the difference between ask vs decide?
├─ [ ] Identify at least 3 code smells by name?
├─ [ ] Write acceptance criteria before starting?
├─ [ ] List gotchas specific to a task type?
├─ [ ] Provide evidence when claiming completion?
└─ [ ] Recognize when you're going down a rabbit hole?

If < 4 checked, spend more time on Level 1-2 materials.
```

### After Month 1

```
CAN YOU:
├─ [ ] Complete assessment flow without referencing docs?
├─ [ ] Choose appropriate test levels for a change?
├─ [ ] Write a valid ADR from memory?
├─ [ ] Identify second-order effects of changes?
├─ [ ] Know when design doc is needed vs not?
├─ [ ] Apply performance budgets to your work?
└─ [ ] Conduct thorough code review?

If < 5 checked, focus on specific gaps.
```

### After Month 2

```
CAN YOU:
├─ [ ] Mentor someone on Level 1-2 concepts?
├─ [ ] Contribute improvements to the skill?
├─ [ ] Recognize patterns across different tasks?
├─ [ ] Make cost-aware infrastructure decisions?
├─ [ ] Coordinate breaking changes with other teams?
├─ [ ] Design incremental rollout strategies?
└─ [ ] Build and update mental models of systems?

If < 5 checked, focus on leadership and teaching.
```

## Learning Resources

### Core Reading (Required)

```
SKILL DOCUMENTS:
├─ SKILL.md (start here)
├─ All thinking-patterns/*.md
├─ All assessment-framework/*.md
└─ engineering-standards/code-readability.md

EXTERNAL:
├─ Google Engineering Practices Guide
│  └─ https://google.github.io/eng-practices/
├─ The Pragmatic Programmer (book)
└─ Clean Code (book, chapters 1-6)
```

### Deep Dives (As Needed)

```
TESTING:
├─ engineering-standards/testing-pyramid.md
├─ "Growing Object-Oriented Software, Guided by Tests"
└─ Martin Fowler's testing articles

SRE:
├─ engineering-standards/sre-principles.md
├─ Google SRE Book (free online)
└─ "The Art of SRE" blog posts

API DESIGN:
├─ engineering-standards/api-design.md
├─ Google API Design Guide
└─ "REST API Design Rulebook"

DATABASE:
├─ engineering-standards/data-modeling.md
├─ "Designing Data-Intensive Applications"
└─ "SQL Performance Explained"
```

## Mentorship Structure

### For Mentees

```
WEEKLY CHECK-INS:
├─ What task did you assess this week?
├─ What gotchas did you identify?
├─ What evidence did you gather?
├─ Where did you get stuck?
└─ What do you want to improve next week?
```

### For Mentors

```
GUIDANCE APPROACH:
├─ Don't give answers, ask questions
├─ Review assessments, not just code
├─ Celebrate thorough verification
├─ Point out missed gotchas (after the fact)
└─ Model the thinking patterns yourself

FEEDBACK FOCUS:
├─ Week 1: Basic assessment completion
├─ Week 2: Gotcha identification quality
├─ Week 3: Verification thoroughness
├─ Week 4: Standards application
└─ Month 2+: Independence and teaching
```

## Common Struggles

### "This slows me down"

```
RESPONSE:
├─ Short-term: Yes, slightly slower
├─ Long-term: Much faster (fewer bugs, less rework)
├─ The goal is to internalize patterns
├─ Once internalized, no overhead
└─ Track time spent on bugs/rework before/after
```

### "I don't know which standards apply"

```
RESPONSE:
├─ Start with code-readability (always applies)
├─ Then testing-pyramid (usually applies)
├─ Add others based on task type:
│  ├─ API work → api-design
│  ├─ DB work → data-modeling
│  ├─ Performance → performance-budgets
│  └─ Architecture → adrs
└─ When in doubt, ask a senior
```

### "Too much to remember"

```
RESPONSE:
├─ You're not meant to memorize everything
├─ Reference documents when needed
├─ Patterns become automatic with practice
├─ Focus on one area at a time
└─ Skill grows incrementally, not all at once
```

### "My team doesn't do this"

```
RESPONSE:
├─ Start with your own work
├─ Lead by example
├─ Share improvements you've seen
├─ Propose one practice at a time
└─ Don't force, demonstrate value
```

## Certification (Optional)

### Self-Certification Checklist

```
I CAN DEMONSTRATE:

LEVEL 1 - PRACTITIONER
├─ [ ] Completed 5 tasks using assessment framework
├─ [ ] Written 3 sets of acceptance criteria
├─ [ ] Provided verification evidence 5 times
└─ Signed: _______ Date: _______

LEVEL 2 - PROFICIENT
├─ [ ] Written 1 ADR
├─ [ ] Applied test pyramid to 2 features
├─ [ ] Conducted 5 code reviews using checklist
├─ [ ] Identified and resolved 2 rabbit holes
└─ Signed: _______ Date: _______

LEVEL 3 - EXPERT
├─ [ ] Mentored 1 person through Level 1
├─ [ ] Contributed 1 improvement to skill
├─ [ ] Designed rollout strategy for 1 feature
├─ [ ] Written design doc for 1 complex feature
└─ Signed: _______ Date: _______
```

## Continuous Improvement

```
THE SKILL EVOLVES:
├─ Report gaps in documentation
├─ Suggest new patterns you discover
├─ Share war stories and learnings
├─ Propose updates to standards
└─ Help onboard new team members

FEEDBACK CHANNELS:
├─ Slack: #engineering-practices
├─ PRs: Direct to skill repository
├─ Retros: Discuss what's working/not
└─ 1:1s: Share with your manager
```
