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
import type { DetailLevel } from '../types/ngss.js';

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
  async ({ domain, detail_level }) => {
    try {
      ensureInitialized();
      const db = getDatabase();
      const standards = db.searchByDomain(domain);

      const formattedStandards = formatResponseArray(standards, detail_level as DetailLevel);
      const tokens = getTokenMetadata(domain, formattedStandards);

      const result = {
        domain,
        count: standards.length,
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
    description: 'Extract the three-dimensional learning components (SEP: Science and Engineering Practices, DCI: Disciplinary Core Ideas, CCC: Crosscutting Concepts) for a specific standard',
    inputSchema: {
      code: z.string()
        .regex(/^MS-(PS|LS|ESS)\d+-\d+$/)
        .describe('NGSS standard code'),
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
    description: 'Perform full-text search across all NGSS standard content including performance expectations, topics, keywords, and driving questions',
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
