import { errorLog } from 'app/utils/log';
import { getAccessTokenFromCode } from './app/bungie-api/oauth';
import { setToken } from './app/bungie-api/oauth-tokens';
import { reportException } from './app/utils/exceptions';

function handleAuthReturn() {
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
  if (state !== authorizationState) {
    let error = "We expected the state parameter to match what we stored, but it didn't.";
    if (!authorizationState || authorizationState.length === 0) {
      error +=
        ' There was no stored state at all - your browser may not support (or may be blocking) localStorage.';
    }
    reportException('authReturn', new Error(error));
    setError(error);
    return;
  }

  getAccessTokenFromCode(code)
    .then((token) => {
      setToken(token);
      window.location.href = '/';
    })
    .catch((error) => {
      if (error instanceof TypeError || error.status === -1) {
        setError(
          'A content blocker is interfering with either DIM or Bungie.net, or you are not connected to the internet.'
        );
        return;
      }
      errorLog('bungie auth', "Couldn't get access token", error);
      reportException('authReturn', error);
      setError(error.message || error.data?.error_description || 'Unknown');
    });
}

function setError(error: string) {
  document.getElementById('error-message')!.textContent = error;
  document.getElementById('error-display')!.style.display = 'block';
  document.getElementById('loading')!.style.display = 'none';
  document.getElementById('user-agent')!.textContent = navigator.userAgent;
}

handleAuthReturn();
