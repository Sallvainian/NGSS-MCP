# Story E1-S1: PDF Extraction Pipeline

**Status:** Draft
**Epic:** E1 - Data Structuring & Validation
**Points:** 3
**Priority:** P0
**Dependencies:** None (starting point)

## Story

As a **Standards Aligner Agent** (TeachFlow infrastructure agent),
I want **a reliable PDF extraction pipeline that accurately extracts NGSS standards data from PDF files**,
so that **I can provide complete and accurate 3D framework data to TeachFlow agents without manual data entry**.

## Acceptance Criteria

1. [ ] Extract text from NGSS MS PDFs for all 3 domains (LS, PS, ESS)
   - Source: `/home/sallvain/dev/personal/BMAD-Education-Module/docs/Middle School By Topic NGSS.pdf`
2. [ ] Parse standard codes (e.g., "MS-LS1-6") with 100% accuracy
   - Regex validation: `/^MS-[A-Z]{2,3}\d+-\d+$/`
3. [ ] Extract performance expectation text completely
   - No truncation or missing sentences
4. [ ] Identify and extract SEP, DCI, CCC component references
   - Each standard must have exactly 1 of each dimension
5. [ ] Handle PDF formatting variations gracefully
   - Multi-column layouts, page breaks, headers/footers
6. [ ] Output raw extracted data in structured format (JSON or intermediate)
   - Schema: `{ code, performance_expectation, sep_ref, dci_ref, ccc_ref, domain, topic }`
7. [ ] Manual validation: 10 randomly selected standards match PDF exactly
   - Compare extracted vs. source PDF for accuracy

## Tasks / Subtasks

- [ ] **Task 1: Set up PDF extraction environment** (AC: 1)
  - [ ] Research PDF extraction libraries (pdf-parse, pdf2json, pdfplumber via Python bridge)
  - [ ] Install chosen library (pdf-parse recommended for Node.js)
  - [ ] Test basic PDF loading with sample page
  - [ ] Verify text extraction quality (check for garbled text)

- [ ] **Task 2: Implement standard code parser** (AC: 2)
  - [ ] Create regex pattern for MS standard codes: `/MS-[A-Z]{2,3}\d+-\d+/g`
  - [ ] Extract all standard codes from PDF text
  - [ ] Validate extracted codes against expected format
  - [ ] Deduplicate codes (standards may appear multiple times)

- [ ] **Task 3: Extract performance expectations** (AC: 3)
  - [ ] Identify PE text blocks (typically follow standard code)
  - [ ] Handle multi-line PEs (paragraphs spanning lines)
  - [ ] Clean extracted text (remove extra whitespace, line breaks)
  - [ ] Associate each PE with its standard code

- [ ] **Task 4: Extract 3D component references** (AC: 4)
  - [ ] Parse SEP references (e.g., "SEP-6: Constructing Explanations")
  - [ ] Parse DCI references (e.g., "LS1.C: Organization for Matter and Energy")
  - [ ] Parse CCC references (e.g., "CCC-5: Energy and Matter")
  - [ ] Map component references to standard codes

- [ ] **Task 5: Extract domain and topic metadata** (AC: 1, 6)
  - [ ] Identify domain from section headers or standard prefix
  - [ ] Extract topic/theme text (e.g., "From Molecules to Organisms")
  - [ ] Associate domain and topic with standards

- [ ] **Task 6: Output structured JSON** (AC: 6)
  - [ ] Create intermediate data structure for extracted standards
  - [ ] Convert to JSON format with proper schema
  - [ ] Write to file: `data/raw-extracted-standards.json`
  - [ ] Validate JSON is parseable and well-formed

- [ ] **Task 7: Manual validation** (AC: 7)
  - [ ] Randomly select 10 standards from extracted data
  - [ ] Compare each field against source PDF manually
  - [ ] Document discrepancies if any
  - [ ] Adjust extraction logic if needed and re-run

## Dev Notes

### Source Data Location
- **PDF File:** `/home/sallvain/dev/personal/BMAD-Education-Module/docs/Middle School By Topic NGSS.pdf`
- **Size:** 3.8MB (3,772,112 bytes)
- **Additional References:**
  - DCI details: `/home/sallvain/dev/personal/BMAD-Education-Module/docs/DCI Arrangements of the Next Generation Science Standards.pdf`
  - Front matter: `/home/sallvain/dev/personal/BMAD-Education-Module/docs/Final Release NGSS Front Matter - 6.17.13 Update.pdf`

### Technical Approach

**Library Selection: pdf-parse**
- Rationale: Pure JavaScript, no external dependencies, good for Node.js
- Install: `npm install pdf-parse`
- Alternative: pdf2json (if pdf-parse struggles with layout)

**Extraction Strategy:**
1. Load entire PDF into memory
2. Extract full text as single string
3. Use regex patterns to identify structure
4. Parse line-by-line to associate codes → content
5. Handle multi-column by detecting page breaks

**PDF Structure Assumptions:**
- Standard codes appear before their performance expectations
- Each domain has clear section headers
- 3D components listed near or within PE descriptions
- May need manual adjustment for edge cases

**Known Challenges:**
- Multi-column layouts may scramble reading order
- Headers/footers may interfere with text extraction
- Some PDFs have standards as images (OCR needed if this occurs)
- Component references may be abbreviated or inconsistent

**Mitigation:**
- Test extraction on first page only initially
- Compare against known standard (MS-LS1-6 is in memory)
- If text quality poor, consider Python pdfplumber bridge
- Be prepared for 10-20% manual correction rate

### Project Structure Notes

**Files to Create:**
- `scripts/extract-pdf.ts` - Main extraction script
- `data/raw-extracted-standards.json` - Output file
- `scripts/validation-report.md` - Manual validation results

**Alignment with Architecture:**
- Output schema matches `Standard` interface partially (missing full 3D details)
- This story produces raw data for E1-S2 (Data Model & Validation)
- No MCP server code involved yet (Epic 2)

### References

- [Source: Epics.md#E1-S1: PDF Extraction Pipeline (Lines 42-66)]
- [Source: tech-spec.md#Data Model - Standard Interface (Lines 206-239)]
- [Source: tech-spec.md#Technology Stack - Project Structure (Lines 119-154)]
- [Source: NGSS-MCP project memory: ngss-mcp-project-context]
- [Source: NGSS PDF files in BMAD-Education-Module/docs/]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by story-context workflow -->

### Agent Model Used

Claude 3.5 Sonnet (2024-10-22)

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story implementation -->

### File List

<!-- Will be added during implementation with actual files created -->

---

**Story Created:** 2025-10-15
**Created By:** SM Agent (create-story workflow)
**Next Step:** Review story with user, then run `story-ready` to approve for development
