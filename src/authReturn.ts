import 'babel-polyfill';
// Promise.finally isn't in the base polyfill
import 'core-js/fn/promise/finally';
// Polyfill fetch for iOS < 10.3
import 'whatwg-fetch';

import { parse } from 'simple-query-string';
import { getAccessTokenFromCode } from './app/oauth/oauth.service';
import { setToken } from './app/oauth/oauth-token.service';

function handleAuthReturn() {
  const queryString = parse(window.location.href);

  const code = queryString.code;
  const state = queryString.state;
  const authorized = (code && code.length > 0);

  if (!authorized) {
    setError("We expected an authorization code parameter from Bungie.net, but didn't get one.");
    return;
  }

  if (state !== localStorage.authorizationState) {
    let error = "We expected the state parameter to match what we stored, but it didn't.";
    if (!localStorage.authorizationState) {
      error += " There was no stored state at all - your browser may not support (or may be blocking) localStorage.";
    }
    setError(error);
    return;
  }

  getAccessTokenFromCode(code)
    .then((token) => {
      setToken(token);
      window.location.href = "/index.html";
    })
    .catch((error) => {
      if (error.status === -1) {
        setError('A content blocker is interfering with either DIM or Bungie.net, or you are not connected to the internet.');
        return;
      }
      console.error(error);
      setError(error.message || (error.data && error.data.error_description) || "Unknown");
    });
}

function setError(error) {
  document.getElementById('error-message')!.innerText = error;
  document.getElementById('error-display')!.style.display = 'block';
  document.getElementById('loading')!.style.display = 'none';
}

handleAuthReturn();
