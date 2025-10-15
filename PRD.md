# Product Requirements Document: NGSS MCP Server

**Version:** 1.0
**Date:** 2025-10-15
**Project Level:** 2 (12-40 stories, 2-5 epics)
**Status:** Planning
**Owner:** PM

---

## Executive Summary

Build a Model Context Protocol (MCP) server that provides token-efficient access to Next Generation Science Standards (NGSS) data for the TeachFlow education module. The server will reduce token consumption by 95% (from 7,500 to 350 tokens per lookup) by providing targeted data retrieval through 5 specialized tools instead of requiring agents to load entire JSON files.

**Core Value Proposition:** Enable TeachFlow AI agents to access NGSS standards data efficiently without wasting tokens on irrelevant information, while maintaining complete 3D Learning Framework integrity (Science & Engineering Practices, Disciplinary Core Ideas, Crosscutting Concepts).

---

## Problem Statement

### Current Challenge

TeachFlow education module agents need frequent access to NGSS standards data to:
- Align lesson plans with educational standards
- Provide 3D learning scope for student tutoring
- Validate instructional design against standards framework

**Without MCP Server:**
- Agents must load entire NGSS JSON files (hundreds of standards)
- Each lookup costs 5K-10K tokens
- Repeated lookups across agent conversations waste significant tokens
- No intelligent search capabilities (exact code matching only)

**Token Impact Example:**
- Student asks: "What's my lesson's driving question?"
- Agent needs to find matching standard
- Current approach: Load entire MS Life Science JSON (7,500 tokens)
- Get one standard back (350 tokens of actual data)
- **Waste: 7,150 tokens (95% inefficiency)**

### User Impact

**Primary Users:** TeachFlow AI Agents
1. **Standards Aligner Agent** - Needs fast 3D component lookups
2. **Instructional Designer Agent** - Requires domain browsing and standard details
3. **Alpha (Student Support)** - Must match student's driving question to standard

**User Pain Points:**
- Slow response times due to token processing overhead
- Limited conversation history due to context window consumption
- Cannot perform fuzzy matching (students rarely remember exact driving question phrasing)
- No keyword-based discovery for lesson planning

---

## Goals and Success Metrics

### Primary Goals

1. **Token Efficiency:** Achieve 95% token reduction for standards lookups
   - Target: 350 tokens per lookup (vs 7,500 current)
   - Success: Average <500 tokens per tool call

2. **Fast Retrieval:** Sub-second response times for standard lookups
   - Target: <1s for get_standard(), <2s for fuzzy matching
   - Success: 95th percentile <3s across all tools

3. **High Match Accuracy:** Reliable fuzzy matching for driving questions
   - Target: 95% successful match rate for student questions
   - Success: Students find their lesson standard on first try

4. **Complete 3D Framework:** Every standard includes SEP, DCI, CCC
   - Target: 100% of standards have all 3 dimensions
   - Success: Zero incomplete standards in database

5. **Scalable Architecture:** Easy to extend to other grade levels/subjects
   - Target: Add new grade level in <4 hours
   - Success: Clear extension patterns documented

### Secondary Goals

- Developer-friendly tool interface for TeachFlow agents
- Comprehensive error handling and validation
- Well-documented data structure for future maintenance
- Test coverage >90% for core functionality

---

## User Personas

### Persona 1: Standards Aligner Agent (Critical Infrastructure)

**Role:** 3D Learning Intelligence Hub
**Needs:** Fast, accurate access to complete 3D breakdown of any standard
**Primary Tools:** get_standard(), get_3d_components(), find_by_driving_question()

**User Journey:**
1. Instructional Designer requests lesson plan for "MS-LS1-6"
2. Standards Aligner calls get_standard("MS-LS1-6")
3. Receives complete SEP/DCI/CCC breakdown in <1 second
4. Provides 3D framework to Instructional Designer
5. **Success:** Designer has scope boundaries for lesson planning

**Pain Points Addressed:**
- No more loading entire domain files
- Instant access to 3D components
- Clear scope boundaries (depth_boundaries field)

### Persona 2: Alpha - Student Support Agent

**Role:** One-on-one student tutoring within lesson scope
**Needs:** Match student's rough driving question to exact standard
**Primary Tools:** find_by_driving_question()

**User Journey:**
1. Student says: "I think it's about how plants get their food or something"
2. Alpha calls find_by_driving_question("how plants get food")
3. Fuzzy matching returns MS-LS1-6 (photosynthesis)
4. Alpha retrieves 3D scope and teaches within boundaries
5. **Success:** Student gets on-topic help without going beyond lesson scope

**Pain Points Addressed:**
- Fuzzy matching handles imprecise student memory
- No manual searching through standards lists
- Instant scope establishment for tutoring session

### Persona 3: Instructional Designer Agent

**Role:** Lesson plan creation and curriculum design
**Needs:** Browse available standards by domain, search by keywords
**Primary Tools:** search_by_domain(), search_standards()

**User Journey:**
1. Designer wants to create unit on "Energy in ecosystems"
2. Calls search_standards("energy ecosystem", {domain: "Life Science"})
3. Gets list of relevant MS Life Science standards
4. Explores each with get_standard() for full details
5. Delegates to Standards Aligner for 3D framework integration
6. **Success:** Complete unit plan aligned to multiple standards

**Pain Points Addressed:**
- Keyword-based discovery (not just code lookup)
- Domain filtering for relevant browsing
- Progressive disclosure (list → details)

---

## Feature Requirements

### Feature 1: Standard Lookup by Code

**Tool:** `get_standard(code: string)`

**Description:** Retrieve complete standard details by NGSS code (e.g., "MS-LS1-6")

**Input:**
- `code`: NGSS standard code (format: "XX-YYN-N")

**Output:**
```typescript
{
  code: string
  grade_level: string
  domain: string
  topic: string
  performance_expectation: string
  sep: { code, name, description }
  dci: { code, name, description }
  ccc: { code, name, description }
  driving_questions: string[]
  keywords: string[]
  lesson_scope: {
    key_concepts: string[]
    prerequisite_knowledge: string[]
    common_misconceptions: string[]
    depth_boundaries: { include: string[], exclude: string[] }
  }
}
```

**Acceptance Criteria:**
- Returns complete standard in <1 second
- Includes all 3 dimensions (SEP, DCI, CCC)
- Provides lesson scope guidance
- Returns error for invalid codes
- Token cost <400 tokens

### Feature 2: Domain Browsing

**Tool:** `search_by_domain(domain: string, grade_level: string)`

**Description:** List all standards in a domain and grade level

**Input:**
- `domain`: "Life Science" | "Physical Science" | "Earth and Space Science"
- `grade_level`: "MS" (future: "ES", "HS")

**Output:**
```typescript
{
  domain: string
  grade_level: string
  count: number
  standards: Array<{
    code: string
    topic: string
    performance_expectation: string
  }>
}
```

**Acceptance Criteria:**
- Returns all matching standards
- Sorted by code (e.g., MS-LS1-1, MS-LS1-2, ...)
- Summary format (not full details)
- Performance <2 seconds for any domain
- Token cost <1000 tokens for full domain

### Feature 3: Fuzzy Driving Question Matching

**Tool:** `find_by_driving_question(question: string)`

**Description:** Match student's imprecise driving question to exact standard using fuzzy matching

**Input:**
- `question`: Student's remembered driving question (e.g., "how plants get energy")

**Output:**
```typescript
{
  matched: boolean
  confidence: number  // 0.0 - 1.0
  standard: {
    code: string
    driving_questions: string[]  // Official DQs
    matched_question: string     // Which official DQ matched
    // ... full standard details
  }
}
```

**Acceptance Criteria:**
- Levenshtein distance algorithm for fuzzy matching
- Confidence threshold: 0.7 minimum
- Returns best match above threshold
- Performance <2 seconds
- Handles typos, word order variations, partial matches
- 95% success rate on test set of student questions
- Token cost <500 tokens

**Critical Feature:** This is the primary entry point for student support. Must be highly reliable.

### Feature 4: 3D Component Quick Lookup

**Tool:** `get_3d_components(code: string)`

**Description:** Lightweight endpoint for just SEP/DCI/CCC breakdown

**Input:**
- `code`: NGSS standard code

**Output:**
```typescript
{
  code: string
  sep: { code, name }
  dci: { code, name }
  ccc: { code, name }
}
```

**Acceptance Criteria:**
- Minimal response (no descriptions, lesson scope, etc.)
- Performance <500ms
- Token cost <200 tokens
- Used for quick scope checks

### Feature 5: Keyword Search

**Tool:** `search_standards(query: string, filters?: { domain?: string, grade_level?: string })`

**Description:** Full-text search across standards with optional filtering

**Input:**
- `query`: Search terms (e.g., "photosynthesis", "energy flow")
- `filters`: Optional domain and grade level filters

**Output:**
```typescript
{
  query: string
  count: number
  standards: Array<{
    code: string
    topic: string
    performance_expectation: string
    relevance_score: number
  }>
}
```

**Acceptance Criteria:**
- Searches performance expectations, key concepts, keywords
- Relevance scoring (TF-IDF or similar)
- Results sorted by relevance
- Performance <3 seconds
- Token cost <1500 tokens for 10+ results

---

## Data Requirements

### Source Data

**Provider:** User (Frank, middle school science teacher)
**Format:** NGSS PDFs from nextgenscience.org
**Scope:** Middle School (grades 6-8)
**Domains:**
- MS-LS: Life Science
- MS-PS: Physical Science
- MS-ESS: Earth and Space Science

**Expected Volume:** ~40-60 standards total across all MS domains

### Data Transformation Pipeline

**Epic:** Data Structuring (Epic 1)

**Requirements:**
1. PDF text extraction with high accuracy
2. Parse standard code, performance expectation, 3D components
3. Extract or create driving questions for each standard
4. Identify keywords for search indexing
5. Create lesson_scope metadata (key concepts, misconceptions, depth boundaries)
6. Validate completeness (all standards have all 3 dimensions)

**Quality Criteria:**
- 100% of standards successfully extracted
- Zero standards missing SEP, DCI, or CCC
- At least 2 driving questions per standard
- Manual validation of 10% sample

### Database Structure

**Format:** JSON file with dual indexes
**Location:** `data/ngss-ms-standards.json`

**Primary Index:** By code (O(1) lookup)
**Secondary Indexes:**
- By driving question (fuzzy matching)
- By keyword (full-text search)
- By domain (filtering)

**Schema:** See tech-spec.md for complete TypeScript interfaces

---

## Technical Constraints

### MCP Protocol Requirements

- Must conform to MCP SDK standards
- TypeScript implementation (MCP SDK supported)
- Tools must be stateless (no session management)
- Error responses must follow MCP error format

### Performance Constraints

- Tool response time: <3 seconds (95th percentile)
- Memory footprint: <100MB for data + server
- Startup time: <2 seconds
- Concurrent requests: Support 10+ simultaneous tool calls

### Integration Constraints

**Consumer:** TeachFlow module agents via MCP protocol
**No direct API:** Tools invoked through MCP client, not HTTP endpoints
**Data Coupling:** Changes to data schema require consumer updates

### Development Constraints

- TypeScript + Node.js
- No external databases (JSON file sufficient for MS scope)
- Minimal dependencies (MCP SDK + fuzzy matching library)
- Must be runnable locally for development

---

## Epic Overview

### Epic 1: Data Structuring & Validation (4-6 stories)

Transform NGSS PDFs into structured JSON database with complete 3D framework coverage and validation.

**Key Stories:**
- PDF extraction pipeline
- Standard parsing and validation
- Driving question extraction/creation
- Keyword identification and indexing
- Lesson scope metadata creation
- Data quality validation

### Epic 2: MCP Server Core (2-3 stories)

Set up MCP server scaffold with proper tool registration and error handling.

**Key Stories:**
- MCP server initialization
- Tool registration framework
- Error handling and validation
- Server configuration and startup

### Epic 3: Lookup & Search Tools (4-6 stories)

Implement the 5 MCP tools with proper indexing and search algorithms.

**Key Stories:**
- get_standard() implementation
- search_by_domain() with filtering
- Fuzzy matching algorithm for find_by_driving_question()
- get_3d_components() lightweight endpoint
- search_standards() full-text search
- Index optimization

### Epic 4: Testing & Documentation (3-5 stories)

Comprehensive testing and developer documentation for TeachFlow integration.

**Key Stories:**
- Unit tests for all tools
- Integration tests with MCP client
- Fuzzy matching accuracy testing
- Performance benchmarking
- Developer documentation
- TeachFlow integration guide

**Total Estimated Stories:** 13-20 stories across 4 epics (solidly Level 2)

---

## Success Criteria

### Must Have (MVP)

- ✅ All 5 MCP tools implemented and functional
- ✅ Complete MS NGSS data (all domains)
- ✅ 100% of standards include SEP, DCI, CCC
- ✅ Fuzzy matching achieves 90%+ accuracy on test set
- ✅ Token efficiency: <500 tokens per tool call average
- ✅ Response time: <3 seconds (95th percentile)
- ✅ Test coverage: >80% for core functionality

### Should Have (Post-MVP)

- 📋 Caching for frequently accessed standards
- 📋 Performance metrics/logging
- 📋 Tool usage analytics
- 📋 Extended driving question database

### Could Have (Future Enhancements)

- 💡 Support for Elementary and High School levels
- 💡 Common Core Math standards
- 💡 State-specific standards extensions
- 💡 GraphQL query interface
- 💡 Standards relationship mapping

---

## Risk Assessment

### High Risks

**Risk:** PDF extraction accuracy for 3D components
**Impact:** Incomplete or incorrect standards data
**Mitigation:** Manual validation of extracted data, fallback to manual entry

**Risk:** Fuzzy matching false positives
**Impact:** Students matched to wrong lesson scope
**Mitigation:** Confidence threshold tuning, multiple DQ options per standard, manual testing with real student questions

### Medium Risks

**Risk:** Performance degradation with full dataset
**Impact:** >3 second response times
**Mitigation:** Index optimization, profiling, caching strategy

**Risk:** MCP SDK API changes
**Impact:** Server breaks with SDK updates
**Mitigation:** Pin SDK version, monitor changelogs

### Low Risks

**Risk:** Data schema changes requiring consumer updates
**Impact:** TeachFlow agents need updates
**Mitigation:** Version API responses, backward compatibility

---

## Timeline & Dependencies

### Dependencies

**Blocking:**
- User provides NGSS PDFs for all MS domains
- MCP SDK TypeScript setup

**Non-Blocking:**
- TeachFlow module development (parallel tracks)
- Final driving question phrasing decisions

### Estimated Timeline

**Total Development:** 12-18 hours

**Epic 1 (Data):** 4-6 hours
**Epic 2 (Core):** 2-3 hours
**Epic 3 (Tools):** 4-6 hours
**Epic 4 (Testing):** 2-3 hours

**Calendar Time:** Depends on user availability for data provision and story approval

---

## Appendix: 3D Learning Framework Reference

### Science & Engineering Practices (SEP) - 8 Practices

The scientific and engineering skills students use:
1. Asking Questions and Defining Problems
2. Developing and Using Models
3. Planning and Carrying Out Investigations
4. Analyzing and Interpreting Data
5. Using Mathematics and Computational Thinking
6. Constructing Explanations and Designing Solutions
7. Engaging in Argument from Evidence
8. Obtaining, Evaluating, and Communicating Information

### Disciplinary Core Ideas (DCI) - 4 Domains

The key science content students learn:
- **LS**: Life Science (organisms, ecosystems, heredity, evolution)
- **PS**: Physical Science (matter, energy, forces, waves)
- **ESS**: Earth and Space Science (Earth systems, space, climate)
- **ETS**: Engineering, Technology, and Science Applications

### Crosscutting Concepts (CCC) - 7 Concepts

The thinking patterns that connect across disciplines:
1. Patterns
2. Cause and Effect
3. Scale, Proportion, and Quantity
4. Systems and System Models
5. Energy and Matter
6. Structure and Function
7. Stability and Change

---

**Document Status:** Approved for Epic breakdown (Epics.md next)
