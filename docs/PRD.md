# NGSS-MCP Optimization Product Requirements Document (PRD)

**Author:** Frank
**Date:** 2025-10-17
**Project Level:** 2 (Optimization & Enhancement)
**Project Type:** Backend/API Service (MCP Server)
**Target Scale:** Medium-scope optimization project (2-3 epics, 10 stories)

---

## Description, Context and Goals

### Current State

The NGSS-MCP server is **fully functional** with all 4 tools implemented:
- ✅ `get_standard` - Direct lookup by code
- ✅ `search_by_domain` - Domain filtering
- ✅ `get_3d_components` - Framework components lookup
- ✅ `search_standards` - Full-text search

**Current Performance:**
- **Data:** 106KB JSON file with MS standards
- **Indexing:** Multi-index database (code, domain, keyword, full-text)
- **Caching:** 100-entry LRU cache, 5min TTL
- **Response Size:** 2-3KB per standard (full objects returned)
- **Fuzzy Matching:** O(n×m) brute-force Levenshtein distance

### Deployment Intent

**Optimization Focus:** Enhance existing production MCP server for better performance, token efficiency, and search quality without breaking existing integrations.

**Production Constraint:** Server is already in use by TeachFlow agents - must maintain backward compatibility.

### Context

**Origin:** Emerged from BMAD-Education-Module TeachFlow project requirements for efficient NGSS standards lookup.

**Consumer:** TeachFlow AI agents need fast, token-efficient access to NGSS standards for lesson planning and alignment.

**Token Efficiency Gap:** Current implementation returns full standard objects (~2-3KB), missing the **95% token reduction target** (7,500 → 350 tokens).

**Performance Gap:** Fuzzy matching performs O(n×m) Levenshtein calculations on every query, creating latency on complex searches.

### Goals

**Primary Objectives:**

1. **Token Efficiency** - Achieve 95% token reduction target through response optimization
2. **Performance** - 10-50x faster full-text search through optimized indexing
3. **Search Quality** - Better search relevance with ranked results
4. **Maintainability** - Clear optimization metrics and performance monitoring

**Success Metrics:**

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Average response size | 2-3KB | 300-500 bytes | Token count per lookup |
| Fuzzy search latency | 50-200ms | 5-20ms | P95 query time |
| Cache hit rate | Unknown | 70%+ | Cache metrics tracking |
| Relevance accuracy | ~80% | 90%+ | Manual validation sample |

## Requirements

### Functional Requirements

**FR-1: Response Size Optimization**
- **FR-1.1:** Add configurable detail levels: `minimal`, `summary`, `full`
- **FR-1.2:** Default to `summary` mode (PE truncated, keywords limited)
- **FR-1.3:** Implement pagination for multi-result queries
- **FR-1.4:** Token counting instrumentation for all responses

**FR-2: Performance Enhancement**
- **FR-2.1:** Optimize full-text search indexing for search_standards tool
- **FR-2.2:** Implement query complexity scoring and optimization routing
- **FR-2.3:** Add result ranking by relevance score for multi-result tools
- **FR-2.4:** Performance benchmarking and regression detection

**FR-3: Cache Strategy**
- **FR-3.1:** Increase cache size to 500 entries with smart eviction
- **FR-3.2:** Add cache warming for common queries
- **FR-3.3:** Track and expose cache hit rate metrics
- **FR-3.4:** Implement query normalization for better cache hits

**FR-4: Monitoring & Metrics**
- **FR-4.1:** Expose performance metrics endpoint (query times, cache stats)
- **FR-4.2:** Add query complexity scoring
- **FR-4.3:** Track token usage per query type
- **FR-4.4:** Performance regression detection

### Non-Functional Requirements

**NFR-1: Backward Compatibility**
- All existing tool signatures remain unchanged
- Default behavior maintains current response structure
- New features opt-in via optional parameters

**NFR-2: Performance**
- P95 latency < 50ms for all cached queries
- P95 latency < 100ms for fuzzy searches
- Startup time < 500ms (index loading)

**NFR-3: Token Efficiency**
- 95% token reduction for summary mode responses
- Configurable truncation with no data loss (full mode available)

**NFR-4: Maintainability**
- Performance metrics accessible via MCP tool
- Clear optimization documentation
- Benchmark suite for regression detection

## User Journeys

### Journey 1: TeachFlow Lesson Planning Agent

**Actor:** TeachFlow AI Agent

**Scenario:** Agent needs to align lesson plan to NGSS standards

**Current Experience:**
1. Agent queries `search_standards("energy transfer ecosystems")`
2. Receives 10 full standard objects (25KB total)
3. Uses 7,500 tokens to process response
4. Extracts relevant standards codes for alignment

**Optimized Experience:**
1. Agent queries with `detail_level: "summary"`
2. Receives 10 summary objects (2.5KB total)
3. Uses 750 tokens to process response **(90% reduction)**
4. Optionally fetches full details for 2-3 most relevant standards
5. **Total token usage: ~1,200 tokens (84% reduction)**


## UX Design Principles

**For AI Consumers (MCP Tool Users):**

1. **Token Consciousness** - Default to minimal necessary data, allow opt-in for full details
2. **Progressive Disclosure** - Summary → Full detail workflow for multi-result queries
3. **Performance Transparency** - Expose performance metrics for optimization decisions
4. **Graceful Degradation** - Cache misses still perform well, no cliff drops
5. **Backward Compatible** - Existing integrations work unchanged

## Epics

### Epic 1: Token Efficiency & Response Optimization (5 stories, 16 pts)

**Goal:** Achieve 95% token reduction through configurable response levels and pagination.

**Stories:**

1. **E1-S1: Response Detail Levels** (5 pts)
   - Add `detail_level` parameter to all tools (`minimal`, `summary`, `full`)
   - Implement truncation logic for PE text and arrays
   - Add token counting instrumentation
   - **Acceptance:** 90% token reduction for `summary` mode

2. **E1-S2: Pagination Support** (3 pts)
   - Add `offset` and `limit` parameters to search tools
   - Implement cursor-based pagination for large result sets
   - **Acceptance:** Handle 100+ results efficiently

3. **E1-S3: Smart Field Selection** (3 pts)
   - Allow callers to specify which fields to include
   - Optimize defaults per tool type
   - **Acceptance:** Configurable field selection working

4. **E1-S4: Token Usage Tracking** (3 pts)
   - Add token counting to all responses
   - Expose token metrics via performance tool
   - **Acceptance:** Track token usage per query type

5. **E1-S5: Response Optimization Validation** (2 pts)
   - Create benchmark suite for token measurements
   - Validate 95% reduction target achieved
   - Document optimization patterns
   - **Acceptance:** Benchmarks confirm targets met

### Epic 2: Search Optimization & Quality (2 stories, 4 pts) [REVISED SCOPE]

**Goal:** Improved search relevance and performance for search_standards tool.

**Epic Scope Change:** Original Epic 2 (4 stories, 14 pts) focused on optimizing find_by_driving_question tool which was based on incorrect NGSS data model understanding. Revised Epic 2 (2 stories, 4 pts) salvages applicable patterns for remaining search tools.

**Stories:**

1. **E2-S1: Query Complexity Routing** (2 pts) [REVISED]
   - Add query complexity scoring (simple/medium/complex)
   - Simple: exact code/keyword lookup → fast path
   - Medium: single-term search → index lookup
   - Complex: multi-term search → full-text search
   - Automatic routing based on query characteristics
   - **Acceptance:** Simple queries <5ms, complex queries <50ms

2. **E2-S2: Result Ranking** (2 pts) [REVISED]
   - Implement multi-factor relevance scoring
   - Combine keyword overlap + domain relevance + text similarity
   - Include match confidence score in all search results
   - Sort by relevance score (highest first)
   - **Acceptance:** Manual review of 20 queries shows improved ordering

**Removed Stories:**
- **~~E2-S1: N-gram Indexing~~ (5 pts) - DEPRECATED** - Built for find_by_driving_question tool which doesn't exist
- **~~E2-S2: Optimized Fuzzy Matcher~~ (5 pts) - DEPRECATED** - Fuzzy matching built for non-existent driving questions

### Epic 3: Caching & Monitoring (3 stories, 8 pts)

**Goal:** Intelligent caching and performance visibility.

**Stories:**

1. **E3-S1: Enhanced Cache Strategy** (3 pts)
   - Increase cache size to 500 entries
   - Implement LRU with frequency tracking
   - Add query normalization for better hits
   - **Acceptance:** 70%+ cache hit rate

2. **E3-S2: Cache Warming** (2 pts)
   - Pre-populate cache with common queries
   - Periodic cache refresh strategy
   - **Acceptance:** Common queries always cached

3. **E3-S3: Performance Metrics Tool** (3 pts)
   - Add MCP tool to expose performance metrics
   - Include query times, cache stats, token usage
   - **Acceptance:** Metrics accessible via MCP

### Epic Summary

| Epic | Stories | Points | Focus Area |
|------|---------|--------|------------|
| E1: Token Efficiency | 5 | 16 | Response optimization, pagination |
| E2: Search Optimization | 2 | 4 | Query routing, result ranking |
| E3: Caching | 3 | 8 | Cache strategy, monitoring |
| **Total** | **10** | **28** | **Complete optimization** |

**Note:** Epic structure optimized for incremental delivery. E1 can deliver independently, E2 builds on E1 optimizations, E3 provides visibility layer.

## Out of Scope

**Explicitly NOT included in this optimization:**

1. **Additional Tools** - No new MCP tools beyond the existing 4
2. **Data Expansion** - Focus on MS standards only, no HS/ES additions
3. **Grade Level Support** - Middle school only (current scope)
4. **PDF Re-extraction** - Use existing 106KB data file
5. **Server Rewrite** - Optimize existing TypeScript implementation
6. **Breaking Changes** - All changes backward compatible

**Future Considerations (Post-Optimization):**

- High school NGSS standards support
- Elementary science standards
- Cross-grade alignment tools
- PDF re-extraction with improved accuracy

---

## Next Steps

**Immediate Actions:**

1. **Review & Approve PRD** - Validate optimization priorities with stakeholders
2. **Generate Epic Stories** - Detailed story breakdown with acceptance criteria
3. **Benchmark Current State** - Establish baseline metrics before optimization
4. **Phase 4: Implementation** - Begin Epic 1 (Token Efficiency)

**Recommended Implementation Order:**

1. **Phase 1:** Epic 1 (Token Efficiency) - Immediate token reduction wins
2. **Phase 2:** Epic 2 (Performance) - Search quality and speed improvements
3. **Phase 3:** Epic 3 (Caching/Monitoring) - Observability and optimization validation

**Architecture Review:** Level 2 projects skip Phase 3 (Solutioning), proceed directly to implementation.

## Document Status

- [x] Goals and context validated with stakeholder (Frank)
- [x] Current state analysis complete (code review)
- [x] Optimization opportunities identified (4 focus areas)
- [x] Epic structure approved for phased delivery
- [x] Ready for story breakdown

_Note: See technical-decisions.md for captured technical context_

---

_This PRD adapts to project level 2 - providing appropriate detail without overburden._
