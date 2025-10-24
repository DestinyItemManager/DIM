/**
 * MCP (Model Context Protocol) middleware for webpack-dev-server
 * Exposes DIM's APIs to Claude Desktop and other MCP clients
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { createMCPHandlers } from '../server/mcp-handler';

let mcpServer: Server | null = null;

// Store tokens and API key sent from the browser
let browserTokens: any = null;
let apiKey: string | null = null;

/**
 * Initialize the MCP server instance
 */
function initializeMCPServer(): Server {
  if (mcpServer) {
    return mcpServer;
  }

  // Create MCP server
  mcpServer = new Server(
    {
      name: 'dim-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register tool handlers
  createMCPHandlers(mcpServer);

  console.log('[MCP] Server initialized at /mcp');

  return mcpServer;
}

/**
 * Setup MCP middleware for webpack-dev-server
 */
export function setupMCPMiddleware(middlewares: any[], devServer: any) {
  console.log('[MCP] Setting up MCP middleware...');

  // Enable JSON body parsing for all routes
  devServer.app.use(express.json());

  // Initialize MCP server
  const server = initializeMCPServer();

  // Add MCP endpoint handler
  devServer.app.post('/mcp', async (req: any, res: any) => {
    try {
      // Log incoming request
      console.log('[MCP] Incoming request:', req.body?.method);

      // Create transport for this request with stateless mode
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
      });

      // Connect server to transport
      await server.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[MCP] Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error),
          },
          id: null,
        });
      }
    }
  });

  // SSE endpoint for MCP Inspector
  devServer.app.get('/sse', async (req: any, res: any) => {
    console.log('[MCP] SSE connection request');

    try {
      // Create a new server instance for SSE (can't reuse connected servers)
      const sseServer = new Server(
        {
          name: 'dim-server',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        },
      );

      // Register tool handlers
      createMCPHandlers(sseServer);

      // Create SSE transport - it will handle headers and response
      const transport = new SSEServerTransport('/message', res);

      // Connect server to transport
      await sseServer.connect(transport);

      console.log('[MCP] SSE connection established');

      // Handle connection close
      req.on('close', () => {
        console.log('[MCP] SSE connection closed');
      });
    } catch (error) {
      console.error('[MCP] Error setting up SSE transport:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to establish SSE connection' });
      }
    }
  });

  // POST endpoint for SSE messages
  devServer.app.post('/message', async (req: any, res: any) => {
    try {
      console.log('[MCP] SSE message received:', req.body?.method);
      // The response will be sent via SSE, just acknowledge receipt
      res.status(202).end();
    } catch (error) {
      console.error('[MCP] Error handling SSE message:', error);
      res.status(500).json({ error: 'Internal error' });
    }
  });

  // Health check endpoint
  devServer.app.get('/mcp/health', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      mcp: 'ready',
      version: '1.0.0',
      hasTokens: browserTokens !== null,
    });
  });

  // Token registration endpoint - browser sends tokens here
  devServer.app.post('/api/mcp/register-tokens', (req: any, res: any) => {
    try {
      const tokens = req.body;

      if (tokens && (tokens.accessToken || tokens.access_token)) {
        browserTokens = tokens;
        apiKey = tokens.apiKey || null;
        res.json({ success: true, message: 'Tokens registered' });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid token format - expected accessToken or access_token',
          receivedKeys: Object.keys(tokens || {}),
        });
      }
    } catch (error) {
      console.error('[MCP] Error registering tokens:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  });

  // Token getter for auth manager
  devServer.app.get('/api/mcp/tokens', (_req: any, res: any) => {
    if (browserTokens) {
      res.json(browserTokens);
    } else {
      res.status(404).json({ error: 'No tokens available' });
    }
  });

  return middlewares;
}

/**
 * Get current browser tokens (for auth manager)
 */
export function getBrowserTokens() {
  return browserTokens;
}

/**
 * Get Bungie API key
 */
export function getApiKey() {
  return apiKey;
}
