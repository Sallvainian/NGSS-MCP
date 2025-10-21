# ADR-002: OCR Data Quality Handling Strategy

**Date:** 2025-10-19
**Status:** Accepted
**Decision Makers:** Winston (Architect), with multi-model consensus analysis
**Supersedes:** N/A
**Related:** [ADR-001: Data Structure for 3D Framework](./001-use-single-object-3d-framework-structure.md)

---

## Context

During pre-implementation validation for Stories 1.1 and 1.2 (search by SEP/CCC), we discovered OCR-induced data quality issues in the NGSS standards dataset:

### Problem Statement

**SEP (Science & Engineering Practices):**
- Tech spec expected: **10 unique values**
- Actual data contained: **11 unique values**
- OCR errors:
  - `"Ask ques tions..."` (space in "questions")
  - `"phenomena ."` (space before period, duplicate of correct value)

**CCC (Crosscutting Concepts):**
- Tech spec expected: **8 unique values**
- Actual data contained: **13 unique values**
- OCR errors:
  - `"i n natural"` (space in "in")
  - `"systems ."`, `"data ."` (spaces before periods)
  - `"atomic -level"` (space before hyphen)
  - `"Patter ns"`, `"cau se"`, `"natura l"` (spaces within words)
  - `"Proportional relationships (e."` (truncated OCR value)

### Impact

- Tools 5 and 6 implementation **blocked**
- Teacher-facing API would expose OCR artifacts
- Unclear enum definition for tool parameters
- No safeguards against future OCR errors

### Key Constraints

1. **Greenfield for these fields:** `sep.name` and `ccc.name` have NO existing consumers (Tools 5-6 not yet implemented)
2. **Small dataset:** 55 total standards
3. **Educational context:** Teachers expect authoritative, error-free content
4. **Brownfield overall:** v1.0.1 already published, but affected fields unused

---

## Decision

**We adopt Modified Option D: Fix Data Now + CI Validation + Future-Proofing Documentation**

### Implementation

1. **Immediate (Unblock Stories 1.1 & 1.2):**
   - Created automated correction script: `scripts/fix-ocr-errors.ts`
   - Fixed 45 OCR errors across 55 standards
   - Reduced SEP from 11→10 unique values
   - Reduced CCC from 13→8 unique values

2. **CI Validation (Prevent Regression):**
   - Created validation script: `scripts/validate-data-quality.ts`
   - GitHub Actions workflow: `.github/workflows/data-quality.yml`
   - Validates on every PR touching `data/**/*.json`
   - Enforces:
     - Exactly 10 unique SEP values
     - Exactly 8 unique CCC values
     - No whitespace anomalies
     - No truncated values

3. **Future Migration Path:**
   - Documented conditions for adopting normalization layer approach
   - Clear trigger points (dataset >200 standards, multiple PDF sources, IMS CASE integration)

---

## Alternatives Considered

### Option A: Accept Messy Data (11 SEP + 13 CCC)
**Approach:** Use all actual values as-is in enum definitions.

**Pros:**
- ✅ Zero migration risk
- ✅ Immediate implementation
- ✅ Guaranteed compatibility with data

**Cons:**
- ❌ Teachers see OCR errors in API (`"Ask ques tions"`, `"Patter ns"`)
- ❌ Unprofessional for educational tool
- ❌ Larger API surface (24 enums vs 18)
- ❌ Undermines trust and credibility

**Verdict:** ❌ **Rejected** - Unacceptable UX for teachers

---

### Option B: Fix Data File Only (No Safeguards)
**Approach:** Manually correct the JSON data file once.

**Pros:**
- ✅ Clean UX immediately
- ✅ Simple one-time fix
- ✅ Matches tech spec expectations

**Cons:**
- ❌ No protection against future OCR errors
- ❌ Silent regression on next PDF extraction
- ❌ Requires manual intervention each time

**Verdict:** ❌ **Rejected** - Incomplete solution, no safeguards

---

### Option C: Normalized Matching (Original)
**Approach:** Clean enum values, normalize before comparing to data.

**Initial Assessment:**
- Users see clean values
- Works with messy data
- Future-proof for new OCR errors

**Critical Flaw Discovered:**
Simple whitespace normalization (`trim()` + collapse spaces) **cannot fix word-level errors:**
- `"Ask ques tions"` ≠ `"Asking questions"` (different words!)
- `"Patter ns"` ≠ `"Patterns"` (broken word)

**To work, Option C would require:**
- Mapping table: `{"Ask ques tions": "Asking questions", ...}`
- Essentially same effort as fixing data
- Plus ongoing maintenance of normalization logic
- Runtime complexity for no real benefit at this scale

**Verdict:** ❌ **Rejected** - Over-engineered for current scope

---

### Option E: Canonical Vocabulary Layer (GPT-5-Pro Recommendation)
**Approach:** Sophisticated normalization with stable IDs, alias mapping, and IMS CASE/Ed-Fi alignment.

**Pros:**
- ✅ Production-grade educational data architecture
- ✅ Aligns with industry standards (IMS CASE, Ed-Fi)
- ✅ Scales to enterprise datasets (10,000+ standards)
- ✅ Handles complex OCR patterns with fuzzy matching
- ✅ Supports localization and versioning

**Cons:**
- ❌ 2 days implementation vs 2-3 hours
- ❌ Complex for 55 standards
- ❌ YAGNI principle violation (over-engineering)
- ❌ Runtime overhead for static enums

**Analysis:**
- **O3 Model (8/10 confidence):** "Normalization layer is over-engineering for small static enums"
- **GPT-5-Pro (8/10 confidence):** "Canonical vocab scales better, aligns with education standards"

**Architectural Trade-off:**
- Option E is **objectively superior** for large-scale educational platforms
- Option D is **pragmatically optimal** for current project scope (55 standards, 1 PDF source)

**Verdict:** ⚠️ **Deferred** - Documented as future migration path

---

## Rationale

### Why Modified Option D Wins

1. **Pragmatism Over Purity:**
   - Time to value: 2-3 hours vs 2 days
   - Unblocks Stories 1.1 & 1.2 **today**
   - Delivers same clean UX as Option E

2. **Right-Sized Solution:**
   - 55 standards ≠ enterprise education platform
   - Single PDF source ≠ multi-source ingestion pipeline
   - Static enums ≠ dynamic user-generated content

3. **Quality Preserved:**
   - CI validation prevents regressions (better than manual vigilance)
   - Teachers see clean canonical values (same as Option E)
   - Zero runtime overhead (pure lookups)

4. **Future Path Clear:**
   - If dataset scales beyond 200 standards → adopt Option E approach
   - If we integrate IMS CASE → canonical vocab becomes valuable
   - If multiple PDF sources → normalization layer justified
   - Current solution doesn't block future migration

### Multi-Model Consensus

**Analysis Process:**
- Sequential thinking (10 steps) to explore trade-offs
- GPT-5-Pro advocated for Option E (sophistication)
- O3 advocated for Option D (simplicity)
- Both models rejected Options A & B

**Key Insight from O3:**
> "Normalization layers are typical for messy, user-generated text, not for fixed official standards. Ed-tech APIs publish canonical enumerations and enforce them in CI."

**Key Insight from GPT-5-Pro:**
> "Encapsulate variability at the ingestion boundary to scale cleanly. Avoid one-off manual data fixes as a practice."

**Resolution:**
- Adopt Option D **now** (O3's recommendation for current scope)
- Document Option E **path** (GPT-5-Pro's recommendation for future scale)
- Balance speed/quality/future-proofing

---

## Consequences

### Positive

- ✅ Clean professional API for teachers (10 SEP, 8 CCC canonical values)
- ✅ Stories 1.1 & 1.2 unblocked (implementation can proceed today)
- ✅ Automated safeguards via CI (prevents regression)
- ✅ Simple codebase (pure enum lookups, zero runtime complexity)
- ✅ Clear migration path if/when project scales
- ✅ 45 OCR errors corrected across 55 standards
- ✅ Total implementation: ~3 hours vs 2 days

### Neutral

- 🔶 Manual correction required for future PDF extractions
- 🔶 CI validation as quality gate (build fails if OCR errors detected)
- 🔶 Documented decision for future team members

### Negative

- ❌ No automated normalization layer (acceptable for 55 standards)
- ❌ Must revisit if dataset exceeds 200 standards
- ❌ Not aligned with IMS CASE/Ed-Fi **yet** (migration path documented)

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Future OCR errors reintroduced | Medium | Medium | CI validation fails build, forces manual review |
| Manual correction introduces bugs | Low | Medium | Automated script + validation tests + code review |
| Under-engineering (should've built Option E) | Low | Low | Documented migration triggers, clear decision criteria |
| Dataset scales unexpectedly | Very Low | Low | Monitor standard count, revisit at 100+ standards |

---

## Migration Triggers

**Conditions to adopt Option E (Canonical Vocabulary Layer):**

1. **Dataset Growth:** Standards exceed 200 (currently 55)
2. **Multiple Sources:** Adding high school standards or other PDF sources
3. **Integration:** Need IMS CASE or Ed-Fi interoperability
4. **Localization:** Supporting multiple languages
5. **OCR Frequency:** Re-extracting PDFs more than quarterly

**Current Status:** None of these conditions apply → Modified Option D appropriate

---

## References

- **Sequential Thinking Analysis:** 10-step exploration of options
- **Multi-Model Consensus:**
  - GPT-5-Pro (8/10): Option E recommendation
  - O3 (8/10): Option D recommendation
- **Handoff Context:** `.serena/memories/architect-handoff-2025-10-19-ocr-decision.md`
- **Validation Tests:** `src/server/integration.test.ts` (lines 23-181)
- **Correction Script:** `scripts/fix-ocr-errors.ts`
- **Validation Script:** `scripts/validate-data-quality.ts`
- **CI Workflow:** `.github/workflows/data-quality.yml`

---

## Notes

**For Future Maintainers:**

This decision was made for a **small, focused MCP server** with 55 standards from a single PDF source. The sophisticated normalization layer (Option E) is architecturally superior for large-scale educational data platforms but represents over-engineering for the current scope.

If you're reading this because the dataset has grown significantly or you're integrating with education standards platforms, **revisit Option E**. The GPT-5-Pro analysis in the multi-model consensus contains excellent implementation guidance for that approach.

**Decision Principle:** Build what you need today, plan for what you might need tomorrow, document when to make the switch.
