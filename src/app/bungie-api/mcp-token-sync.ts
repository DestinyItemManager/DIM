/**
 * Syncs OAuth tokens to MCP server
 * This allows MCP tools to use the same auth as the browser app
 */

import { Tokens } from './oauth-tokens';

/**
 * Send current tokens to MCP server
 */
export async function syncTokensToMCP(tokens: Tokens) {
  try {
    // Include API key from localStorage for dev mode
    const apiKey = localStorage.getItem('apiKey');

    await fetch('/api/mcp/register-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...tokens,
        apiKey,
      }),
    });
    console.log('[MCP] Tokens synced to MCP server');
  } catch (error) {
    // Silent fail - MCP might not be enabled
    console.debug('[MCP] Could not sync tokens (MCP not running?)', error);
  }
}
