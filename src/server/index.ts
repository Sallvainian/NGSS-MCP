#!/usr/bin/env node
/**
 * NGSS MCP Server
 * Provides access to NGSS (Next Generation Science Standards) educational standards
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { initializeDatabase, getDatabase } from './database.js';
import { formatResponse, formatResponseArray } from './response-formatter.js';
import { getTokenMetadata } from './token-counter.js';
import type { DetailLevel, Standard } from '../types/ngss.js';
import { SEP_VALUES, CCC_VALUES, DCI_VALUES } from '../constants/enum-values.js';

//===========================================
// Server Initialization
//===========================================

// Initialize server
const server = new McpServer({
  name: 'ngss-standards-server',
  version: '1.0.0'
});

// Initialize database at startup
let isInitialized = false;
let initError: Error | null = null;

try {
  initializeDatabase();
  isInitialized = true;
  console.error('✅ NGSS database loaded successfully');
  console.error(`📊 Database stats: ${JSON.stringify(getDatabase().getStats())}`);
} catch (error) {
  initError = error instanceof Error ? error : new Error(String(error));
  console.error('❌ Failed to initialize database:', initError.message);
}

// Helper function to check initialization
function ensureInitialized() {
  if (!isInitialized) {
    throw new Error(`Database not initialized: ${initError?.message || 'Unknown error'}`);
  }
}

//===========================================
// Helper: scoreCompatibility - Calculate compatibility score between anchor and candidate
//===========================================
interface CompatibilityScore {
  standard: Standard;
  score: number;
  breakdown: {
    domain_match: number;      // 0 or 3
    shared_seps: number;        // 0 or 2 (binary match)
    shared_cccs: number;        // 0 or 2 (binary match)
    shared_dcis: number;        // 0 or 1 (binary match)
  };
}

function scoreCompatibility(
  anchor: Standard,
  candidate: Standard
): CompatibilityScore {
  let score = 0;
  const breakdown = {
    domain_match: 0,
    shared_seps: 0,
    shared_cccs: 0,
    shared_dcis: 0
  };

  // Domain match
  if (anchor.domain === candidate.domain) {
    breakdown.domain_match = 3;
    score += 3;
  }

  // Binary SEP match (0 or 2 points)
  // Each standard has ONE sep object with a name property
  if (anchor.sep.name === candidate.sep.name) {
    breakdown.shared_seps = 2;
    score += 2;
  }

  // Binary CCC match (0 or 2 points)
  // Each standard has ONE ccc object with a name property
  if (anchor.ccc.name === candidate.ccc.name) {
    breakdown.shared_cccs = 2;
    score += 2;
  }

  // Binary DCI match (0 or 1 point)
  // Each standard has ONE dci object with a name property
  if (anchor.dci.name === candidate.dci.name) {
    breakdown.shared_dcis = 1;
    score += 1;
  }

  return { standard: candidate, score, breakdown };
}

// Tool 1: get_standard - Lookup standard by code
server.registerTool(
  'get_standard',
  {
    title: 'Get NGSS Standard by Code',
    description: 'Retrieve a specific NGSS standard by its code identifier (e.g., MS-PS1-1, MS-LS2-3, MS-ESS3-1)',
    inputSchema: {
      code: z.string()
        .regex(/^MS-(PS|LS|ESS)\d+-\d+$/)
        .describe('NGSS standard code (format: MS-{PS|LS|ESS}{number}-{number})'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('full')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ code, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const standard = db.getStandardByCode(code);

      if (!standard) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Not Found',
              message: `Standard ${code} does not exist in the database`,
              code: 'STANDARD_NOT_FOUND'
            }, null, 2)
          }],
          isError: true
        };
      }

      const formatted = formatResponse(standard, detail_level as DetailLevel);
      const tokens = getTokenMetadata(code, formatted);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...formatted,
            _metadata: { tokens }
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('get_standard error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool 2: search_by_domain - Filter standards by domain
server.registerTool(
  'search_by_domain',
  {
    title: 'Search Standards by Domain',
    description: 'Find all NGSS standards in a specific science domain (Physical Science, Life Science, or Earth and Space Science)',
    inputSchema: {
      domain: z.enum(['Physical Science', 'Life Science', 'Earth and Space Science'])
        .describe('Science domain to filter by'),
      offset: z.number().int().min(0).default(0).describe('Number of results to skip (for pagination)'),
      limit: z.number().int().min(1).max(50).default(10).describe('Maximum number of results to return (1-50)'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('full')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ domain, offset, limit, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const allStandards = db.searchByDomain(domain);

      // Apply pagination
      const standards = allStandards.slice(offset, offset + limit);

      const formattedStandards = formatResponseArray(standards, detail_level as DetailLevel);
      const tokens = getTokenMetadata(domain, formattedStandards);

      const result = {
        domain,
        count: standards.length,
        total: allStandards.length,
        standards: formattedStandards,
        _metadata: { tokens }
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      console.error('search_by_domain error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool 3: get_3d_components - Extract 3D framework components
server.registerTool(
  'get_3d_components',
  {
    title: 'Get 3D Framework Components',
    description: 'Extract the three-dimensional learning components (SEP: Science and Engineering Practices, DCI: Disciplinary Core Ideas, CCC: Crosscutting Concepts) for a specific standard (e.g., MS-PS1-1, MS-LS2-3, MS-ESS3-1)',
    inputSchema: {
      code: z.string()
        .regex(/^MS-(PS|LS|ESS)\d+-\d+$/)
        .describe('NGSS standard code (format: MS-{PS|LS|ESS}{number}-{number})'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('full')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ code, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const components = db.get3DComponents(code);

      if (!components) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Not Found',
              message: `Standard ${code} does not exist`,
              code: 'STANDARD_NOT_FOUND'
            }, null, 2)
          }],
          isError: true
        };
      }

      const result = {
        code,
        framework_components: {
          'Science and Engineering Practices (SEP)': {
            code: components.sep.code,
            name: components.sep.name,
            description: components.sep.description
          },
          'Disciplinary Core Ideas (DCI)': {
            code: components.dci.code,
            name: components.dci.name,
            description: components.dci.description
          },
          'Crosscutting Concepts (CCC)': {
            code: components.ccc.code,
            name: components.ccc.name,
            description: components.ccc.description
          }
        }
      };

      const tokens = getTokenMetadata(code, result);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...result,
            _metadata: { tokens }
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('get_3d_components error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Tool 5: search_standards - Full-text search across all content
server.registerTool(
  'search_standards',
  {
    title: 'Search Standards (Full-Text)',
    description: 'Perform full-text search across all NGSS standard content including performance expectations, topics, and keywords (e.g., "energy transfer", "ecosystems", "chemical reactions", "climate change")',
    inputSchema: {
      query: z.string().min(2).describe('Search query text'),
      domain: z.enum(['Physical Science', 'Life Science', 'Earth and Space Science']).optional().describe('Optional: filter by domain'),
      limit: z.number().int().positive().default(10).describe('Maximum number of results to return'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('full')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ query, domain, limit, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const options: { domain?: string; limit?: number } = { limit };
      if (domain !== undefined) {
        options.domain = domain;
      }
      const results = db.searchStandards(query, options);

      const formattedResults = results.map(({ standard, score }) => {
        const formatted = formatResponse(standard, detail_level as DetailLevel);
        return {
          ...formatted,
          relevance: Math.round(score * 100) / 100
        };
      });

      const tokens = getTokenMetadata(query, formattedResults);

      const response = {
        query,
        domain: domain || 'all',
        totalMatches: results.length,
        results: formattedResults,
        _metadata: { tokens }
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };
    } catch (error) {
      console.error('search_standards error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

//===========================================
// Tool 6: search_by_practice - Filter by Science and Engineering Practice (SEP)
//===========================================
server.registerTool(
  'search_by_practice',
  {
    title: 'Search Standards by Science and Engineering Practice',
    description: 'Find all NGSS standards using a specific Science and Engineering Practice (SEP). Examples: "Developing and Using Models", "Analyzing and Interpreting Data", "Planning and Carrying Out Investigations"',
    inputSchema: {
      practice: z.enum(SEP_VALUES)
        .describe('Science and Engineering Practice name'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('full')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ practice, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      // Filter by SEP name (exact match)
      const filtered = allStandards.filter(s => s.sep.name === practice);

      const formattedStandards = formatResponseArray(filtered, detail_level as DetailLevel);
      const tokens = getTokenMetadata(practice, formattedStandards);

      const result = {
        practice,
        total: filtered.length,
        standards: formattedStandards,
        _metadata: { tokens }
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      console.error('search_by_practice error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

//===========================================
// Tool 7: search_by_crosscutting_concept - Filter by Crosscutting Concept (CCC)
//===========================================
server.registerTool(
  'search_by_crosscutting_concept',
  {
    title: 'Search Standards by Crosscutting Concept',
    description: 'Find all NGSS standards using a specific Crosscutting Concept (CCC). Examples: "Patterns", "Cause and Effect", "Systems and System Models", "Energy and Matter"',
    inputSchema: {
      concept: z.enum(CCC_VALUES)
        .describe('Crosscutting Concept name'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('full')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ concept, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      // Filter by CCC name (exact match)
      const filtered = allStandards.filter(s => s.ccc.name === concept);

      const formattedStandards = formatResponseArray(filtered, detail_level as DetailLevel);
      const tokens = getTokenMetadata(concept, formattedStandards);

      const result = {
        concept,
        total: filtered.length,
        standards: formattedStandards,
        _metadata: { tokens }
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      console.error('search_by_crosscutting_concept error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

//===========================================
// Tool 8: search_by_disciplinary_core_idea - Filter by Disciplinary Core Idea (DCI)
//===========================================
server.registerTool(
  'search_by_disciplinary_core_idea',
  {
    title: 'Search Standards by Disciplinary Core Idea',
    description: 'Find all NGSS standards using a specific Disciplinary Core Idea (DCI). Examples: "Definitions of Energy", "Interdependent Relationships in Ecosystems", "Weather and Climate"',
    inputSchema: {
      dci: z.enum(DCI_VALUES)
        .describe('Disciplinary Core Idea name'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('full')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ dci, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const allStandards = db.getAllStandards();

      // Filter by DCI name (exact match)
      const filtered = allStandards.filter(s => s.dci.name === dci);

      const formattedStandards = formatResponseArray(filtered, detail_level as DetailLevel);
      const tokens = getTokenMetadata(dci, formattedStandards);

      const result = {
        dci,
        total: filtered.length,
        standards: formattedStandards,
        _metadata: { tokens }
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      console.error('search_by_disciplinary_core_idea error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

//===========================================
// Tool 9: get_unit_suggestions - Recommend compatible standards for unit planning
//===========================================
server.registerTool(
  'get_unit_suggestions',
  {
    title: 'Get Unit Planning Suggestions',
    description: 'Recommend compatible NGSS standards for curriculum unit planning based on 3D framework overlap (domain, SEP, DCI, CCC). Example: Given anchor "MS-PS3-1" (energy), suggest 2-7 compatible standards that share similar practices, concepts, or disciplinary ideas for a cohesive unit',
    inputSchema: {
      anchor_code: z.string()
        .describe('The anchor NGSS standard code (e.g., "MS-PS3-1")'),
      unit_size: z.number()
        .min(2)
        .max(8)
        .default(3)
        .describe('Total number of standards in the unit (2-8), including the anchor'),
      detail_level: z.enum(['minimal', 'summary', 'full'])
        .optional()
        .default('summary')
        .describe('Response detail level: minimal (code, topic, PE 50 chars), summary (+ keywords top 3, PE 150 chars), full (complete standard)')
    }
  },
  async ({ anchor_code, unit_size, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();

      // Step 1: Fetch anchor standard (404 if not found)
      const anchor = db.getStandardByCode(anchor_code);
      if (!anchor) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'Not Found',
              message: `Standard not found: ${anchor_code}`,
              code: 'STANDARD_NOT_FOUND'
            }, null, 2)
          }],
          isError: true
        };
      }

      // Step 2: Get all candidates (exclude anchor)
      const allStandards = db.getAllStandards();
      const candidates = allStandards.filter(s => s.code !== anchor_code);

      // Step 3: Score each candidate
      const scored = candidates.map(candidate => scoreCompatibility(anchor, candidate));

      // Step 4: Sort by score descending, then by code ascending (tiebreaker)
      const sorted = scored.sort((a, b) =>
        b.score - a.score || a.standard.code.localeCompare(b.standard.code)
      );

      // Step 5: Take top N-1 results (unit_size includes anchor)
      const topSuggestions = sorted.slice(0, unit_size - 1);

      // Step 6: Format each suggestion with score breakdown
      const suggestions = topSuggestions.map(({ standard, score, breakdown }) => {
        const match_reasons: string[] = [];
        if (breakdown.domain_match > 0) {
          match_reasons.push(`Same domain: ${standard.domain} (+${breakdown.domain_match})`);
        }
        if (breakdown.shared_seps > 0) {
          match_reasons.push(`Shared SEP: "${standard.sep.name}" (+${breakdown.shared_seps})`);
        }
        if (breakdown.shared_cccs > 0) {
          match_reasons.push(`Shared CCC: "${standard.ccc.name}" (+${breakdown.shared_cccs})`);
        }
        if (breakdown.shared_dcis > 0) {
          match_reasons.push(`Shared DCI: "${standard.dci.name}" (+${breakdown.shared_dcis})`);
        }

        const formatted = formatResponse(standard, detail_level as DetailLevel);
        return {
          ...formatted,
          compatibility_score: score,
          match_reasons
        };
      });

      // Step 7: Format anchor standard
      const formattedAnchor = formatResponse(anchor, detail_level as DetailLevel);

      // Step 8: Build response
      const result = {
        anchor: formattedAnchor,
        suggestions,
        total_candidates: candidates.length
      };

      const tokens = getTokenMetadata(anchor_code, result);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...result,
            _metadata: { tokens }
          }, null, 2)
        }]
      };
    } catch (error) {
      console.error('get_unit_suggestions error:', error);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Internal Error',
            message: error instanceof Error ? error.message : String(error),
            code: 'INTERNAL_ERROR'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
);

// Server lifecycle management
let isShuttingDown = false;

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.error('📴 Shutting down gracefully...');
  try {
    await server.close();
  } catch (error) {
    console.error('Shutdown error:', error);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
async function main() {
  if (!isInitialized) {
    console.error('❌ Cannot start server: database initialization failed');
    process.exit(1);
  }

  const transport = new StdioServerTransport();

  transport.onerror = (error) => {
    if (!isShuttingDown) {
      console.error('❌ Transport error:', error);
    }
  };

  await server.connect(transport);
  console.error('🚀 NGSS MCP Server running on stdio');
  console.error('📚 Available tools: get_standard, search_by_domain, get_3d_components, search_standards');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
