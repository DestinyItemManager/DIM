/**
 * Token management for MCP server
 *
 * This module handles:
 * - Storing OAuth tokens
 * - Token refresh logic
 * - Session management for MCP clients
 *
 * ARCHITECTURE NOTE:
 * For development, we can use in-memory storage.
 * For production, would need persistent storage (database, file, etc.)
 *
 * Current approach: In-memory storage (lost on server restart)
 * Future: Could use SQLite or Redis for persistence
 */

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  membershipId: string;
}

export interface SessionData {
  userId: string;
  tokens: TokenData;
  createdAt: number;
  lastUsed: number;
}

/**
 * In-memory token storage
 */
class TokenManager {
  private sessions = new Map<string, SessionData>();
  private readonly SESSION_TIMEOUT = 3600 * 1000; // 1 hour

  /**
   * Store tokens for a user session
   */
  setTokens(sessionId: string, tokens: TokenData): void {
    this.sessions.set(sessionId, {
      userId: tokens.membershipId,
      tokens,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });
    console.log(`[TokenManager] Stored tokens for session ${sessionId}`);
  }

  /**
   * Get tokens for a session
   */
  getTokens(sessionId: string): TokenData | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check session timeout
    if (Date.now() - session.lastUsed > this.SESSION_TIMEOUT) {
      console.log(`[TokenManager] Session ${sessionId} expired`);
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last used
    session.lastUsed = Date.now();
    return session.tokens;
  }

  /**
   * Remove tokens for a session
   */
  clearTokens(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`[TokenManager] Cleared tokens for session ${sessionId}`);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    const entries = Array.from(this.sessions.entries());
    for (const [sessionId, session] of entries) {
      if (now - session.lastUsed > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[TokenManager] Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    this.cleanupExpiredSessions();
    return this.sessions.size;
  }
}

// Singleton instance
export const tokenManager = new TokenManager();

// Run cleanup every 10 minutes
setInterval(
  () => {
    tokenManager.cleanupExpiredSessions();
  },
  10 * 60 * 1000,
);
