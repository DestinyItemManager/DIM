import { HttpStatusError } from 'app/bungie-api/http-client';
import { errorMessage } from 'app/utils/errors';
import { errorLog } from 'app/utils/log';
import { getAccessTokenFromCode } from './app/bungie-api/oauth';
import { setToken } from './app/bungie-api/oauth-tokens';
import { reportException } from './app/utils/sentry';

/**
 * The OAuth `state` Bungie sends back has to match the random value we generated
 * and stored before redirecting to login. A missing stored value (or a missing
 * returned state) must count as a mismatch: otherwise a callback that carries no
 * state at all satisfies a plain equality check whenever localStorage is empty
 * (both sides are `null`), which would let someone hand a victim a return link
 * with an attacker-supplied `code` and sign them into the wrong account.
 */
export function authStateMatches(state: string | null, storedState: string | null): boolean {
  return Boolean(storedState) && state === storedState;
}

async function handleAuthReturn() {
  const queryParams = new URL(window.location.href).searchParams;
  const code = queryParams.get('code');
  const state = queryParams.get('state');

  // Detect when we're in the iOS app's auth popup (but not in the app itself)
  const iOSApp = state?.startsWith('dimauth-') && !navigator.userAgent.includes('DIM AppStore');
  if (iOSApp) {
    window.location.href = window.location.href.replace('https', 'dimauth');
    return;
  }

  if (!code?.length) {
    setError("We expected an authorization code parameter from Bungie.net, but didn't get one.");
    return;
  }

  const authorizationState = localStorage.getItem('authorizationState');
  if (!authStateMatches(state, authorizationState)) {
    let error = "We expected the state parameter to match what we stored, but it didn't.";
    if (!authorizationState || authorizationState.length === 0) {
      error +=
        ' There was no stored state at all - your browser may not support (or may be blocking) localStorage.';
    }
    reportException('authReturn', new Error(error));
    setError(error);
    return;
  }

  try {
    const token = await getAccessTokenFromCode(code);
    setToken(token);
    // If we have a stored path from before we logged in (e.g. a loadout or armory link), send them back to that
    window.location.href = localStorage.getItem('returnPath') ?? $PUBLIC_PATH;
  } catch (error) {
    if (error instanceof TypeError || (error instanceof HttpStatusError && error.status === -1)) {
      setError(
        'A content blocker is interfering with either DIM or Bungie.net, or you are not connected to the internet.',
      );
      return;
    }
    errorLog('bungie auth', "Couldn't get access token", error);
    reportException('authReturn', error);
    setError(errorMessage(error));
  }
}

function setError(error: string) {
  document.getElementById('error-message')!.textContent = error;
  document.getElementById('error-display')!.style.display = 'block';
  document.getElementById('loading')!.style.display = 'none';
  document.getElementById('user-agent')!.textContent = navigator.userAgent;
}

// Skip the automatic run under unit tests so the state check can be imported and
// exercised in isolation.
if ($DIM_FLAVOR !== 'test') {
  handleAuthReturn();
}
