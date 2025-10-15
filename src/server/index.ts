#!/usr/bin/env node
/**
 * NGSS MCP Server
 * Provides access to NGSS (Next Generation Science Standards) educational standards
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { initializeDatabase, getDatabase } from './database.js';

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

// Tool 1: get_standard - Lookup standard by code
server.registerTool(
  'get_standard',
  {
    title: 'Get NGSS Standard by Code',
    description: 'Retrieve a specific NGSS standard by its code identifier (e.g., MS-PS1-1, MS-LS2-3, MS-ESS3-1)',
    inputSchema: {
      code: z.string()
        .regex(/^MS-(PS|LS|ESS)\d+-\d+$/)
        .describe('NGSS standard code (format: MS-{PS|LS|ESS}{number}-{number})')
    }
  },
  async ({ code }) => {
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

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(standard, null, 2)
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
      domain: z.enum(['Physical Science', 'Life Science', 'Earth and Space Science', 'physical-science', 'life-science', 'earth-space-science'])
        .describe('Science domain to filter by')
    }
  },
  async ({ domain }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const standards = db.searchByDomain(domain);

      const result = {
        domain,
        count: standards.length,
        standards: standards.map(s => ({
          code: s.code,
          topic: s.topic,
          performance_expectation: s.performance_expectation.slice(0, 100) + (s.performance_expectation.length > 100 ? '...' : '')
        }))
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

// Tool 3: find_by_driving_question - Fuzzy search by driving questions
server.registerTool(
  'find_by_driving_question',
  {
    title: 'Find Standards by Driving Question',
    description: 'Fuzzy search for NGSS standards using driving questions with Levenshtein distance matching. Handles typos, word order variations, and partial matches. Returns matches with confidence >= 0.7.',
    inputSchema: {
      query: z.string().min(3).describe('Driving question query (handles typos and word order variations)'),
      limit: z.number().int().positive().default(10).describe('Maximum number of results to return')
    }
  },
  async ({ query, limit }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const results = db.findByDrivingQuestion(query);

      const limitedResults = results.slice(0, limit);

      const response = {
        query,
        totalMatches: results.length,
        returned: limitedResults.length,
        results: limitedResults.map(({ standard, score, matched_question }) => ({
          code: standard.code,
          confidence: Math.round(score * 100) / 100,
          matched_question: matched_question || null,
          topic: standard.topic,
          driving_questions: standard.driving_questions,
          performance_expectation: standard.performance_expectation.slice(0, 150) + (standard.performance_expectation.length > 150 ? '...' : '')
        }))
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response, null, 2)
        }]
      };
    } catch (error) {
      console.error('find_by_driving_question error:', error);
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

// Tool 4: get_3d_components - Extract 3D framework components
server.registerTool(
  'get_3d_components',
  {
    title: 'Get 3D Framework Components',
    description: 'Extract the three-dimensional learning components (SEP: Science and Engineering Practices, DCI: Disciplinary Core Ideas, CCC: Crosscutting Concepts) for a specific standard',
    inputSchema: {
      code: z.string()
        .regex(/^MS-(PS|LS|ESS)\d+-\d+$/)
        .describe('NGSS standard code')
    }
  },
  async ({ code }) => {
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

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
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
    description: 'Perform full-text search across all NGSS standard content including performance expectations, topics, keywords, and driving questions',
    inputSchema: {
      query: z.string().min(2).describe('Search query text'),
      domain: z.enum(['Physical Science', 'Life Science', 'Earth and Space Science']).optional().describe('Optional: filter by domain'),
      limit: z.number().int().positive().default(10).describe('Maximum number of results to return')
    }
  },
  async ({ query, domain, limit }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const options: { domain?: string; limit?: number } = { limit };
      if (domain !== undefined) {
        options.domain = domain;
      }
      const results = db.searchStandards(query, options);

      const response = {
        query,
        domain: domain || 'all',
        totalMatches: results.length,
        results: results.map(({ standard, score }) => ({
          code: standard.code,
          domain: standard.domain,
          topic: standard.topic,
          relevance: Math.round(score * 100) / 100,
          performance_expectation: standard.performance_expectation.slice(0, 150) + (standard.performance_expectation.length > 150 ? '...' : ''),
          keywords: standard.keywords.slice(0, 5)
        }))
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
  console.error('📚 Available tools: get_standard, search_by_domain, find_by_driving_question, get_3d_components, search_standards');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
