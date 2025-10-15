/**
 * PDF Reader - Wrapper for pdf-extraction MCP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class PDFReader {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private connectionPromise: Promise<void> | null = null;

  constructor() {}

  private async ensureConnected(): Promise<void> {
    if (this.client) return;

    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      await this.connectionPromise;
      return;
    }

    this.connectionPromise = (async () => {
      try {
        // Use the exact Python command configured in Claude Code
        this.transport = new StdioClientTransport({
          command: '/home/sallvain/.pyenv/versions/3.12.8/bin/python',
          args: ['-m', 'pdf_extraction']
        });

        this.client = new Client({
          name: 'ngss-mcp-pdf-client',
          version: '1.0.0'
        }, {
          capabilities: {}
        });

        await this.client.connect(this.transport);
      } catch (error) {
        this.client = null;
        this.transport = null;
        throw new Error(`Failed to connect to pdf-extraction MCP: ${error}`);
      } finally {
        this.connectionPromise = null;
      }
    })();

    await this.connectionPromise;
  }

  async extractPages(pdfPath: string, pages: string): Promise<string> {
    await this.ensureConnected();

    try {
      const result = await this.client!.callTool({
        name: 'extract-pdf-contents',
        arguments: {
          pdf_path: pdfPath,
          pages: pages
        }
      });

      // Extract text from MCP tool result
      if (Array.isArray(result.content) && result.content.length > 0) {
        const firstContent = result.content[0];
        if (firstContent && typeof firstContent === 'object' && 'type' in firstContent && firstContent.type === 'text' && 'text' in firstContent) {
          return (firstContent as { type: string; text: string }).text;
        }
      }

      throw new Error('Unexpected result format from pdf-extraction');
    } catch (error) {
      throw new Error(`PDF extraction failed for pages ${pages}: ${error}`);
    }
  }

  async extractAll(pdfPath: string): Promise<string> {
    await this.ensureConnected();

    try {
      const result = await this.client!.callTool({
        name: 'extract-pdf-contents',
        arguments: {
          pdf_path: pdfPath
          // No pages parameter = extract all
        }
      });

      if (Array.isArray(result.content) && result.content.length > 0) {
        const firstContent = result.content[0];
        if (firstContent && typeof firstContent === 'object' && 'type' in firstContent && firstContent.type === 'text' && 'text' in firstContent) {
          return (firstContent as { type: string; text: string }).text;
        }
      }

      throw new Error('Unexpected result format from pdf-extraction');
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error}`);
    }
  }

  async extractPageRange(
    pdfPath: string,
    startPage: number,
    endPage: number
  ): Promise<string> {
    const pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    ).join(',');

    return this.extractPages(pdfPath, pages);
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        console.error('Error closing MCP client:', error);
      } finally {
        this.client = null;
        this.transport = null;
      }
    }
  }
}

export interface PageContent {
  pageNumber: number;
  content: string;
}

export function parsePageContent(
  extractedText: string,
  requestedPages: string
): PageContent[] {
  const pageRegex = /Page (\d+):\s*([\s\S]*?)(?=Page \d+:|$)/g;
  const pages: PageContent[] = [];

  let match;
  while ((match = pageRegex.exec(extractedText)) !== null) {
    if (match[1] && match[2]) {
      pages.push({
        pageNumber: parseInt(match[1]),
        content: match[2].trim()
      });
    }
  }

  return pages;
}
