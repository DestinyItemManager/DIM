/**
 * Browser launcher utility for MCP authentication
 * Opens the browser to DIM login page when authentication is needed
 */

import open from 'open';

/**
 * Configuration for browser launching
 */
const BROWSER_LAUNCHER_CONFIG = {
  // Don't open browser more than once per session by default
  cooldownMs: 60 * 60 * 1000, // 1 hour
  loginUrl: 'https://localhost:8080',
};

/**
 * Tracks when we last opened the browser
 */
let lastBrowserOpenTime: number | null = null;
let browserOpenAttempts = 0;

/**
 * Open the browser to the DIM login page
 * Includes cooldown to prevent multiple browser windows
 */
export async function openBrowserForAuth(): Promise<boolean> {
  const now = Date.now();

  // Check if we're in cooldown period
  if (lastBrowserOpenTime) {
    const timeSinceLastOpen = now - lastBrowserOpenTime;
    if (timeSinceLastOpen < BROWSER_LAUNCHER_CONFIG.cooldownMs) {
      const remainingMinutes = Math.ceil(
        (BROWSER_LAUNCHER_CONFIG.cooldownMs - timeSinceLastOpen) / 60000,
      );
      console.log(
        `[Auth] Browser already opened ${Math.floor(timeSinceLastOpen / 60000)} minutes ago. Wait ${remainingMinutes} more minutes before opening again.`,
      );
      return false;
    }
  }

  try {
    console.log('[Auth] Opening browser for authentication...');
    console.log(`[Auth] URL: ${BROWSER_LAUNCHER_CONFIG.loginUrl}`);
    console.log('[Auth] Please log in with your Bungie account');

    // Open the browser
    await open(BROWSER_LAUNCHER_CONFIG.loginUrl);

    // Track the open time
    lastBrowserOpenTime = now;
    browserOpenAttempts++;

    console.log(
      `[Auth] Browser opened successfully (attempt #${browserOpenAttempts} this session)`,
    );
    console.log('[Auth] Waiting for you to log in...');

    return true;
  } catch (error) {
    console.error('[Auth] Failed to open browser:', error);
    console.log(`[Auth] Please manually navigate to: ${BROWSER_LAUNCHER_CONFIG.loginUrl}`);
    return false;
  }
}

/**
 * Check if we should open the browser
 * Returns true if we're not in cooldown period
 */
export function shouldOpenBrowser(): boolean {
  if (!lastBrowserOpenTime) {
    return true;
  }

  const timeSinceLastOpen = Date.now() - lastBrowserOpenTime;
  return timeSinceLastOpen >= BROWSER_LAUNCHER_CONFIG.cooldownMs;
}

/**
 * Reset the browser open tracking
 * Useful for testing or forcing a new browser open
 */
export function resetBrowserLauncher(): void {
  lastBrowserOpenTime = null;
  browserOpenAttempts = 0;
  console.log('[Auth] Browser launcher state reset');
}

/**
 * Get the current cooldown status
 */
export function getCooldownStatus(): {
  inCooldown: boolean;
  minutesRemaining: number;
  totalAttempts: number;
} {
  if (!lastBrowserOpenTime) {
    return {
      inCooldown: false,
      minutesRemaining: 0,
      totalAttempts: browserOpenAttempts,
    };
  }

  const timeSinceLastOpen = Date.now() - lastBrowserOpenTime;
  const inCooldown = timeSinceLastOpen < BROWSER_LAUNCHER_CONFIG.cooldownMs;
  const minutesRemaining = inCooldown
    ? Math.ceil((BROWSER_LAUNCHER_CONFIG.cooldownMs - timeSinceLastOpen) / 60000)
    : 0;

  return {
    inCooldown,
    minutesRemaining,
    totalAttempts: browserOpenAttempts,
  };
}
