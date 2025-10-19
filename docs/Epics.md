# NGSS-MCP Optimization - Epic Breakdown

**Author:** Frank
**Date:** 2025-10-17
**Project Level:** 2 (Optimization & Enhancement)
**Target Scale:** 12 stories across 3 epics (38 total points)

---

## Epic Overview

| Epic | Goal | Stories | Points | Dependencies |
|------|------|---------|--------|--------------|
| **E1: Token Efficiency** | Achieve 95% token reduction through configurable responses | 5 | 16 | None |
| **E2: Search Optimization** | Improved search quality and query routing | 2 | 4 | E1 (optional) |
| **E3: Caching & Monitoring** | Intelligent caching + performance visibility | 3 | 8 | E1, E2 |

**Implementation Strategy:** Incremental delivery - each epic delivers independently, later epics enhance earlier work.

**Success Metrics:**
- Average response size: 2-3KB → 300-500 bytes (**90% reduction**)
- Fuzzy search P95: 50-200ms → 5-20ms (**10x faster**)
- Cache hit rate: Unknown → 70%+

---

## Epic 1: Token Efficiency & Response Optimization

**Epic Goal:** Achieve 95% token reduction target through configurable detail levels, smart field selection, and pagination.

**Business Value:** TeachFlow agents can perform 10x more standard lookups within same token budget, enabling richer lesson planning.

**Technical Approach:** Add opt-in response optimization while maintaining backward compatibility with existing consumers.

### E1-S1: Response Detail Levels (5 pts)

**User Story:** As a TeachFlow agent, I want configurable response detail levels so that I can minimize token usage for bulk operations.

**Acceptance Criteria:**
1. [ ] Add `detail_level` parameter to all 5 MCP tools (`minimal`, `summary`, `full`)
2. [ ] Default behavior unchanged (`full` mode) for backward compatibility
3. [ ] `minimal` mode: code, topic, truncated PE (50 chars)
4. [ ] `summary` mode: code, topic, PE (150 chars), top 3 keywords
5. [ ] `full` mode: complete standard object (current behavior)
6. [ ] Token counting instrumentation added to all responses
7. [ ] Validation: `summary` mode achieves 85-90% token reduction vs `full`

**Implementation Notes:**
- Update all tool schemas to accept `detail_level` parameter
- Create response formatters for each detail level
- Add unit tests for each level on all tools
- Measure token counts before/after

**Files to Modify:**
- `src/server/index.ts` - Add parameter to all tool definitions
- `src/server/response-formatter.ts` (new) - Detail level logic
- `src/types/ngss.ts` - Add DetailLevel type

---

### E1-S2: Pagination Support (3 pts)

**User Story:** As a TeachFlow agent, I want paginated search results so that I can efficiently handle large result sets without token overflow.

**Acceptance Criteria:**
1. [ ] Add `offset` and `limit` parameters to search tools (search_by_domain, search_standards)
2. [ ] Default limit: 10 results (current behavior)
3. [ ] Maximum limit: 50 results per query
4. [ ] Return pagination metadata: `{ total, offset, limit, hasMore }`
5. [ ] Cursor-based pagination for consistency across pages
6. [ ] Validation: Can paginate through 100+ results efficiently

**Implementation Notes:**
- Modify search result sorting to support stable pagination
- Add pagination metadata to response objects
- Handle edge cases (offset > total, negative values)

**Files to Modify:**
- `src/server/index.ts` - Add pagination parameters
- `src/server/database.ts` - Update search methods with pagination

---

### E1-S3: Smart Field Selection (3 pts)

**User Story:** As a TeachFlow agent, I want to specify which fields I need so that I can minimize response size for specific use cases.

**Acceptance Criteria:**
1. [ ] Add `fields` parameter accepting array of field names
2. [ ] Support field shortcuts: `basic` (code, topic), `3d-only` (SEP/DCI/CCC), `search` (PE, keywords)
3. [ ] Compatible with `detail_level` parameter (intersection of both)
4. [ ] Invalid field names return clear error message
5. [ ] Validation: `fields: ["code", "topic"]` returns 95% smaller response

**Implementation Notes:**
- Create field filter function
- Define field shortcut mappings
- Add input validation for field names
- Document common field combinations

**Files to Modify:**
- `src/server/index.ts` - Add fields parameter
- `src/server/response-formatter.ts` - Field filtering logic

---

### E1-S4: Token Usage Tracking (3 pts)

**User Story:** As a developer, I want to track token usage per query type so that I can validate optimization goals and detect regressions.

**Acceptance Criteria:**
1. [ ] Implement token counter (approximate, based on character count)
2. [ ] Track tokens per query type and detail level
3. [ ] Store metrics in database instance
4. [ ] Add `getTokenMetrics()` method to database class
5. [ ] Metrics include: avg tokens per tool, by detail level, percentiles
6. [ ] Validation: Metrics show expected reductions for optimized queries

**Implementation Notes:**
- Token approximation: `chars / 4` (GPT tokenization estimate)
- Track both request and response tokens
- Rolling window metrics (last 1000 queries)

**Files to Modify:**
- `src/server/database.ts` - Add token tracking
- `src/server/token-counter.ts` (new) - Token approximation logic

---

### E1-S5: Response Optimization Validation (2 pts)

**User Story:** As a developer, I want a benchmark suite to validate token reduction goals and prevent regressions.

**Acceptance Criteria:**
1. [ ] Create benchmark script measuring token usage across scenarios
2. [ ] Test all tools with all detail levels
3. [ ] Validate 95% reduction target for summary mode
4. [ ] Generate benchmark report with before/after comparisons
5. [ ] Add benchmarks to CI/test suite
6. [ ] Documentation: Token optimization guide

**Implementation Notes:**
- Use real NGSS data for benchmarks
- Test common query patterns from TeachFlow
- Automate benchmark runs

**Files to Create:**
- `scripts/benchmark-tokens.ts` - Benchmark suite
- `docs/token-optimization-guide.md` - Optimization patterns

---

## Epic 2: Search Optimization & Quality [REVISED SCOPE]

**Epic Goal:** Improve search quality and query routing for search_standards and search_by_domain tools.

**Business Value:** Better search relevance and optimized query execution for remaining search tools.

**Technical Approach:** Apply query routing patterns and multi-factor ranking to existing search capabilities.

**Epic Scope Change:** Original Epic 2 (4 stories, 14 pts) focused on optimizing find_by_driving_question tool which was based on incorrect NGSS data model understanding. Revised Epic 2 (2 stories, 4 pts) salvages applicable patterns for remaining search tools.

### E2-S1: Query Complexity Routing (2 pts) [REVISED]

**User Story:** As a system, I want to route queries to optimal execution paths so that simple queries stay fast and complex queries get necessary processing.

**Acceptance Criteria:**
1. [ ] Add query complexity scoring (simple/medium/complex)
2. [ ] Simple: exact code/keyword lookup → fast path
3. [ ] Medium: single-term search → index lookup
4. [ ] Complex: multi-term search → full-text search
5. [ ] Automatic routing based on query characteristics
6. [ ] Validation: Simple queries <5ms, complex queries <50ms

**Files to Modify:**
- `src/server/database.ts` - Add routing logic to search methods
- `src/server/query-router.ts` (new) - Complexity scoring

### E2-S2: Result Ranking (2 pts) [REVISED]

**User Story:** As a TeachFlow agent, I want results ranked by relevance so that I can quickly identify the best standard match.

**Acceptance Criteria:**
1. [ ] Multi-factor scoring: keyword overlap + domain relevance + text similarity
2. [ ] Weighted scoring formula tuned for NGSS standards
3. [ ] Include match confidence score in all search results
4. [ ] Sort by relevance score (highest first)
5. [ ] Validation: Manual review of 20 queries shows improved ordering

**Files to Modify:**
- `src/server/database.ts` - Update scoring in search methods
- `src/server/relevance-scorer.ts` (new) - Multi-factor ranking

### Removed Stories

**~~E2-S1: N-gram Indexing~~ (5 pts) - DEPRECATED**
- Reason: Built for find_by_driving_question tool which doesn't exist
- N-gram patterns may be repurposed for search_standards in future

**~~E2-S2: Optimized Fuzzy Matcher~~ (5 pts) - DEPRECATED**
- Reason: Levenshtein fuzzy matching built for non-existent driving questions
- Fuzzy matching concept may apply to search_standards keyword matching

**Epic 2 Impact Summary:**
- Original: 4 stories, 14 points
- Revised: 2 stories, 4 points
- Net reduction: 10 story points (71% reduction)

---

## Epic 3: Caching & Monitoring

**Epic Goal:** Intelligent caching strategy achieving 70%+ hit rate and performance visibility through metrics tools.

**Business Value:** Predictable low-latency performance, clear optimization feedback, production debugging capability.

**Technical Approach:** Enhanced LRU cache with warming, expose metrics via MCP tool.

### E3-S1: Enhanced Cache Strategy (3 pts)

**User Story:** As a system, I want intelligent caching so that common queries are served instantly from cache.

**Acceptance Criteria:**
1. [ ] Increase cache size from 100 to 500 entries
2. [ ] Implement LRU eviction with frequency tracking
3. [ ] Query normalization for better cache hits (lowercase, trim, punctuation)
4. [ ] Track cache hit rate, eviction rate, avg entry age
5. [ ] Achieve 70%+ cache hit rate in production use
6. [ ] Validation: Cache metrics show improvement over baseline

**Implementation Notes:**
- Use existing QueryCache class, enhance with frequency tracking
- Normalize queries before cache lookup
- Consider query parameter canonicalization

**Files to Modify:**
- `src/server/query-cache.ts` - Enhance with frequency tracking
- `src/server/database.ts` - Add query normalization

---

### E3-S2: Cache Warming (2 pts)

**User Story:** As a system, I want pre-populated cache on startup so that first queries for common patterns are fast.

**Acceptance Criteria:**
1. [ ] Identify top 20 most common query patterns
2. [ ] Pre-execute and cache during database initialization
3. [ ] Warming completes within startup budget (<500ms total)
4. [ ] Document cache warming strategy
5. [ ] Validation: Common queries always cache hits

**Implementation Notes:**
- Query patterns from TeachFlow usage logs
- Balance warming time vs coverage
- Periodic cache refresh for long-running servers

**Files to Modify:**
- `src/server/database.ts` - Add cache warming in constructor
- `src/server/common-queries.ts` (new) - Query patterns

---

### E3-S3: Performance Metrics Tool (3 pts)

**User Story:** As a developer/operator, I want to access performance metrics via MCP so that I can monitor and optimize the server.

**Acceptance Criteria:**
1. [ ] Add `get_performance_metrics` MCP tool
2. [ ] Expose: query times, cache stats, token usage, index sizes
3. [ ] Include percentiles (P50, P95, P99) for latencies
4. [ ] Return JSON with clear metric structure
5. [ ] Add optional `reset_metrics` parameter
6. [ ] Validation: Metrics reflect actual query performance

**Implementation Notes:**
- Leverage existing queryMetrics tracking
- Add cache metrics from QueryCache
- Format for readability (round numbers, percentages)

**Files to Modify:**
- `src/server/index.ts` - Register new MCP tool
- `src/server/database.ts` - Expose comprehensive metrics

---

## Implementation Sequencing

### Phase 1: Token Efficiency (Week 1-2)

**Stories:** E1-S1 → E1-S2 → E1-S3 → E1-S4 → E1-S5

**Milestone:** 95% token reduction validated, backward compatible

**Deliverable:** Optimized MCP server with configurable response levels

### Phase 2: Performance (Week 3-4)

**Stories:** E2-S1 → E2-S2 → E2-S3 → E2-S4

**Milestone:** 10x faster fuzzy matching, improved relevance

**Deliverable:** Production-ready performance optimizations

### Phase 3: Observability (Week 5)

**Stories:** E3-S1 → E3-S2 → E3-S3

**Milestone:** 70%+ cache hit rate, full metrics visibility

**Deliverable:** Production monitoring and optimization validation

---

## Story Point Scale (Fibonacci)

- **1 pt:** <2 hours, trivial change
- **2 pts:** 2-4 hours, simple feature
- **3 pts:** 4-8 hours, moderate complexity
- **5 pts:** 1-2 days, complex feature
- **8 pts:** 2-4 days, very complex or high uncertainty

---

## Risk Mitigation

**Risk 1: Breaking Changes**
- **Mitigation:** All new parameters optional, default to current behavior
- **Validation:** Comprehensive backward compatibility tests

**Risk 2: Performance Regression**
- **Mitigation:** Benchmark suite, before/after comparisons
- **Rollback:** Feature flags for new optimizations

**Risk 3: N-gram Index Memory**
- **Mitigation:** Monitor index size, add memory limits
- **Fallback:** Degrade to current Levenshtein if memory constrained

---

_Ready for Phase 4: Implementation. Run `create-story` to begin Epic 1._
