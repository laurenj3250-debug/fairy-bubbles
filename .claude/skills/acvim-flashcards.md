# ACVIM Neurology Flashcard Generator

Generate high-yield RemNote flashcards from veterinary neurology textbook content for ACVIM board exam preparation.

---

## IMMEDIATE ACTION

**When user provides content in triple backticks: Begin Pass 1 extraction immediately. Do not ask clarifying questions unless content is genuinely ambiguous.**

**When user says "continue", "looks good", "go ahead", or similar: Proceed through all remaining steps without pausing.**

---

## WORKFLOW CONTROL

This is a **stepwise process** with explicit checkpoints:

### Step 1: Content Input
User pastes content in triple backticks.

### Step 2: Pass 1 - Extract (PAUSE AFTER)
List ALL discrete facts from content. Number them. Do not judge yet.
**Extract everything - even if 50+ facts. Do not truncate to match example length.**
→ STOP HERE. Show extracted facts. Wait for user confirmation.

### Step 3: Pass 2 - Filter + Format
After user confirms, proceed through remaining steps WITHOUT pausing:
- Create filtering table (KEEP/CUT/CONSOLIDATE)
- Generate RemNote cards
- Run redundancy check
- Run verification check
- Document cuts
- List uncertainties + flags

### Output All At Once
After user confirms Pass 1, output everything in a single response.

---

## CRITICAL RULES

```
1. ONE CONCEPT = ONE CARD
2. CUT if it won't change a clinical decision
3. ALWAYS include species when presentation differs
4. ALWAYS expand abbreviations on first use
5. FLAG uncertainty with [VERIFY] - never fabricate
6. USE :: for recall, == for recognition only
```

---

## PRIORITY ORDER (when rules conflict)

**When rules conflict, apply in this order:**

```
1. Board classic → ALWAYS KEEP (even if seems low-yield)
2. Clinical decision point → KEEP
3. Mechanism that explains signs → KEEP
4. Anatomical/pathway detail → CUT unless needed for localization
```

**Example conflict:** "Rare storage disease mechanism"
- Is it a board classic? YES (Lafora, fucosidosis, etc.) → KEEP
- Even though rare and mechanism doesn't change treatment

**Example conflict:** "Detailed nucleus pathway that explains a sign"
- Board classic? NO
- Clinical decision? NO
- Mechanism that explains sign? YES → KEEP (aids retention)

---

## EXAM BLUEPRINT (prioritization guide)

| Domain | Weight | Implication |
|--------|--------|-------------|
| Medical Neurology | 31% | Highest yield - include thoroughly |
| Neuroradiology | 22% | Don't over-cut imaging |
| Surgical Neurology | 22% | Indications/complications, not technique |
| General Knowledge | 20% | Anatomy for localization, key pharm |
| Neuropathology | 5% | Major patterns only, but don't skip entirely (~10 questions) |

---

## DECISION FRAMEWORK

**Core question:** "Would knowing this change clinical decision-making or answer a board question?"

### ALWAYS KEEP:
- Localization logic (sign → location)
- "Most common cause of X in [species]"
- Disease differentiation (A vs B)
- Pathognomonic findings
- Surgical indications + major complications
- Imaging patterns
- Species/breed/age predispositions
- Mechanisms that explain clinical signs
- Board classics (see appendix)
- Treatment decision points

### ALWAYS CUT:
- Detailed axon pathways through brainstem
- Spatial relationships between nuclei ("medial to X, dorsal to Y")
- Rare conditions NOT on board classics list
- Vague prognosis ("usually favorable", "variable")
- Definitions without clinical application
- Step-by-step surgical technique
- Detailed dosing protocols (except landmark doses)
- Embryology (unless explains a malformation)

---

## HANDLING SPECIAL CONTENT

### Source Tables
- **Comparison tables** → Convert to differentiation cards (A vs B: key difference)
- **Data tables** → Each clinically relevant row becomes a card
- **Reference tables** → Use `==` for context, `::` for testable rows

### Lists in Source
- **Differential lists** → Consolidate into single card with semicolons
- **Feature lists** → Keep only distinguishing features as separate cards
- **Step lists** → Usually CUT (protocols are low-yield)

### Images/Figures Referenced
- If source says "see Figure X" → Note what the figure shows if described, otherwise: `[Figure reference - not available]`
- Don't fabricate image descriptions

---

## CHUNKING PROTOCOL (for large content)

When processing multi-part content:

### Consistency Rules:
1. **Maintain same top-level topic header** across all chunks of same chapter
2. **Output cards after each chunk** - don't accumulate across parts
3. **Cross-references**: If content references something from previous chunk, note: `[See Part X]`
4. **Numbering**: User should state "Part 1 of 3" etc. for tracking

### Chunk Size Guidance:
- Ideal: One disease, one nerve, or one anatomical region per chunk
- Maximum: ~2000 words per chunk for quality
- If user pastes more, ask: "This is substantial content. Want me to process it all, or break into [suggested chunks]?"

---

## REMNOTE SYNTAX

```
- Topic Header
    - Subtopic
        - Reference fact == information (no flashcard)
        - Question :: Answer (flashcard created)
```

### `::` vs `==` Decision:

| Use `::` (flashcard) when: | Use `==` (reference) when: |
|---------------------------|---------------------------|
| Must PRODUCE the answer | Only need to RECOGNIZE it |
| Could be a question stem | Background context |
| Clinical decision point | Sets up cards that follow |
| Localization | Detailed anatomy for reference |

**Decision test:** "Would the exam ask me to PRODUCE this, or just RECOGNIZE it?"

### Formatting Rules:
- **Bold** key terms with `**asterisks**`
- Use `→` for causation/localization logic
- Use `;` to separate list items within a card
- Use `(species)` or `(dog)` parenthetically
- Indent with TABS not spaces
- Each `-` starts a new line

---

## FULL WORKED EXAMPLE

This shows the COMPLETE workflow at realistic length.

### INPUT:
```
Myasthenia gravis (MG) is a disorder of neuromuscular transmission caused by antibodies against acetylcholine receptors (AChR) at the neuromuscular junction. It can be acquired or congenital. Acquired MG is more common and results from autoimmune destruction of AChRs. Congenital MG is rare and results from genetic defects in AChR subunits or other NMJ proteins.

Breed predispositions for acquired MG include German Shepherds, Golden Retrievers, Labrador Retrievers, and Akitas. Cats can also be affected. There is a bimodal age distribution in dogs, with peaks at 2-4 years and 9-13 years.

Clinical signs include exercise-induced weakness that improves with rest, regurgitation due to megaesophagus, and facial weakness. Megaesophagus is present in approximately 90% of dogs with generalized MG and carries a worse prognosis due to risk of aspiration pneumonia. A focal form exists affecting only pharyngeal/esophageal muscles.

Diagnosis is confirmed by detecting serum AChR antibodies (positive in ~98% of generalized cases, ~70% of focal). The edrophonium (Tensilon) test can support diagnosis - IV administration causes transient improvement in strength due to increased ACh availability. Decremental response on repetitive nerve stimulation is also supportive.

Treatment includes anticholinesterase drugs (pyridostigmine), immunosuppression, and management of megaesophagus. Thymoma is associated with MG in dogs and should be evaluated with thoracic imaging. Thymectomy may be beneficial. Spontaneous remission occurs in approximately 89% of dogs within 6-18 months if they survive the initial period. Cats have a worse prognosis than dogs.
```

### PASS 1 - EXTRACTED FACTS:

1. MG is disorder of neuromuscular transmission
2. Caused by antibodies against AChR
3. Antibodies target neuromuscular junction
4. Can be acquired or congenital
5. Acquired MG more common
6. Acquired = autoimmune destruction of AChRs
7. Congenital MG rare
8. Congenital = genetic defects in AChR subunits or NMJ proteins
9. Breed predisposition: German Shepherds
10. Breed predisposition: Golden Retrievers
11. Breed predisposition: Labrador Retrievers
12. Breed predisposition: Akitas
13. Cats can be affected
14. Bimodal age distribution in dogs
15. Age peaks: 2-4 years and 9-13 years
16. Clinical sign: exercise-induced weakness improving with rest
17. Clinical sign: regurgitation from megaesophagus
18. Clinical sign: facial weakness
19. Megaesophagus in ~90% of generalized MG
20. Megaesophagus = worse prognosis
21. Worse prognosis due to aspiration pneumonia risk
22. Focal form exists
23. Focal form affects pharyngeal/esophageal muscles only
24. Diagnosis: serum AChR antibodies
25. AChR Ab positive in ~98% of generalized cases
26. AChR Ab positive in ~70% of focal cases
27. Edrophonium (Tensilon) test supports diagnosis
28. Edrophonium causes transient improvement
29. Mechanism: increased ACh availability
30. Decremental response on repetitive nerve stimulation
31. Treatment: anticholinesterase drugs (pyridostigmine)
32. Treatment: immunosuppression
33. Treatment: manage megaesophagus
34. Thymoma associated with MG in dogs
35. Evaluate with thoracic imaging
36. Thymectomy may be beneficial
37. Spontaneous remission in ~89% of dogs
38. Remission within 6-18 months
39. Must survive initial period for remission
40. Cats have worse prognosis than dogs

---
**40 facts extracted from 5 paragraphs.**
**Awaiting confirmation to proceed.**

---

### USER CONFIRMS → PROCEEDING WITH REMAINING STEPS:

### PASS 2 - FILTERING:

| # | Decision | Reason |
|---|----------|--------|
| 1-3 | CONSOLIDATE | Core definition - one card |
| 4-6 | KEEP | Acquired vs congenital - important distinction |
| 7-8 | CONSOLIDATE with 4-6 | Complete the comparison |
| 9-12 | CONSOLIDATE | Breed list |
| 13 | KEEP | Species relevance |
| 14-15 | CONSOLIDATE | Age distribution |
| 16 | KEEP | Pathognomonic feature |
| 17-18 | CONSOLIDATE | Clinical signs |
| 19-21 | CONSOLIDATE | Megaesophagus significance |
| 22-23 | KEEP | Focal form recognition |
| 24-26 | CONSOLIDATE | AChR antibody testing |
| 27-29 | CONSOLIDATE | Edrophonium test |
| 30 | KEEP | EMG finding |
| 31-33 | CUT | Treatment protocols - low yield detail |
| 34-36 | CONSOLIDATE | Thymoma association - important |
| 37-39 | CONSOLIDATE | Prognosis - actionable |
| 40 | KEEP | Species difference |

### CARDS:

```
- Myasthenia Gravis
    - Definition == Autoimmune disorder of neuromuscular transmission; antibodies against AChR at NMJ
    - Acquired vs congenital :: **Acquired** (common): autoimmune AChR destruction; **Congenital** (rare): genetic AChR/NMJ protein defects
    - Breed predisposition (dog) :: **German Shepherds**; Golden Retrievers; Labrador Retrievers; Akitas
    - Age distribution (dog) :: **Bimodal**: 2-4 years and 9-13 years
    - Pathognomonic sign :: **Exercise-induced weakness that improves with rest**
    - Other clinical signs :: Regurgitation (megaesophagus); facial weakness
    - Megaesophagus prevalence :: Present in **~90%** of generalized MG (dogs)
    - Why megaesophagus worsens prognosis :: **Aspiration pneumonia** risk
    - Focal MG :: Affects **pharyngeal/esophageal muscles only**; may present as megaesophagus without limb weakness
- Myasthenia Gravis - Diagnosis
    - Gold standard test :: Serum **AChR antibodies**
    - AChR Ab sensitivity :: **~98%** in generalized MG; **~70%** in focal MG
    - Edrophonium (Tensilon) test :: IV anticholinesterase → **transient strength improvement** (increased ACh at NMJ)
    - EMG finding :: **Decremental response** on repetitive nerve stimulation
- Myasthenia Gravis - Prognosis & Associations
    - Associated neoplasm :: **Thymoma** - evaluate with thoracic imaging; thymectomy may help
    - Spontaneous remission (dog) :: **~89%** remit within 6-18 months if survive initial period
    - Species prognosis difference :: **Cats have worse prognosis** than dogs
```

### REDUNDANCY REMOVED:

| Removed | Reason | Kept Instead |
|---------|--------|--------------|
| "MG causes regurgitation" (draft card) | Subset of "Other clinical signs" | "Other clinical signs :: Regurgitation (megaesophagus); facial weakness" |
| "Megaesophagus is common in MG" (draft card) | Overlaps with prevalence card | "Megaesophagus prevalence :: ~90%" |

### VERIFICATION REPORT:

**Coverage Check:**
- "most common": 0 mentions in source (N/A)
- Percentages: 4 found (90%, 98%, 70%, 89%) → all captured in cards
- Species-specific: Dog vs cat prognosis captured ✓
- Board classics: Myasthenia gravis IS a board classic → thoroughly covered ✓

**Ratio Check:**
- Extracted: 40 facts
- Generated: 17 cards (including == references)
- Ratio: 2.4 facts per card
- Status: OK (within 2-4 range)

**Middle Content Check:** PASS
- Paragraph 3 (clinical signs): ✓ captured
- Paragraph 4 (diagnosis): ✓ captured
- Paragraph 5 (treatment/prognosis): ✓ key points captured, protocols appropriately cut

**Flags:** None

### WHAT WAS CUT:

| Content | Reason |
|---------|--------|
| Treatment details (pyridostigmine, immunosuppression, megaesophagus management) | Protocol details - not decision points |
| "Thymectomy may be beneficial" as separate card | Consolidated with thymoma association |

### UNCERTAINTIES:

None flagged. Percentages (90%, 98%, 70%, 89%) presented as "approximately" in source - verify against current literature if precision matters.

---

## MORE EXAMPLES BY CONTENT TYPE

### Disease Differentiation
```
- GME vs CNS Lymphoma (dog)
    - Imaging similarity == Both: T2 hyperintense, contrast-enhancing lesions
    - GME pattern :: **Multifocal**; cerebellopontine angle; optic nerve predilection
    - Lymphoma pattern :: **Solitary**; **periventricular**
    - GME CSF :: **Mixed pleocytosis** (50-500 cells); elevated protein
    - Lymphoma CSF :: **Lymphocytic**; look for atypical cells
    - GME signalment :: Young-middle aged (3-6 yr) **small breed** dogs
    - Lymphoma signalment :: **Bimodal**: young OR >7 years
    - Confirmatory for lymphoma :: **PARR** (clonal lymphocyte detection)
```

### Imaging
```
- Canine Ischemic Stroke
    - Vessels affected :: **Rostral cerebellar** most common; middle cerebral second
    - Key MRI feature :: **Sharply marginated** T2/FLAIR hyperintensity confined to vascular territory
    - DWI in acute stroke :: **Hyperintense** DWI + **hypointense** ADC = restricted diffusion
    - Why DWI critical :: Detects stroke **within minutes**; T2/FLAIR delayed 6-12 hours
    - Enhancement pattern :: **Absent acutely**; may appear 7-14 days (BBB breakdown)
    - Underlying causes :: Hyperadrenocorticism; hypertension; cardiac disease; hypothyroidism; often **idiopathic**
```

### Toxicology
```
- Ivermectin Toxicosis (dog)
    - Genetic basis :: **ABCB1** (MDR1) mutation → defective **P-glycoprotein** in BBB
    - Mechanism :: P-gp normally pumps ivermectin out of CNS; mutants accumulate drug → neurotoxicity
    - Breeds :: **Collies** (70% carriers); Australian Shepherds; Shelties; OES; herding breeds
    - Clinical signs :: **Mydriasis**; blindness; ataxia; tremors; hypersalivation; coma
    - Onset :: **4-12 hours** post-exposure
    - Treatment :: **Supportive** (no antidote); consider **IV lipid emulsion**
    - Other dangerous P-gp substrates :: **Loperamide**; acepromazine; vincristine; doxorubicin
```

### Surgical
```
- Hemilaminectomy (dog)
    - Indications :: **Lateralized** disc extrusion with moderate-severe deficits; failed medical management
    - Timing (deep pain intact) :: Within **24-48 hours** of onset
    - Timing (no deep pain) :: Within **12-24 hours** may improve outcome
    - No deep pain >48h :: **Poor prognosis regardless of treatment**
    - Most common complication :: **Seroma** (~15-20%)
    - Other complications :: Infection; vertebral instability (excessive bone removal); iatrogenic cord trauma
```

### Localization
```
- Vestibular Localization
    - Peripheral vs central - key differentiator :: **Proprioceptive deficits** = central; peripheral spares proprioception
    - Pathognomonic for central :: **Vertical nystagmus** or **direction-changing nystagmus**
    - Peripheral nystagmus :: **Horizontal or rotary**; fast phase away from lesion; consistent direction
    - Head tilt :: Present in **both**; toward lesion side
    - Postural reactions :: **Normal** in peripheral; **abnormal** in central
```

---

## BOARD CLASSICS (always include even if rare)

### Storage Diseases & Degenerative:
- Lafora disease (Mini Wirehaired Dachshunds, Bassets) - myoclonic epilepsy
- Cerebellar abiotrophy (breed-specific presentations)
- Fucosidosis (English Springer Spaniels)
- Globoid cell leukodystrophy / Krabbe (Westies, Cairns)
- GM1/GM2 gangliosidosis (breed associations)
- Degenerative myelopathy (SOD1 mutation - GSDs, Corgis, Boxers, others)
- Neuroaxonal dystrophy (Rottweilers)

### Movement Disorders:
- Narcolepsy/cataplexy (Dobermans, Labs - hypocretin/orexin deficiency)
- Episodic falling syndrome (Cavaliers - BCAN gene)
- Dancing Doberman disease
- Scotty cramp (serotonin-related)
- HYPP (Quarter Horses - sodium channelopathy)

### Inflammatory/Infectious:
- Steroid-responsive meningitis-arteritis (SRMA) - young large breeds
- GME (small breeds, young-middle aged)
- Necrotizing encephalitis: NME (Pugs), NLE (Yorkies, Maltese)
- EPM - Sarcocystis neurona (horses)
- Canine distemper - myoclonus, old dog encephalitis
- Neosporosis (dogs, especially young)
- Toxoplasmosis (cats > dogs)

### Structural:
- Atlantoaxial instability (toy breeds)
- Chiari-like malformation/syringomyelia (Cavaliers)
- Wobbler syndrome (dogs: disc vs bone-associated; horses: CVM)
- Fibrocartilaginous embolism (FCE)
- IVDD - Hansen Type I vs Type II
- Discospondylitis
- Lumbosacral stenosis/cauda equina

### Neuromuscular:
- Myasthenia gravis (acquired vs congenital; megaesophagus)
- Tick paralysis (Ixodes, Dermacentor - ascending LMN)
- Polyradiculoneuritis / Coonhound paralysis
- Trigeminal neuritis (idiopathic, dropped jaw)
- Masticatory muscle myositis (2M antibodies)
- Laryngeal paralysis-polyneuropathy complex (GOLPP in old Labs)

### Seizure Disorders:
- Idiopathic epilepsy (breed predispositions, age of onset)
- Reactive seizures (toxins, metabolic)
- Structural epilepsy

### Neoplasia:
- Meningioma (most common primary brain tumor - dogs and cats)
- Glioma (brachycephalics)
- Choroid plexus tumors
- Nerve sheath tumors
- Spinal tumors: intradural-extramedullary vs intramedullary vs extradural

### Toxicoses:
- Ivermectin/ABCB1 (Collies, herding breeds)
- Metronidazole (cerebellar/vestibular)
- Lead (nucleated RBCs, basophilic stippling)
- 5-fluorouracil (cats - FATAL)
- Bromethalin (CNS edema)
- Hexachlorophene (intramyelinic edema)
- Organophosphate delayed neuropathy (OPIDN)
- Tetanus (horses > dogs)
- Botulism (horses, cattle, dogs)
- Marijuana/THC (increasing incidence)
- Xylitol (dogs - hypoglycemia/seizures)
- Permethrin (cats)

---

## LOCALIZATION QUICK REFERENCE

| Sign | Localization |
|------|--------------|
| Ipsilateral hemiparesis + CN deficits | Brainstem (ipsilateral to lesion) |
| Contralateral hemiparesis, normal CNs | Forebrain (contralateral to lesion) |
| UMN to all 4 limbs, normal CNs | C1-C5 |
| UMN pelvic, LMN thoracic | C6-T2 |
| UMN pelvic, normal thoracic | T3-L3 |
| LMN pelvic, normal thoracic | L4-S3 |
| UMN bladder | T3-L3 or above |
| LMN bladder | S1-S3 or cauda equina |
| Horner + ipsilateral LMN thoracic limb | C6-T2 (T1-T3 for sympathetic) |
| Head tilt + nystagmus | Vestibular (peripheral or central) |
| Vertical nystagmus | Central vestibular ONLY |
| Positional strabismus | Vestibular (any) |
| Intention tremor, hypermetria | Cerebellum |
| Menace absent, PLR normal, vision normal | Cerebellum |
| Menace absent, PLR normal, vision absent | Forebrain (visual cortex) |
| Bilateral absent menace, normal PLR | Cerebellar or bilateral forebrain |
| Circling | Forebrain (toward lesion) or vestibular |
| Seizures | Forebrain |

---

## HANDLING UNCERTAINTY

| Situation | Action |
|-----------|--------|
| Unsure of medical accuracy | Include with `[VERIFY]` tag |
| Contradictory sources | Note both: `[CONFLICTING - verify current consensus]` |
| Can't determine relevance | DEFAULT KEEP for clinical; DEFAULT CUT for anatomy detail |
| Unknown abbreviation | Write `[UNKNOWN ABBREVIATION: XYZ]` |
| Outdated content suspected | Include with `[MAY BE OUTDATED]` |
| Missing context (figure reference, etc.) | Note: `[Reference not available]` |

---

## VERIFICATION CHECK (mandatory)

**Run this AFTER generating cards, BEFORE final output.**

### Step 1: Coverage Check
Scan source for high-yield markers and verify each is addressed:

| Marker | Look For | If Missing |
|--------|----------|------------|
| "most common" | Should have a card | Flag: `[COVERAGE GAP: "most common X" not captured]` |
| "pathognomonic" | Must have a card | Flag: `[COVERAGE GAP: pathognomonic finding missed]` |
| "always" / "never" | Should have a card | Flag if clinically relevant |
| Percentages (%, numbers) | Verify captured or intentionally cut | Note in cuts table if cut |
| Species names | Check species-specific info captured | Flag if species difference missed |
| "differentiate" / "distinguish" | Should have differentiation card | Flag if missing |

### Step 2: Ratio Check
Compare extraction to output:

```
Source paragraphs: [count]
Extracted facts: [X]
Cards generated: [Y]
Expected ratio: 2-4 facts per card

If Y < X/4: Flag "[POSSIBLE OVER-CONSOLIDATION - review for lost nuance]"
If Y > X/2: Flag "[POSSIBLE UNDER-FILTERING - may include low-yield]"
```

### Step 3: Middle Content Check
Re-scan paragraphs 3-7 of source (or middle 40% of content). Verify at least one fact from each middle paragraph appears in output. If not:
- Flag: `[MIDDLE CONTENT CHECK: Paragraph X may have been missed]`

### Step 4: Board Classic Cross-Reference
If source mentions any condition from the Board Classics list, verify it wasn't cut. If it was cut, restore it.

---

## REDUNDANCY CHECK (mandatory)

**Run this AFTER generating cards to eliminate duplicates and overlaps.**

### Types of Redundancy:

**1. Exact Duplicates**
Same information appears in two cards.
→ Delete one, keep the better-worded version.

**2. Subset Redundancy**
Card A contains information that's fully contained in Card B.
```
Card A: "GME affects small breeds"
Card B: "GME signalment: young-middle aged small breed dogs"
→ Delete Card A (subset of B)
```

**3. Overlapping Content**
Two cards test related but not identical information with significant overlap.
```
Card A: "Megaesophagus present in 90% of generalized MG"
Card B: "MG commonly causes megaesophagus"
→ Keep Card A (more specific), delete Card B
```

**4. Answer-in-Question Redundancy**
Information in one card's answer appears as context in another card's question.
→ Review if both are necessary; often one can be cut.

**5. Cross-Chunk Redundancy (multi-part processing)**
If processing Part 2+ and content repeats from Part 1:
→ Note: `[Covered in Part X]` instead of re-carding

### Redundancy Check Process:

After generating cards, review the full list and ask:
1. Does any card duplicate another?
2. Does any card's answer fully contain another card's answer?
3. Are any two cards testing the same underlying concept?

If YES to any: Consolidate or delete. Note in output:
```
### REDUNDANCY REMOVED:
| Removed | Reason | Kept Instead |
|---------|--------|--------------|
```

### Acceptable "Redundancy":
- Same fact appearing as `==` reference AND `::` flashcard = OK (different purposes)
- Related but distinct concepts (e.g., "breeds affected" vs "age distribution") = OK
- Same disease in different contexts (diagnosis vs prognosis) = OK

---

## OUTPUT FORMAT

For each chunk processed:

### After Pass 1 (STOP HERE):
```
### PASS 1 - EXTRACTED FACTS:
1. [fact]
2. [fact]
...

---
**[X] facts extracted from [Y] paragraphs.**
**Awaiting confirmation to proceed.**
```

### After User Confirms (output all):
```
### PASS 2 - FILTERING:
| # | Decision | Reason |
|---|----------|--------|
...

### CARDS:
[RemNote formatted cards]

### REDUNDANCY REMOVED:
| Removed | Reason | Kept Instead |
|---------|--------|--------------|
[any redundant cards removed, or "None identified"]

### VERIFICATION REPORT:
**Coverage Check:**
- "most common" mentions: [X found, X captured / X cut]
- Percentages: [X found, X captured / X cut]
- Species-specific: [verified / gaps noted]
- Board classics referenced: [list any, confirm captured]

**Ratio Check:**
- Extracted: [X] facts
- Generated: [Y] cards
- Ratio: [X/Y] facts per card
- Status: [OK / FLAG if outside 2-4 range]

**Middle Content Check:** [PASS / specific flags]

**Flags:** [list any coverage gaps, or "None"]

### WHAT WAS CUT:
| Content | Reason |
|---------|--------|
...

### UNCERTAINTIES:
[Any VERIFY items, or "None"]
```

---

## When to Use This Skill

- Processing veterinary neurology textbook content
- Converting lecture notes to flashcards
- Creating board-focused study material
- Need ruthless low-yield filtering
- Want RemNote import-ready formatting

---

*Ready. Paste content in triple backticks. I will begin Pass 1 extraction immediately.*
