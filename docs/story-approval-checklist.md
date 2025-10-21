# Story Approval Checklist

**Purpose:** Ensure stories are validated against ADRs and data structure before implementation begins.

**When to Use:** Before changing any story Status from "Draft" to "Approved"

---

## Pre-Approval Validation Steps

### 1. Data Structure Validation ✅

**Required for all stories involving 3D Framework (SEP, DCI, CCC):**

- [ ] Dev Notes use correct field names:
  - Use `sep.name` (NOT `science_practices[]`)
  - Use `dci.name` (NOT `disciplinary_core_ideas[]`)
  - Use `ccc.name` (NOT `crosscutting_concepts[]`)

- [ ] Dev Notes reference ADR-001 if using 3D framework components

- [ ] Code examples in Dev Notes match actual data structure

- [ ] Filter logic uses exact string match (NOT array `.includes()` or `.filter()`)

### 2. ADR Cross-Reference ✅

- [ ] Story has been reviewed against all relevant ADRs

- [ ] No contradictions with existing ADR decisions

- [ ] If story requires new architectural decision, ADR draft created first

**Relevant ADRs for Mini-Epic (Tools 5-7):**
- [ADR-001: Single Object 3D Framework Structure](adr/001-use-single-object-3d-framework-structure.md)
- [ADR-002: OCR Data Quality Handling](adr/002-ocr-data-quality-handling.md)

### 3. Tech Spec Alignment ✅

- [ ] Story Dev Notes align with Tech Spec implementation guidance

- [ ] API schema in story matches Tech Spec exactly

- [ ] Acceptance criteria traceable to Tech Spec requirements

- [ ] No data model assumptions that contradict Tech Spec Data Models section

### 4. Pattern Consistency ✅

**For brownfield stories (enhancing existing codebase):**

- [ ] Dev Notes reference existing patterns from similar implemented stories

- [ ] Code examples follow established brownfield patterns

- [ ] No breaking changes to existing tool contracts

- [ ] Backward compatibility explicitly addressed

### 5. Test Coverage Plan ✅

- [ ] Each Acceptance Criterion has at least one corresponding test task

- [ ] Edge cases identified and test tasks created

- [ ] Performance requirements (if any) have benchmark test tasks

- [ ] Data validation tests included (where applicable)

---

## Approval Gate Process

**Before marking Status = "Approved":**

1. Complete all 5 validation steps above
2. Document validation in approval note (see template below)
3. Update story Status to "Approved"
4. Add approval signature (Architect name + date)

**Approval Note Template:**

```markdown
**Approval Note (YYYY-MM-DD):**
- Data structure validated against ADR-001 ✅
- Tech Spec alignment confirmed ✅
- Pattern consistency with Story X.Y verified ✅
- Test coverage plan complete (N tests) ✅
- [Any specific corrections made or notes]

**Approved by:** [Agent Name] (Architect)
```

---

## Example: Story 1.3 Corrections (2025-10-20)

**Issue Found:** Story 1.3 Dev Notes assumed arrays (`science_practices[]`) instead of single objects (`sep.name`)

**Corrections Made:**
- Updated `scoreCompatibility()` code (lines 112-165) to use binary matching
- Changed from array filtering to single-object property access
- Clarified AC-7.4 to specify binary matching semantics
- Added ADR-001 reference in Dev Notes

**Approval Note:**
```markdown
**Approval Note (2025-10-20):**
Corrected Dev Notes (lines 112-165) to use correct data structure from ADR-001.
Changed from incorrect array-based scoring (`science_practices[]`,
`crosscutting_concepts[]`, `disciplinary_core_ideas[]`) to correct binary matching
using single objects (`sep.name`, `ccc.name`, `dci.name`). AC-7.4 clarified to specify
binary matching semantics. Story now safe for implementation.

**Approved by:** Winston (Architect)
```

---

## Red Flags (Reject Story if Found)

🚨 **STOP and fix before approval:**

- Story assumes array fields that don't exist in data
- Dev Notes contradict ADR decisions
- Code examples use deprecated or incorrect patterns
- Acceptance criteria not testable
- No data validation plan for data-dependent stories
- Breaking changes proposed without migration plan

---

## Process Improvement Notes

**Root Cause Analysis:** Story 1.3 was created before ADR-001 was written (or wasn't updated after ADR-001).

**Prevention Measures:**
1. Always create ADRs before stories when architectural decisions are needed
2. Review all existing draft stories when new ADRs are created
3. Use this checklist before every approval
4. Reference pattern stories (1.1, 1.2) for consistency

**Story Creation Workflow:**
1. ADR created first (if architectural decision needed)
2. Tech Spec updated to reflect ADR
3. Stories written using Tech Spec + ADR
4. Stories validated with this checklist
5. Stories marked "Approved" only after validation

---

**Last Updated:** 2025-10-20
**Owner:** Architect (Winston)
**Related Docs:** [ADR-001](adr/001-use-single-object-3d-framework-structure.md), [Tech Spec](tech-spec-mini-epic.md)
