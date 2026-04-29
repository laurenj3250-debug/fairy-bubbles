# Burnout / Stay-Leave Tracker — Planning Doc

**Date:** 2026-04-27
**Status:** Spec locked, not yet built
**Owner:** Lauren

---

## Why this exists

Lauren has been logging "is residency worth it" thoughts across 6+ months of conversations with no longitudinal record. Every audit re-runs from scratch. The tracker is a place to leave a small, honest data point during the residency, so that the question "is this getting better, worse, or staying the same" has actual data behind it instead of memory.

This is not a burnout severity score. It is a stay/leave weighing tool, recorded over time.

---

## The three questions

Three 1-5 scales. Tap once per question. Anchored at the ends.

### Q1 — Turnover intention
**"Today, I wanted out."**

`1 — not at all  ·  ·  ·  ·  5 — constantly`

Maps to: Cammann et al. (1983) Turnover Intention Scale — single-item validated form.

### Q2 — Path conviction
**"This still felt like the right path today."**

`1 — no way  ·  ·  ·  ·  5 — absolutely`

Maps to: career regret / fit construct from physician satisfaction literature (JAMA, Merritt Hawkins).

### Q3 — Outside-view sanity check
**"A friend with a day like mine — I'd tell them to..."**

`1 — leave  ·  ·  ·  ·  5 — stay`

Maps to: third-person debiasing technique (Kross, Ayduk) — well-validated for reducing self-rationalization in emotionally loaded decisions.

---

## Cadence

- **Maximum 5 entries per week.**
- **No minimum.** Skipping is allowed and not flagged.
- **No fixed time of day.** Enter whenever.
- **No "you missed yesterday" prompts.**

Two days a week are free by design. The cap is a ceiling, not a floor.

---

## Stay-score (per entry)

Composite calculation:

```
stay-score = ((6 - Q1) + Q2 + Q3) / 3
```

Q1 inverts because high Q1 = bad (wanted out a lot). Q2 and Q3 are already in stay-direction.

Result is on a 1-5 scale. Higher = stay-leaning.

### Day classification

| Stay-score | Label |
|------------|-------|
| ≥ 4 | Stay-positive |
| ≤ 2 | Stay-negative |
| 2 < score < 4 | Middle |

These labels are descriptive, not prescriptive. The dashboard shows them as colors, not commentary.

---

## Dashboard views

### 1. Calendar heatmap
Each entry rendered as a cell in a calendar grid. Cell intensity is graded cream (high stay-score) to deep plum (low stay-score). Empty days are blank — not gray, not "missing," just blank.

### 2. Weekly bar chart
One bar per week. Bar height = that week's average stay-score. Bar color = same cream-to-plum gradient. Stacked variant available: each bar split into Q1/Q2/Q3 contributions, so it's visible whether a rough week was driven by exhaustion (Q1), path doubt (Q2), or outside-view collapse (Q3).

This is the "some weeks are worse than others" view at a glance.

### 3. Three line graphs
One per question, fine-grained. Plots every entry over time on the 1-5 scale. Lets you see if exhaustion is climbing while path-fit holds (different signal) vs. path-fit collapsing while exhaustion is steady (very different signal).

### 4. Counters
Three numbers at the top:
- Last 30 entries: X stay-positive, Y stay-negative, Z middle
- Last 90 entries: same
- Last 365 entries: same

Counted by entries, not by days, since the cadence is up-to-5-per-week.

---

## What's NOT in the spec (deliberately)

These are explicit vetoes — do not add later without re-discussion.

- **No streaks.** No "X days in a row" counter. Streaks create shame on bad days and bias toward false positives on good days. The "Don't break the chain" frame is wrong for this use case.
- **No improving / declining language.** The dashboard never says "you're trending better" or "things are getting worse." It shows the lines and bars; interpretation belongs to Lauren.
- **No time-of-day lock.** No "must enter by 9pm." No fixed prompt time.
- **No grief / context tags.** No "Glass day," "ER day," "grief day." No preset categories.
- **No backfill from chat history.** The tracker starts from the day it goes live. Past data does not get retro-scored.
- **No monthly forward-value question.** Daily-cadence weekly cap only.
- **No decision rule trigger.** No "if stay-score < 2.5 for X entries, alert." The data is presented; what to do with it is Lauren's call, not the app's.
- **No alerts, nudges, push notifications, or reminders.**
- **No improving/declining sparklines, color-changing scores, or "you're at risk" framing.**

---

## Use-the-data layer

The tracker's job is to record cleanly and let Lauren take the data wherever she takes it. Four features support that:

### 1. CSV / JSON export
Download all entries as a file. Columns: `date`, `q1`, `q2`, `q3`, `stay_score`, `note`. Use case: bring to therapist, paste into a doc, run own analysis.

### 2. Free-text note per entry
After the three taps, an optional empty line where Lauren can write anything — *"climbed today,"* *"Glass screamed at the resident not me,"* *"weird quiet day,"* or nothing. No forced length, no required field. Searchable later.

### 3. Compare-two-periods view
Pick any two date ranges (e.g., "March consults rotation" vs "April ER rotation"). The view shows side-by-side: mean Q1, mean Q2, mean Q3, mean stay-score, count of stay-positive / stay-negative / middle days. No interpretation language — just the numbers.

### 4. Snapshot / share
One button generates a clean image of the heatmap + weekly bars + counters for a chosen window. Image format suitable for texting, AirDropping, or pasting into a doc.

---

## Visual + interaction notes

- Sundown plum-brown palette (matches existing dashboard tokens).
- No dark mode.
- No emojis.
- No arrows.
- Tap-targets for the 1-5 scales: five dots in a row, large enough for thumb tap on phone.
- Optional note field collapses by default; tap to expand.

---

## Where it lives in GoalConnect

**TBD before implementation.** Two reasonable options:
1. Its own tab in the main nav (next to Habits / Goals).
2. A small surface on the Sundown dashboard that opens into a detail page.

This is a UI placement decision for the build phase, not the planning phase.

---

## Out of scope for v1

- Multi-user / sharing with a therapist account
- Automated insights or pattern detection
- Integration with the existing Cups system (revisit later if useful)
- Mobile push notifications
- Wearable / health-data integration

---

## Verification (when built)

The tracker is "working" if:
1. Three 1-5 questions can be entered in under 15 seconds.
2. Up to 5 entries per week is enforced; 6th attempt is gently declined.
3. Heatmap, weekly bars, and three line graphs all render with at least 4 weeks of data.
4. Export produces a valid CSV that opens in any spreadsheet.
5. No streak counter, no improving/declining language, no time-of-day lock anywhere in the UI.

---

## Research backing (for the curious)

- **Cammann et al. (1983)** — Turnover Intention Scale, validated single-item form. Workhorse of physician retention research.
- **Maslach Burnout Inventory (MBI)** — gold-standard burnout instrument since 1981; three subscales (exhaustion, cynicism, efficacy). Q1 maps loosely to exhaustion + DP construct.
- **Merritt Hawkins / JAMA physician satisfaction studies** — career regret single-item measure ("would I choose this again"). Q2 maps directly.
- **Kross & Ayduk** — third-person self-talk reduces emotional reactivity and improves decision quality. Q3 maps directly.
- **West et al.** — single-item measures correlate r ≈ 0.79 with full MBI for emotional exhaustion. The reduced-cadence, fewer-questions design is a defensible adaptation.

---

## End of spec
