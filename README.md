# NGSS MCP Server

[![npm version](https://img.shields.io/npm/v/ngss-mcp.svg)](https://www.npmjs.com/package/ngss-mcp)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**Status:** ✅ v1.0.0 Published to npm

Model Context Protocol (MCP) server providing programmatic access to Next Generation Science Standards (NGSS) for middle school education.

## Features

- **55 Middle School Standards**: Complete coverage of NGSS middle school standards
- **3D Framework Support**: Full Science & Engineering Practices (SEP), Disciplinary Core Ideas (DCI), and Crosscutting Concepts (CCC)
- **Multi-Index Database**: Optimized O(1) lookups by code, domain filtering, and relevance-scored search
- **High-Performance Caching**: LRU cache with TTL for 60x faster repeated queries
- **Performance Metrics**: Real-time query performance tracking and cache statistics
- **Input Validation**: Comprehensive validation and sanitization for all query parameters
- **4 Powerful Tools**: Comprehensive API for standard lookup, search, and analysis
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
│   │   ├── index.ts              # MCP server with 4 tools
│   │   ├── database.ts           # Multi-index database with caching
│   │   ├── query-cache.ts        # LRU cache with TTL and metrics
│   │   └── query-validation.ts   # Input validation and sanitization
│   ├── extraction/               # PDF extraction utilities
│   └── types/
│       └── ngss.ts               # Type definitions
├── scripts/
│   ├── test-query-interface.ts   # Comprehensive test suite
│   └── test-cache-performance.ts # Cache effectiveness validation
├── data/
│   └── ngss-ms-standards.json    # Extracted standards database
├── dist/                         # Compiled JavaScript
└── docs/
    └── Middle School By Topic NGSS.pdf
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
- ✅ All 4 database query methods
- ✅ Input validation and error handling
- ✅ Cache effectiveness (60x speedup verification)
- ✅ Performance stress testing (100+ queries)
- ✅ Edge cases and boundary conditions
- ✅ Domain filtering and search relevance
- ✅ 32 total test cases, 100% pass rate

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
