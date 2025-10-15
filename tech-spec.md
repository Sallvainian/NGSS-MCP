# Technical Specification: NGSS MCP Server

**Version:** 1.0
**Date:** 2025-10-15
**Project Level:** 2
**Owner:** Architect

---

## Architecture Overview

### System Context

```
┌─────────────────────────────────────────────────────────┐
│                   TeachFlow Module                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Standards    │  │ Instructional│  │ Alpha        │  │
│  │ Aligner      │  │ Designer     │  │ (Student     │  │
│  │ Agent        │  │ Agent        │  │  Support)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
│                           │                             │
│                    MCP Client                           │
└───────────────────────────┼─────────────────────────────┘
                            │ MCP Protocol
                            │
┌───────────────────────────┼─────────────────────────────┐
│                  NGSS MCP Server                        │
│                           │                             │
│  ┌────────────────────────┴──────────────────────────┐  │
│  │           MCP Server Core (@mcp/sdk)              │  │
│  │  - Server lifecycle                               │  │
│  │  - Tool registration                              │  │
│  │  - Request/response handling                      │  │
│  └────────────┬──────────────────────┬────────────────┘  │
│               │                      │                   │
│  ┌────────────▼──────────┐  ┌───────▼────────────────┐  │
│  │    Tool Handlers      │  │   Validation Layer     │  │
│  │  - get_standard       │  │  - Parameter checks    │  │
│  │  - search_by_domain   │  │  - Code format         │  │
│  │  - find_by_dq         │  │  - Error handling      │  │
│  │  - get_3d_components  │  │                        │  │
│  │  - search_standards   │  │                        │  │
│  └────────────┬──────────┘  └────────────────────────┘  │
│               │                                          │
│  ┌────────────▼──────────────────────────────────────┐  │
│  │              Data Access Layer                    │  │
│  │  - Primary Index: code → standard (Map)           │  │
│  │  - Domain Index: domain → [standards]             │  │
│  │  - DQ Index: [driving questions]                  │  │
│  │  - Keyword Index: keyword → [codes]               │  │
│  └────────────┬──────────────────────────────────────┘  │
│               │                                          │
│  ┌────────────▼──────────────────────────────────────┐  │
│  │        Algorithms & Utilities                     │  │
│  │  - Levenshtein distance (fuzzy matching)          │  │
│  │  - Relevance scoring (TF-IDF)                     │  │
│  │  - Response formatting                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Data Storage (JSON File)                 │   │
│  │     data/ngss-ms-standards.json                  │   │
│  │  - Standards array                               │   │
│  │  - Complete 3D framework                         │   │
│  │  - Metadata for search/match                     │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Token Efficiency First**: Every tool response optimized for minimal token usage
2. **Stateless Operations**: No session state, pure functions for reliability
3. **Fail-Fast Validation**: Validate inputs immediately, clear error messages
4. **Index-Driven Performance**: Pre-build indexes at startup for <1s lookups
5. **Educational Integrity**: Preserve complete 3D framework, never partial data

---

## Technology Stack

### Runtime & Language

- **Runtime:** Node.js 18+ (LTS)
- **Language:** TypeScript 5.0+
- **MCP SDK:** @modelcontextprotocol/sdk ^1.0.0

### Core Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "fast-levenshtein": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0"
  }
}
```

**Dependency Rationale:**
- **@modelcontextprotocol/sdk**: Official MCP TypeScript SDK
- **fast-levenshtein**: High-performance fuzzy string matching
- **zod**: Runtime type validation for requests/responses
- **vitest**: Fast unit testing framework
- **tsx**: TypeScript execution for development

### Project Structure

```
ngss-mcp-server/
├── src/
│   ├── index.ts                 # Server entry point
│   ├── server.ts                # MCP server initialization
│   ├── config.ts                # Configuration management
│   ├── types/
│   │   ├── standard.ts          # Standard data model
│   │   ├── tool-params.ts       # Tool parameter schemas
│   │   └── tool-responses.ts    # Tool response schemas
│   ├── data/
│   │   ├── loader.ts            # JSON data loading
│   │   └── indexes.ts           # Index building
│   ├── tools/
│   │   ├── get-standard.ts
│   │   ├── search-by-domain.ts
│   │   ├── find-by-driving-question.ts
│   │   ├── get-3d-components.ts
│   │   └── search-standards.ts
│   ├── algorithms/
│   │   ├── fuzzy-match.ts       # Levenshtein + confidence
│   │   └── relevance-score.ts   # TF-IDF for search
│   └── utils/
│       ├── validation.ts        # Input validation
│       └── error-handler.ts     # Error formatting
├── data/
│   └── ngss-ms-standards.json   # NGSS data
├── tests/
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── scripts/
│   └── extract-pdf.ts           # PDF extraction pipeline
├── package.json
├── tsconfig.json
└── README.md
```

---

## Data Model

### TypeScript Interfaces

```typescript
/**
 * Science & Engineering Practice (1 of 8)
 */
interface SEP {
  code: string;           // e.g., "SEP-6"
  name: string;           // e.g., "Constructing Explanations and Designing Solutions"
  description: string;    // Full description of the practice
}

/**
 * Disciplinary Core Idea (LS.*, PS.*, ESS.*, ETS.*)
 */
interface DCI {
  code: string;           // e.g., "LS1.C"
  name: string;           // e.g., "Organization for Matter and Energy Flow in Organisms"
  description: string;    // Full description of the core idea
}

/**
 * Crosscutting Concept (1 of 7)
 */
interface CCC {
  code: string;           // e.g., "CCC-5"
  name: string;           // e.g., "Energy and Matter"
  description: string;    // Full description of the concept
}

/**
 * Lesson scope guidance for teachers and AI tutors
 */
interface LessonScope {
  key_concepts: string[];              // 3-5 essential concepts to teach
  prerequisite_knowledge: string[];    // 2-4 concepts students should know
  common_misconceptions: string[];     // 2-3 typical student errors
  depth_boundaries: {
    include: string[];                 // 3-5 topics to cover in depth
    exclude: string[];                 // 2-4 topics out of scope
  };
}

/**
 * Complete NGSS Standard with 3D framework and metadata
 */
interface Standard {
  // Core identification
  code: string;                        // e.g., "MS-LS1-6"
  grade_level: string;                 // "MS" | "ES" | "HS"
  domain: string;                      // "Life Science" | "Physical Science" | "Earth and Space Science"
  topic: string;                       // e.g., "From Molecules to Organisms: Structures and Processes"

  // Performance expectation (what students do)
  performance_expectation: string;     // Full text of PE

  // 3-Dimensional Learning Framework (required)
  sep: SEP;                            // What students DO
  dci: DCI;                            // What students LEARN
  ccc: CCC;                            // HOW students THINK

  // Search and discovery metadata
  driving_questions: string[];         // 2+ student-friendly questions
  keywords: string[];                  // 5-15 searchable terms

  // Educational guidance
  lesson_scope: LessonScope;
}

/**
 * Database structure: Single JSON file with standards array
 */
interface StandardsDatabase {
  version: string;                     // Schema version (e.g., "1.0.0")
  last_updated: string;                // ISO 8601 timestamp
  grade_levels: string[];              // ["MS"] (future: add ES, HS)
  domains: string[];                   // All available domains
  count: number;                       // Total standards count
  standards: Standard[];               // Complete standards array
}
```

### Tool Parameter Schemas (Zod)

```typescript
import { z } from 'zod';

// Standard code format: XX-YYN-N (e.g., MS-LS1-6)
const StandardCodeSchema = z.string().regex(
  /^[A-Z]{2}-[A-Z]{2,3}\d+-\d+$/,
  "Invalid standard code format. Expected: XX-YYN-N"
);

const GradeLevelSchema = z.enum(['MS', 'ES', 'HS']);

const DomainSchema = z.enum([
  'Life Science',
  'Physical Science',
  'Earth and Space Science'
]);

// Tool parameter schemas
export const GetStandardParams = z.object({
  code: StandardCodeSchema
});

export const SearchByDomainParams = z.object({
  domain: DomainSchema,
  grade_level: GradeLevelSchema
});

export const FindByDrivingQuestionParams = z.object({
  question: z.string().min(5, "Question too short")
});

export const Get3DComponentsParams = z.object({
  code: StandardCodeSchema
});

export const SearchStandardsParams = z.object({
  query: z.string().min(2, "Query too short"),
  filters: z.object({
    domain: DomainSchema.optional(),
    grade_level: GradeLevelSchema.optional()
  }).optional()
});
```

### Tool Response Types

```typescript
/**
 * get_standard() response
 */
type GetStandardResponse = Standard;

/**
 * search_by_domain() response
 */
interface SearchByDomainResponse {
  domain: string;
  grade_level: string;
  count: number;
  standards: Array<{
    code: string;
    topic: string;
    performance_expectation: string;
  }>;
}

/**
 * find_by_driving_question() response
 */
interface FindByDrivingQuestionResponse {
  matched: boolean;
  confidence: number;              // 0.0 - 1.0
  standard: Standard | null;
  matched_question: string | null; // Which official DQ matched
}

/**
 * get_3d_components() response
 */
interface Get3DComponentsResponse {
  code: string;
  sep: { code: string; name: string };
  dci: { code: string; name: string };
  ccc: { code: string; name: string };
}

/**
 * search_standards() response
 */
interface SearchStandardsResponse {
  query: string;
  filters?: {
    domain?: string;
    grade_level?: string;
  };
  count: number;
  standards: Array<{
    code: string;
    topic: string;
    performance_expectation: string;
    relevance_score: number;
  }>;
}
```

---

## Index Design

### Primary Index: Code → Standard

**Purpose:** O(1) lookup for get_standard() and get_3d_components()

**Implementation:**
```typescript
class DataStore {
  private codeIndex: Map<string, Standard>;

  constructor(standards: Standard[]) {
    this.codeIndex = new Map(
      standards.map(s => [s.code, s])
    );
  }

  getByCode(code: string): Standard | undefined {
    return this.codeIndex.get(code);
  }
}
```

**Performance:** O(1) lookup, <100ms response time

### Domain Index: Domain → Standards[]

**Purpose:** Fast filtering for search_by_domain()

**Implementation:**
```typescript
class DataStore {
  private domainIndex: Map<string, StandardSummary[]>;

  buildDomainIndex(standards: Standard[]) {
    const index = new Map<string, StandardSummary[]>();

    for (const s of standards) {
      const key = `${s.domain}:${s.grade_level}`;
      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)!.push({
        code: s.code,
        topic: s.topic,
        performance_expectation: s.performance_expectation
      });
    }

    return index;
  }

  searchByDomain(domain: string, grade_level: string): StandardSummary[] {
    const key = `${domain}:${grade_level}`;
    return this.domainIndex.get(key) || [];
  }
}
```

**Performance:** O(1) lookup after indexing, returns summary not full objects

### Driving Question Index

**Purpose:** Fuzzy matching for find_by_driving_question()

**Implementation:**
```typescript
interface DQEntry {
  question: string;          // Official driving question
  normalized: string;        // Lowercase, no punctuation
  standard_code: string;
}

class DataStore {
  private dqIndex: DQEntry[];

  buildDQIndex(standards: Standard[]) {
    const entries: DQEntry[] = [];

    for (const s of standards) {
      for (const dq of s.driving_questions) {
        entries.push({
          question: dq,
          normalized: this.normalize(dq),
          standard_code: s.code
        });
      }
    }

    return entries;
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove punctuation
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
  }
}
```

**Performance:** O(n) search through all DQs, <2s with ~100-150 total DQs

### Keyword Index: Keyword → Standard Codes[]

**Purpose:** Full-text search for search_standards()

**Implementation:**
```typescript
class DataStore {
  private keywordIndex: Map<string, Set<string>>;  // keyword → standard codes

  buildKeywordIndex(standards: Standard[]) {
    const index = new Map<string, Set<string>>();

    for (const s of standards) {
      for (const keyword of s.keywords) {
        const normalized = keyword.toLowerCase();
        if (!index.has(normalized)) {
          index.set(normalized, new Set());
        }
        index.get(normalized)!.add(s.code);
      }
    }

    return index;
  }

  searchByKeyword(query: string): Set<string> {
    const terms = query.toLowerCase().split(/\s+/);
    const matchedCodes = new Set<string>();

    for (const term of terms) {
      const codes = this.keywordIndex.get(term) || new Set();
      codes.forEach(code => matchedCodes.add(code));
    }

    return matchedCodes;
  }
}
```

**Performance:** O(k * m) where k = query terms, m = avg codes per keyword

---

## Algorithm Implementations

### Fuzzy Matching (Levenshtein Distance)

**Purpose:** Match imprecise student questions to official driving questions

**Algorithm:**
```typescript
import levenshtein from 'fast-levenshtein';

interface MatchResult {
  matched: boolean;
  confidence: number;
  dq_entry: DQEntry | null;
}

class FuzzyMatcher {
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  findBestMatch(userQuestion: string, dqIndex: DQEntry[]): MatchResult {
    const normalized = this.normalize(userQuestion);
    let bestMatch: DQEntry | null = null;
    let bestConfidence = 0;

    for (const entry of dqIndex) {
      const distance = levenshtein.get(normalized, entry.normalized);
      const maxLen = Math.max(normalized.length, entry.normalized.length);
      const confidence = 1 - (distance / maxLen);

      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = entry;
      }
    }

    return {
      matched: bestConfidence >= this.CONFIDENCE_THRESHOLD,
      confidence: bestConfidence,
      dq_entry: bestMatch
    };
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

**Complexity:** O(n * m) where n = # DQs, m = avg DQ length
**Optimization:** Pre-normalize all DQs at index build time

**Confidence Tuning:**
- 1.0: Exact match
- 0.9-0.95: Minor typo (1-2 chars different)
- 0.8-0.9: Word order variation or synonym
- 0.7-0.8: Partial match (some words missing)
- <0.7: No match (too dissimilar)

### Relevance Scoring (TF-IDF Simplified)

**Purpose:** Rank search results by relevance to query

**Algorithm:**
```typescript
interface ScoredResult {
  code: string;
  score: number;
}

class RelevanceScorer {
  scoreResults(
    query: string,
    matchedCodes: Set<string>,
    standards: Map<string, Standard>
  ): ScoredResult[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results: ScoredResult[] = [];

    for (const code of matchedCodes) {
      const standard = standards.get(code);
      if (!standard) continue;

      let score = 0;
      const searchableText = [
        standard.performance_expectation,
        ...standard.keywords,
        ...standard.lesson_scope.key_concepts
      ].join(' ').toLowerCase();

      // Term frequency scoring
      for (const term of queryTerms) {
        const termCount = (searchableText.match(new RegExp(term, 'g')) || []).length;
        score += termCount;
      }

      // Boost if term in keywords (higher relevance)
      for (const keyword of standard.keywords) {
        if (queryTerms.includes(keyword.toLowerCase())) {
          score += 2;  // Keyword match boost
        }
      }

      results.push({ code, score });
    }

    return results.sort((a, b) => b.score - a.score);
  }
}
```

**Optimization:** For v1, use simple term frequency. Future: full TF-IDF with document frequency

---

## Performance Optimization

### Startup Optimization

**Strategy:** Load data once, build all indexes at startup

```typescript
class NGSSMCPServer {
  private dataStore: DataStore;

  async initialize() {
    console.time('Server initialization');

    // Load JSON file
    const data = await loadStandardsFile('./data/ngss-ms-standards.json');
    console.log(`Loaded ${data.standards.length} standards`);

    // Build all indexes in parallel
    await Promise.all([
      this.buildCodeIndex(data.standards),
      this.buildDomainIndex(data.standards),
      this.buildDQIndex(data.standards),
      this.buildKeywordIndex(data.standards)
    ]);

    console.timeEnd('Server initialization');  // Target: <2s
  }
}
```

**Memory Trade-off:** ~10-20MB for indexes vs. 0 runtime build time

### Response Optimization

**Token Reduction Strategies:**

1. **get_3d_components()**: Return only codes and names, skip descriptions (~50% reduction)
2. **search_by_domain()**: Return summaries not full standards (~70% reduction)
3. **Omit null fields**: Don't serialize optional fields that are null
4. **Compact JSON**: No pretty-printing in production

**Code Example:**
```typescript
// Full standard: ~350 tokens
const fullStandard = {
  code: "MS-LS1-6",
  grade_level: "MS",
  domain: "Life Science",
  // ... all fields
};

// 3D components only: ~180 tokens (49% reduction)
const components = {
  code: standard.code,
  sep: { code: standard.sep.code, name: standard.sep.name },
  dci: { code: standard.dci.code, name: standard.dci.name },
  ccc: { code: standard.ccc.code, name: standard.ccc.name }
};
```

### Caching Strategy (Future Enhancement)

```typescript
class CachedDataStore extends DataStore {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 3600000;  // 1 hour

  getCached<T>(key: string, fetcher: () => T): T {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.TTL) {
      return cached.data as T;
    }

    const data = fetcher();
    this.cache.set(key, { data, timestamp: now });
    return data;
  }
}
```

---

## Error Handling

### Error Categories

```typescript
enum ErrorCode {
  // Client errors (4xx)
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  STANDARD_NOT_FOUND = 'STANDARD_NOT_FOUND',
  INVALID_CODE_FORMAT = 'INVALID_CODE_FORMAT',
  INVALID_DOMAIN = 'INVALID_DOMAIN',
  QUERY_TOO_SHORT = 'QUERY_TOO_SHORT',

  // Server errors (5xx)
  DATA_FILE_NOT_FOUND = 'DATA_FILE_NOT_FOUND',
  DATA_LOAD_ERROR = 'DATA_LOAD_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

interface MCPError {
  code: ErrorCode;
  message: string;
  details?: any;
}
```

### Error Handler Implementation

```typescript
class ErrorHandler {
  static handle(error: unknown): MCPError {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        code: ErrorCode.INVALID_PARAMETER,
        message: error.errors[0].message,
        details: error.errors
      };
    }

    // Custom application errors
    if (error instanceof NotFoundError) {
      return {
        code: ErrorCode.STANDARD_NOT_FOUND,
        message: error.message
      };
    }

    // Unknown errors (log but don't leak details)
    console.error('Unexpected error:', error);
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An internal error occurred'
    };
  }
}
```

---

## Testing Strategy

### Test Pyramid

```
         /\
        /  \      E2E: Integration tests with MCP client (5%)
       /────\
      /      \    Integration: Tool handlers with real data (20%)
     /────────\
    /          \  Unit: Algorithms, validation, indexes (75%)
   /────────────\
```

### Unit Tests (75% of tests)

**Coverage Areas:**
- Levenshtein distance algorithm
- Relevance scoring
- Index building logic
- Validation schemas
- Data normalization
- Error handling

**Example:**
```typescript
describe('FuzzyMatcher', () => {
  it('should match exact question with confidence 1.0', () => {
    const result = fuzzyMatcher.findBestMatch(
      'How do plants get energy?',
      dqIndex
    );
    expect(result.matched).toBe(true);
    expect(result.confidence).toBe(1.0);
    expect(result.dq_entry.standard_code).toBe('MS-LS1-6');
  });

  it('should match question with typos with confidence > 0.7', () => {
    const result = fuzzyMatcher.findBestMatch(
      'How do plaants get enrgy?',  // 2 typos
      dqIndex
    );
    expect(result.matched).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should not match unrelated question', () => {
    const result = fuzzyMatcher.findBestMatch(
      'What caused dinosaur extinction?',
      dqIndex
    );
    expect(result.matched).toBe(false);
  });
});
```

### Integration Tests (20% of tests)

**Coverage Areas:**
- Tool handlers with real data file
- Index operations end-to-end
- MCP protocol compliance
- Error responses

**Example:**
```typescript
describe('get_standard tool', () => {
  let server: NGSSMCPServer;

  beforeAll(async () => {
    server = new NGSSMCPServer();
    await server.initialize();
  });

  it('should return complete standard for valid code', async () => {
    const result = await server.callTool('get_standard', {
      code: 'MS-LS1-6'
    });

    expect(result.code).toBe('MS-LS1-6');
    expect(result.sep).toBeDefined();
    expect(result.dci).toBeDefined();
    expect(result.ccc).toBeDefined();
    expect(result.driving_questions.length).toBeGreaterThan(0);
  });
});
```

### E2E Tests (5% of tests)

**Coverage Areas:**
- Full MCP client → server → response flow
- Concurrent requests
- Server lifecycle (startup, shutdown)

**Example:**
```typescript
describe('MCP Server E2E', () => {
  let client: MCPClient;

  beforeAll(async () => {
    // Start server process
    await startServer();
    client = new MCPClient('http://localhost:3000');
    await client.connect();
  });

  it('should handle concurrent tool calls', async () => {
    const requests = [
      client.callTool('get_standard', { code: 'MS-LS1-6' }),
      client.callTool('get_standard', { code: 'MS-PS1-1' }),
      client.callTool('search_by_domain', {
        domain: 'Life Science',
        grade_level: 'MS'
      })
    ];

    const results = await Promise.all(requests);
    expect(results).toHaveLength(3);
    results.forEach(r => expect(r).toBeDefined());
  });
});
```

---

## Configuration Management

### Environment Variables

```bash
# .env file
NGSS_DATA_FILE=./data/ngss-ms-standards.json
NGSS_SERVER_PORT=3000
NGSS_LOG_LEVEL=info
NGSS_FUZZY_THRESHOLD=0.7
```

### Config Loading

```typescript
import dotenv from 'dotenv';

interface ServerConfig {
  dataFile: string;
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  fuzzyThreshold: number;
}

export function loadConfig(): ServerConfig {
  dotenv.config();

  return {
    dataFile: process.env.NGSS_DATA_FILE || './data/ngss-ms-standards.json',
    port: parseInt(process.env.NGSS_SERVER_PORT || '3000'),
    logLevel: (process.env.NGSS_LOG_LEVEL as any) || 'info',
    fuzzyThreshold: parseFloat(process.env.NGSS_FUZZY_THRESHOLD || '0.7')
  };
}
```

---

## Deployment & Operations

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

### Production Deployment

**Requirements:**
- Node.js 18+ runtime
- 100MB RAM minimum
- 50MB disk space (data + code)

**Startup Command:**
```bash
NODE_ENV=production node dist/index.js
```

**Health Check:**
- MCP list_tools should return 5 tools
- Server should respond in <2s

### Monitoring

**Key Metrics:**
- Tool call latency (p50, p95, p99)
- Token usage per tool
- Error rates by tool
- Memory usage
- Startup time

**Logging:**
```typescript
logger.info('Tool called', {
  tool: 'get_standard',
  params: { code: 'MS-LS1-6' },
  latency_ms: 45,
  token_count: 347
});
```

---

## Security Considerations

### Input Validation

- All parameters validated with Zod schemas
- Standard codes checked against regex pattern
- Query length limits (min 2, max 500 chars)
- Domain/grade level whitelist

### Data Integrity

- JSON schema validation on data load
- 100% of standards must have SEP, DCI, CCC
- No user-provided data persisted (stateless)

### Rate Limiting (Future)

```typescript
// If needed for production at scale
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000  // 100 requests per minute
});
```

---

## Future Enhancements

### Phase 2 Features

1. **Multiple Grade Levels:** Add ES (Elementary) and HS (High School)
2. **Performance Caching:** LRU cache for frequently accessed standards
3. **Metrics Dashboard:** Real-time usage analytics
4. **GraphQL Interface:** Alternative to MCP tools for web clients

### Phase 3 Features

1. **Common Core Math:** Extend beyond NGSS to math standards
2. **State Standards:** State-specific variations
3. **Standards Relationships:** Map prerequisites and progressions
4. **Lesson Planning Assistant:** AI-powered lesson suggestions based on standards

---

## Appendix: Reference Data

### NGSS Standard Code Format

Pattern: `XX-YYN-N`

- `XX`: Grade level (MS, ES, HS)
- `YY`: Domain code (LS, PS, ESS, ETS)
- `N`: Topic number
- `-N`: Standard number within topic

Examples:
- `MS-LS1-6`: Middle School, Life Science, Topic 1, Standard 6
- `HS-PS2-3`: High School, Physical Science, Topic 2, Standard 3
- `MS-ESS1-4`: Middle School, Earth/Space Science, Topic 1, Standard 4

### 3D Framework Components Count

- **SEP:** 8 practices
- **DCI:** 12 core ideas (4 domains × 3 ideas each, approximately)
- **CCC:** 7 concepts

**Estimated Totals:**
- Middle School standards: ~50-60 across all domains
- Each standard: ~350-500 tokens (full detail)
- Database size: ~50KB JSON (uncompressed)

---

**Document Status:** Complete technical specification for implementation
**Next Action:** Begin Epic 1 Story 1 (PDF extraction)
