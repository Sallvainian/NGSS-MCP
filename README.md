# NGSS MCP Server

[![npm version](https://img.shields.io/npm/v/ngss-mcp.svg)](https://www.npmjs.com/package/ngss-mcp)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Status:** ✅ v1.1.1 Published to npm

Model Context Protocol (MCP) server providing programmatic access to Next Generation Science Standards (NGSS) for middle school education.

## What's New in v1.1.1

- **Complete 3D Framework Filtering**: Added DCI (Disciplinary Core Idea) search tool to complete the trilogy
- **8 Total Tools**: Full coverage of SEP, CCC, and DCI filtering plus unit planning
- **35 DCI Values**: Search by any of 35 Disciplinary Core Ideas (100% NGSS middle school coverage)
- **Data Quality Fix**: Corrected 29 standards with proper DCI assignments

> **See full release history in [CHANGELOG.md](./CHANGELOG.md)**

## Features

- **55 Middle School Standards**: Complete coverage of NGSS middle school standards
- **3D Framework Support**: Full Science & Engineering Practices (SEP), Disciplinary Core Ideas (DCI), and Crosscutting Concepts (CCC)
- **Multi-Index Database**: Optimized O(1) lookups by code, domain filtering, and relevance-scored search
- **High-Performance Caching**: LRU cache with TTL for 60x faster repeated queries
- **Performance Metrics**: Real-time query performance tracking and cache statistics
- **Input Validation**: Comprehensive validation and sanitization for all query parameters
- **8 Powerful Tools**: Comprehensive API for standard lookup, search, filtering, and unit planning
- **MCP Protocol**: Native integration with Claude Desktop, Continue, and other MCP-compatible AI assistants

## Database Statistics

- **Total Standards**: 55
- **Physical Science**: 19 standards
- **Life Science**: 21 standards
- **Earth & Space Science**: 15 standards
- **Database Size**: 80 KB (optimized)
- **Index Sizes**: 55 codes, 3 domains, 343 full-text keywords

## Performance

**Query Caching**:
- **LRU Cache**: 100-entry capacity with intelligent eviction
- **TTL Expiration**: 5-minute Time-To-Live for cached results
- **Cache Hit Rate**: 79-90% in typical usage patterns
- **Speed Improvement**: 60x faster average for cached queries
  - `searchStandards`: 64x speedup (0.16ms → 0.002ms)
  - Domain-filtered search: 10x speedup (0.04ms → 0.004ms)

**Query Performance**:
- Code lookups: <0.01ms (O(1))
- Domain searches: <0.05ms
- Keyword searches: 0.01-0.20ms (first query)
- Cached queries: 0.002-0.005ms
- Stress test: 100 lookups in 0.04ms (0.0004ms per lookup)

**Performance Metrics API**:
- Real-time query statistics via `getQueryMetrics()`
- Cache statistics via `getCacheStats()`
- Per-method performance tracking
- Hit rate and eviction monitoring

## Input Validation

All query methods include comprehensive validation:

**Validation Rules**:
- **Standard Codes**: Must match format `MS-(PS|LS|ESS)\d+-\d+`
- **Domains**: Must be one of: Physical Science, Life Science, Earth and Space Science
- **Query Strings**: 1-500 characters, sanitized for security
- **Limit Parameters**: 1-100 (positive integers only)
- **Injection Protection**: Blocks suspicious patterns and control characters

**Validation Errors**:
Throw descriptive errors with clear messages:
```javascript
// Invalid standard code
Error: Invalid standard code format. Expected: MS-{PS|LS|ESS}{number}-{number}

// Invalid domain
Error: Invalid domain. Must be one of: Physical Science, Life Science, Earth and Space Science

// Invalid limit
Error: Limit cannot exceed 100

// Empty query
Error: Query must be at least 1 character
```

**Benefits**:
- Prevents malformed requests
- Clear error messaging
- Security hardening against injection
- Input sanitization for all text fields

## Installation

### Install from npm

Install via npm:

```bash
npm install ngss-mcp
```

Or with a specific version:

```bash
npm install ngss-mcp@1.0.0
```

Or install globally:

```bash
npm install -g ngss-mcp
```

### Prerequisites
- Node.js 18+ or Bun runtime
- npm or bun package manager

### Install from Source

```bash
# Clone repository
git clone <repository-url>
cd NGSS-MCP

# Install dependencies
bun install  # or npm install

# Build TypeScript
bun run build  # or npm run build
```

### Install as MCP Server

For Claude Desktop or other MCP clients, add to your MCP configuration:

```json
{
  "mcpServers": {
    "ngss": {
      "command": "node",
      "args": ["/absolute/path/to/NGSS-MCP/dist/server/index.js"]
    }
  }
}
```

**Claude Desktop Config Locations**:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Available Tools

### 1. `get_standard`

Retrieve a specific NGSS standard by its code identifier.

**Input**:
```json
{
  "code": "MS-PS1-1"
}
```

**Output**:
```json
{
  "code": "MS-PS1-1",
  "grade_level": "MS",
  "domain": "Physical Science",
  "topic": "Structure and Properties of Matter",
  "performance_expectation": "Develop models to describe the atomic composition of simple molecules and extended structures.",
  "sep": {
    "code": "SEP-1",
    "name": "Develop a model to predict and/or describe phenomena.",
    "description": "Science and Engineering Practices Developing and Using Models..."
  },
  "dci": {
    "code": "PS1.A",
    "name": "Structure and Properties of Matter",
    "description": "Disciplinary Core Ideas..."
  },
  "ccc": {
    "code": "CCC-1",
    "name": "Patterns can be used to identify cause and effect relationships.",
    "description": "Crosscutting Concepts..."
  },
  "keywords": ["develop", "model", "describe", "atomic", "composition", "molecules"],
  "lesson_scope": {
    "key_concepts": [...],
    "prerequisite_knowledge": [],
    "common_misconceptions": [],
    "depth_boundaries": {"include": [], "exclude": []}
  }
}
```

**Valid Code Format**: `MS-(PS|LS|ESS)\d+-\d+`
- `MS-PS1-1` through `MS-PS4-3` (Physical Science)
- `MS-LS1-1` through `MS-LS4-6` (Life Science)
- `MS-ESS1-1` through `MS-ESS3-5` (Earth & Space Science)

### 2. `search_by_domain`

Find all NGSS standards in a specific science domain.

**Input**:
```json
{
  "domain": "Physical Science"
}
```

**Accepted Values**:
- `"Physical Science"` or `"physical-science"`
- `"Life Science"` or `"life-science"`
- `"Earth and Space Science"` or `"earth-space-science"`

**Output**:
```json
{
  "domain": "Physical Science",
  "count": 19,
  "standards": [
    {
      "code": "MS-PS1-1",
      "topic": "Structure and Properties of Matter",
      "performance_expectation": "Develop models to describe the atomic composition..."
    }
  ]
}
```

### 3. `get_3d_components`

Extract the three-dimensional learning components for a specific standard.

**Input**:
```json
{
  "code": "MS-LS2-1"
}
```

**Output**:
```json
{
  "code": "MS-LS2-1",
  "framework_components": {
    "Science and Engineering Practices (SEP)": {
      "code": "SEP-1",
      "name": "Analyze and interpret data to provide evidence...",
      "description": "Science and Engineering Practices..."
    },
    "Disciplinary Core Ideas (DCI)": {
      "code": "LS2.A",
      "name": "Interdependent Relationships in Ecosystems",
      "description": "Disciplinary Core Ideas..."
    },
    "Crosscutting Concepts (CCC)": {
      "code": "CCC-1",
      "name": "Patterns can be used to identify cause and effect...",
      "description": "Crosscutting Concepts..."
    }
  }
}
```

**3D Framework Components**:
- **SEP**: Science & Engineering Practices - *What scientists and engineers do*
- **DCI**: Disciplinary Core Ideas - *Key concepts to understand*
- **CCC**: Crosscutting Concepts - *Themes that connect across disciplines*

### 4. `search_standards`

Perform full-text search across all NGSS standard content.

**Input**:
```json
{
  "query": "ecosystem interactions",
  "domain": "Life Science",
  "limit": 5
}
```

**Parameters**:
- `query` (required): Search text (min 2 characters)
- `domain` (optional): Filter by domain
- `limit` (optional): Maximum results (default: 10, must be positive integer)

**Output**:
```json
{
  "query": "ecosystem interactions",
  "domain": "Life Science",
  "totalMatches": 3,
  "results": [
    {
      "code": "MS-LS2-2",
      "domain": "Life Science",
      "topic": "Ecosystems: Interactions, Energy, and Dynamics",
      "relevance": 0.89,
      "performance_expectation": "Construct an explanation that predicts patterns...",
      "keywords": ["construct", "explanation", "predicts", "patterns", "interactions"]
    }
  ]
}
```

**Search Scope**:
- Performance expectations
- Topics
- Keywords
- All 3D components (SEP, DCI, CCC)

### 5. `search_by_practice`

Filter NGSS standards by Science & Engineering Practices (SEP).

**Input**:
```json
{
  "practice": "Developing and Using Models",
  "detail_level": "minimal"
}
```

**Valid SEP Values** (10 options):
1. `"Asking Questions and Defining Problems"`
2. `"Developing and Using Models"`
3. `"Planning and Carrying Out Investigations"`
4. `"Analyzing and Interpreting Data"`
5. `"Using Mathematics and Computational Thinking"`
6. `"Constructing Explanations and Designing Solutions"`
7. `"Engaging in Argument from Evidence"`
8. `"Obtaining, Evaluating, and Communicating Information"`
9. `"Define the Criteria and Constraints of a Design Problem"`
10. `"Unknown"`

**Output**:
```json
{
  "practice": "Developing and Using Models",
  "total": 8,
  "standards": [
    {
      "code": "MS-PS1-1",
      "topic": "Structure and Properties of Matter",
      "performance_expectation": "Develop models to describe..."
    }
  ]
}
```

### 6. `search_by_crosscutting_concept`

Filter NGSS standards by Crosscutting Concepts (CCC).

**Input**:
```json
{
  "concept": "Patterns",
  "detail_level": "minimal"
}
```

**Valid CCC Values** (8 options):
1. `"Patterns"`
2. `"Cause and Effect"`
3. `"Scale, Proportion, and Quantity"`
4. `"Systems and System Models"`
5. `"Energy and Matter"`
6. `"Structure and Function"`
7. `"Stability and Change"`
8. `"Unknown"`

**Output**:
```json
{
  "concept": "Patterns",
  "total": 6,
  "standards": [
    {
      "code": "MS-LS2-2",
      "topic": "Ecosystems: Interactions, Energy, and Dynamics",
      "performance_expectation": "Construct an explanation..."
    }
  ]
}
```

### 7. `search_by_disciplinary_core_idea`

Filter NGSS standards by Disciplinary Core Ideas (DCI).

**Input**:
```json
{
  "dci": "Definitions of Energy",
  "detail_level": "minimal"
}
```

**Valid DCI Values** (14 options):
1. `"Definitions of Energy"`
2. `"Earth's Materials and Systems"`
3. `"Evidence of Common Ancestry and Diversity"`
4. `"Forces and Motion"`
5. `"Growth and Development of Organisms"`
6. `"Interdependent Relationships in Ecosystems"`
7. `"Natural Hazards"`
8. `"Organization for Matter and Energy Flow in Organisms"`
9. `"Structure and Function"`
10. `"Structure and Properties of Matter"`
11. `"The History of Planet Earth"`
12. `"The Universe and Its Stars"`
13. `"Wave Properties"`
14. `"Weather and Climate"`

**Output**:
```json
{
  "dci": "Definitions of Energy",
  "total": 4,
  "standards": [
    {
      "code": "MS-PS3-1",
      "topic": "Energy",
      "performance_expectation": "Construct and interpret graphical displays..."
    }
  ]
}
```

### 8. `get_3d_components`

*(Renumbered from Tool 3 - functionality unchanged)*

### 9. `get_unit_suggestions`

Get intelligent curriculum unit suggestions based on an anchor standard, using binary compatibility scoring across domain, SEP, CCC, and DCI dimensions.

**Input**:
```json
{
  "anchor_standard": "MS-PS1-1",
  "unit_size": 5,
  "detail_level": "minimal"
}
```

**Parameters**:
- `anchor_standard` (required): Standard code to base suggestions on
- `unit_size` (optional): Total standards in unit including anchor (default: 5, range: 2-8)
- `detail_level` (optional): Response detail level (minimal/summary/full)

**Output**:
```json
{
  "anchor": {
    "code": "MS-PS1-1",
    "domain": "Physical Science",
    "topic": "Structure and Properties of Matter"
  },
  "unit_size": 5,
  "suggestions": [
    {
      "code": "MS-PS1-2",
      "compatibility_score": 8,
      "domain_match": true,
      "sep_match": true,
      "ccc_match": true,
      "dci_match": true
    }
  ]
}
```

**Compatibility Scoring** (Binary Matching per ADR-001):
- **Domain Match**: +3 points (same science domain as anchor)
- **SEP Match**: +2 points (same Science & Engineering Practice)
- **CCC Match**: +2 points (same Crosscutting Concept)
- **DCI Match**: +1 point (same Disciplinary Core Idea)
- **Maximum Score**: 8 points (perfect alignment across all dimensions)

**Use Cases**:
- Curriculum planning: Build thematically coherent units
- Cross-domain exploration: Discover connections between science domains
- Differentiation: Find standards with varying complexity levels
- Unit sequencing: Identify logical progressions of concepts

## Data Model (ADR-001)

The NGSS-MCP server uses a **single-object data model** for 3D framework components:

- Each standard has ONE `sep` object: `standard.sep.name`
- Each standard has ONE `ccc` object: `standard.ccc.name`
- Each standard has ONE `dci` object: `standard.dci.name`

This ensures consistent data structure and simplifies filtering operations. See `docs/adr/001-use-single-object-3d-framework-structure.md` for details.

## Error Handling

All tools return structured error responses with `isError: true`:

```json
{
  "error": "Not Found",
  "message": "Standard MS-PS1-99 does not exist in the database",
  "code": "STANDARD_NOT_FOUND"
}
```

**Error Codes**:
- `STANDARD_NOT_FOUND`: Requested standard code doesn't exist
- `INTERNAL_ERROR`: Server error (database not initialized, parsing error, etc.)

## Development

### Project Structure

```
NGSS-MCP/
├── src/
│   ├── server/
│   │   ├── index.ts              # MCP server with 8 tools
│   │   ├── database.ts           # Multi-index database with caching
│   │   ├── query-cache.ts        # LRU cache with TTL and metrics
│   │   └── query-validation.ts   # Input validation and sanitization
│   │   └── integration.test.ts   # 87 comprehensive tests (100% coverage)
│   ├── constants/
│   │   └── enum-values.ts        # SEP and CCC enum values
│   ├── extraction/               # PDF extraction utilities
│   └── types/
│       └── ngss.ts               # Type definitions
├── scripts/
│   ├── test-query-interface.ts   # Comprehensive test suite
│   └── test-cache-performance.ts # Cache effectiveness validation
├── data/
│   └── ngss-ms-standards.json    # Extracted standards database
├── dist/                         # Compiled JavaScript
├── docs/
│   ├── adr/                      # Architecture Decision Records
│   │   └── 001-use-single-object-3d-framework-structure.md
│   └── Middle School By Topic NGSS.pdf
```

### Build Commands

```bash
# Compile TypeScript
bun run build

# Development mode (watch)
bun run dev

# Extract standards from PDF (requires pdf-extraction MCP)
bun run build-data

# Test PDF extraction
bun test
```

### Testing

```bash
# Run comprehensive query interface tests (32 tests)
bun run scripts/test-query-interface.ts

# Test cache performance and effectiveness
bun run scripts/test-cache-performance.ts
```

**Test Coverage**:
- ✅ All 8 MCP tools (comprehensive integration tests)
- ✅ Data validation (ADR-001 compliance: SEP/CCC/DCI single objects)
- ✅ Backward compatibility (Tools 1-4 unchanged from v1.0.1)
- ✅ Tool regression (Tools 5, 6, 8 smoke tests)
- ✅ Input validation and error handling
- ✅ Cache effectiveness (60x speedup verification)
- ✅ Performance stress testing (100+ queries)
- ✅ Edge cases and boundary conditions
- ✅ 87 total test cases, 100% pass rate, 100% code coverage

### Architecture

**Database Module** (`database.ts`):
- **Code Index**: `Map<string, Standard>` - O(1) lookups by standard code
- **Domain Index**: `Map<string, Standard[]>` - Grouped by science domain
- **Full-Text Index**: `Map<string, Set<string>>` - Comprehensive search
- **Query Cache**: LRU cache with TTL for search result caching
- **Performance Metrics**: Real-time query statistics and timing
- **Input Validation**: Integrated validation for all query parameters

**Query Cache Module** (`query-cache.ts`):
- **QueryCache Class**: Generic LRU cache with TTL expiration
- **Cache Metrics**: Hits, misses, evictions, hit rate tracking
- **LRU Eviction**: Automatic removal of least recently used entries
- **TTL Management**: Automatic expiration of stale entries
- **Detailed Statistics**: Top entries and age tracking
- **Cache Key Generation**: Deterministic key creation from parameters

**Query Validation Module** (`query-validation.ts`):
- **QueryValidator Class**: Static validation methods for all input types
- **Format Validation**: Standard code, domain, query string checks
- **Range Validation**: Limit parameter bounds checking
- **Security Validation**: Injection pattern detection and sanitization
- **Sanitization**: Text cleaning and normalization
- **Error Messages**: Clear, actionable validation error messages

**MCP Server** (`index.ts`):
- High-level `McpServer` class from `@modelcontextprotocol/sdk`
- Zod schema validation for all tool inputs
- Graceful shutdown handling (SIGINT/SIGTERM)
- StdioServerTransport for MCP protocol communication
- Error handling with structured responses

## Data Quality

- ✅ **100% 3D Completeness**: All standards include SEP, DCI, and CCC components
- ✅ **Valid Standard Codes**: All codes match pattern `MS-(PS|LS|ESS)\d+-\d+`
- ✅ **Clean Text**: No embedded newlines or control characters
- ✅ **Complete Topics**: Full topic names (e.g., "Structure and Properties of Matter")

## Source Data

- **PDF Source**: Middle School By Topic NGSS.pdf (3.6 MB)
- **Extraction Method**: Pattern-based extraction via pdf-extraction MCP server
- **Generated**: October 15, 2025
- **Validation**: Schema-validated with Zod, 100% completeness verified

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- TypeScript strict mode compliance
- Zod schema validation for new inputs
- Test coverage for new features
- Documentation updates for API changes

## Support

For issues, questions, or feature requests, please open an issue on the repository.
