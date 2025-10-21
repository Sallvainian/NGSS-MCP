# ADR 001: Use Single Object Structure for 3D Framework Components

**Status:** Accepted

**Date:** 2025-10-19

**Context:** Mini-Epic (Tools 5-7) Implementation Blocker

---

## Context

During Story 1.1 implementation (TDD phase - writing tests first), we discovered a critical data structure mismatch between the tech spec assumptions and the actual NGSS-MCP v1.0.1 data model.

### The Problem

**Tech Spec Assumption (Incorrect):**
```typescript
interface Standard {
  science_practices: string[];        // Array of practice names
  crosscutting_concepts: string[];    // Array of concept names
  disciplinary_core_ideas: string[];  // Array of DCI names
}

const SEP_VALUES = [ /* 8 values */ ];
const CCC_VALUES = [ /* 7 values */ ];
```

**Actual Data Structure (v1.0.1):**
```typescript
interface Standard {
  sep: { code: string; name: string; description: string };  // Single object
  dci: { code: string; name: string; description: string };  // Single object
  ccc: { code: string; name: string; description: string };  // Single object
}

// Actual counts from data:
// SEP: 11 unique values (not 8)
// CCC: 13 unique values (not 7)
// DCI: 14 unique values (not mentioned)
```

### Impact

1. **Tool 5 & 6 Filter Logic Broken:**
   - Tech spec: `standards.filter(s => s.science_practices.includes(practice))`
   - Reality: Field `science_practices` doesn't exist
   - Must use: `standards.filter(s => s.sep.name === practice)`

2. **Tool 7 Scoring Algorithm Fundamentally Different:**
   - Tech spec: Array overlap scoring (e.g., `sharedSEPs.length * 2`)
   - Reality: Binary match scoring (e.g., `sepMatch ? 2 : 0`)

3. **All 23 Acceptance Criteria Affected:**
   - AC-5.1: "8 valid SEP names" → Should be 11
   - AC-6.1: "7 valid CCC names" → Should be 13
   - AC-5.x/6.x: All filter tests assume `.includes()` → Must use exact match
   - AC-7.4: Scoring algorithm completely changes

4. **All 4 Stories Blocked:**
   - Story 1.1-1.4 contain incorrect implementation guidance
   - Data validation tests fail
   - Filter implementation assumptions wrong

### Options Considered

**Option A: Update Tech Spec to Match Data ✅ CHOSEN**
- Redesign Tools 5-7 to work with existing `sep`/`dci`/`ccc` object structure
- Update SEP_VALUES/CCC_VALUES enums to match actual data (11 SEP, 13 CCC)
- Rewrite acceptance criteria and stories
- **Pros:** Fast (4-6 hours), no breaking changes, honest architecture
- **Cons:** Tool 7 scoring less granular (binary vs multi-value)

**Option B: Transform Data to Arrays ❌ REJECTED**
- Modify PDF extraction pipeline to create array fields
- Migrate existing data structure
- **Pros:** Matches original tech spec design
- **Cons:** Violates "no pipeline changes" constraint, 12-20 hour effort, breaks backward compatibility, may not be possible if PDF only has one practice per standard

**Option C: Hybrid Adapter Layer ❌ REJECTED**
- Add computed properties: `get science_practices() { return [this.sep.name]; }`
- **Pros:** Tech spec works with minimal changes
- **Cons:** Runtime complexity, confusing dual API, Tool 7 still binary scoring

---

## Decision

We will **update the tech spec, acceptance criteria, and stories to match the actual v1.0.1 data structure** (Option A).

### Rationale

1. **Fastest Path to Unblock:** 4-6 hours vs 12-20 hours (Option B) or 6-8 hours (Option C)
2. **Honest Architecture:** Code reflects actual data structure, no abstraction layers
3. **Simpler Implementation:** Direct object property access vs array operations
4. **Safe:** Zero risk to existing v1.0.1 tools (1-4) and their 63 passing tests
5. **Tool 7 Tradeoff Acceptable:** Binary scoring still provides useful unit planning recommendations

### Binary Scoring Still Works

```typescript
// Example: Unit planning for Energy standards
Anchor: MS-PS3-1 (Energy, domain=Physical Science, sep="Developing Models", ccc="Systems")

Candidate A: Same domain (+3), same sep (+2), same ccc (+2), same dci (+1) = 8 points
Candidate B: Same domain (+3), different sep (0), same ccc (+2), different dci (0) = 5 points
Candidate C: Different domain (0), same sep (+2), same ccc (+2), same dci (+1) = 5 points
```

Ranking: A > B = C (still meaningful for teachers)

---

## Consequences

### Positive

1. **Immediate Unblock:** DEV can implement Story 1.1-1.4 with corrected guidance
2. **No Breaking Changes:** v1.0.1 tools remain 100% functional
3. **Simpler Code:** Direct property access is easier to understand and maintain
4. **Accurate Enums:** SEP_VALUES (11) and CCC_VALUES (13) match actual data
5. **Performance:** Exact match is O(1) vs array filtering O(n)

### Negative

1. **Tool 7 Scoring Less Granular:** Binary match (0 or 2 points) vs potential multi-value overlap
   - **Mitigation:** DCI field still exists for additional scoring dimension
   - **Impact:** Minimal - NGSS data appears to have one primary practice/concept per standard

2. **Documentation Rewrite Required:**
   - Tech spec Data Models section (lines 92-167)
   - Tool 5-7 API schemas and workflows
   - 23 acceptance criteria (AC-5.x through AC-ALL.x)
   - 4 story files (Story 1.1-1.4)
   - **Effort:** 4-6 hours total

3. **Diverges from Original NGSS Framework Design:**
   - Official NGSS standards may have multiple practices/concepts
   - v1.0.1 extraction pipeline chose ONE primary practice/concept per standard
   - **Mitigation:** This is a data extraction choice, not a tech limitation
   - **Future:** Can add multi-value support if PDF extraction improves

### Neutral

1. **Future Data Updates:** If extraction pipeline later adds multi-value support, we can:
   - Add computed array properties without breaking existing code
   - Gradually migrate to array-based scoring in Tool 7
   - Maintain backward compatibility with deprecation notices

---

## Verification

Data analysis confirmed:
```bash
# Unique SEP names across 55 standards
$ cat data/ngss-ms-standards.json | jq -r '.standards[].sep.name' | sort -u | wc -l
11

# Unique CCC names across 55 standards
$ cat data/ngss-ms-standards.json | jq -r '.standards[].ccc.name' | sort -u | wc -l
13

# Unique DCI names across 55 standards
$ cat data/ngss-ms-standards.json | jq -r '.standards[].dci.name' | sort -u | wc -l
14

# Total standards
$ cat data/ngss-ms-standards.json | jq '.standards | length'
55
```

---

## Implementation Plan

1. ✅ Create this ADR
2. ⏳ Update Tech Spec Data Models section with correct structure
3. ⏳ Update Tool 5-7 API schemas and workflows
4. ⏳ Update all 23 acceptance criteria
5. ⏳ Rewrite Story 1.1-1.4 with corrected implementation guidance
6. ⏳ Create new DEV handoff with correct assumptions
7. ⏳ Mark workflow status as "Ready for Implementation"

**Estimated Completion:** 4-6 hours (documentation-heavy, low technical risk)

---

## References

- Tech Spec: `docs/tech-spec-mini-epic.md`
- Data File: `data/ngss-ms-standards.json`
- Type Definitions: `src/types/ngss.ts`
- Original Handoff: `.serena/memories/dev-handoff-2025-10-19.md`
- Critical Handoff: `.serena/memories/architect-handoff-2025-10-19-critical.md`
- Story Files: `docs/stories/story-1.{1,2,3,4}.md`
