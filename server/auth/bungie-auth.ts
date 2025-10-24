/**
 * Bungie OAuth authentication manager for MCP server
 *
 * Uses tokens from the browser DIM instance via /api/mcp/register-tokens endpoint.
 * The browser sends tokens when it loads, and the MCP server uses them.
 */

import { getBrowserTokens } from '../../config/mcp-middleware';
import { openBrowserForAuth, shouldOpenBrowser } from './browser-launcher';

/**
 * OAuth token storage
 */
export interface BungieTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  membershipId: string;
}

/**
 * Bungie authentication manager
 */
export class BungieAuthManager {
  private tokens: BungieTokens | null = null;

  /**
   * Initialize auth from browser tokens
   * Tokens are sent from the browser to /api/mcp/register-tokens
   */
  async initialize(): Promise<void> {
    const browserTokens = getBrowserTokens();

    if (browserTokens && browserTokens.accessToken) {
      const accessToken = browserTokens.accessToken;
      const refreshToken = browserTokens.refreshToken;

      this.tokens = {
        accessToken: accessToken.value,
        refreshToken: refreshToken?.value || '',
        expiresAt: accessToken.inception + accessToken.expires * 1000,
        membershipId: browserTokens.bungieMembershipId,
      };
      console.log('[Auth] Initialized from browser tokens');
    } else {
      console.warn('[Auth] No tokens available from browser yet');

      // Automatically open browser if we should
      if (shouldOpenBrowser()) {
        console.log('[Auth] Attempting to open browser for authentication...');
        await openBrowserForAuth();
        console.log(
          '[Auth] After logging in, tokens will sync automatically. Please try your request again.',
        );
      } else {
        console.warn('[Auth] Browser already opened recently. Waiting for authentication...');
        console.warn('[Auth] Make sure DIM is loaded in the browser and authenticated');
      }
    }
  }

  /**
   * Get valid access token, checking browser for fresh tokens if needed
   */
  async getAccessToken(): Promise<string | null> {
    // Check if we need to refresh from browser
    if (!this.tokens || Date.now() >= this.tokens.expiresAt - 5 * 60 * 1000) {
      await this.initialize(); // Re-fetch from browser
    }

    return this.tokens?.accessToken || null;
  }

  /**
   * Get current membership ID
   */
  getMembershipId(): string | null {
    return this.tokens?.membershipId ?? null;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.tokens !== null;
  }
}

// Singleton instance
export const authManager = new BungieAuthManager();
