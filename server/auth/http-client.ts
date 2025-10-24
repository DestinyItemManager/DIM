/**
 * Simple HTTP client for Bungie API in Node.js
 * This is a simplified version of DIM's browser HTTP client for use in the MCP server
 */

import type { HttpClientConfig } from 'bungie-api-ts/http';
import { getApiKey } from '../../config/mcp-middleware';
import { authManager } from './bungie-auth';

/**
 * Create a simple HTTP client for bungie-api-ts
 * Compatible with Node.js fetch
 */
export function createBungieHttpClient(apiKey: string, accessToken: string) {
  return async (config: HttpClientConfig) => {
    let url = config.url;
    if (config.params) {
      url = `${url}?${new URLSearchParams(config.params as Record<string, string>).toString()}`;
    }

    const response = await fetch(url, {
      method: config.method || 'GET',
      headers: {
        'X-API-Key': apiKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  };
}

/**
 * Create an authenticated Bungie API client
 * Handles all auth checks and throws descriptive errors if auth is not set up
 */
export async function createAuthenticatedBungieClient() {
  // Check authentication
  await authManager.initialize();
  const accessToken = await authManager.getAccessToken();
  const membershipId = authManager.getMembershipId();

  if (!accessToken || !membershipId) {
    throw new Error(
      'Not authenticated. A browser window should have opened automatically to DIM. Please log in with your Bungie account. After logging in, tokens will sync automatically. If the browser did not open, manually go to https://localhost:8080 and log in, then try again.',
    );
  }

  // Get API key from browser
  const bungieApiKey = getApiKey();
  if (!bungieApiKey) {
    throw new Error(
      'No API key available. Please ensure you have configured your Bungie API key in DIM developer settings.',
    );
  }

  // Create HTTP client using shared implementation
  const httpClient = createBungieHttpClient(bungieApiKey, accessToken);

  return { httpClient, accessToken, membershipId };
}
