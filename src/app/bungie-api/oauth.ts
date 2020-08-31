import { oauthClientId, oauthClientSecret } from './bungie-api-utils';
import { Tokens, Token } from './oauth-tokens';

const TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/';

// https://www.bungie.net/en/Clan/Post/1777779/227330965/0/0

export function getAccessTokenFromRefreshToken(refreshToken: Token): Promise<Tokens> {
  // https://github.com/zloirock/core-js/issues/178#issuecomment-192081350
  const body = new URLSearchParams({
    grant_type: 'refresh_token', // eslint-disable-line @typescript-eslint/naming-convention
    refresh_token: refreshToken.value, // eslint-disable-line @typescript-eslint/naming-convention
    client_id: oauthClientId(), // eslint-disable-line @typescript-eslint/naming-convention
    client_secret: oauthClientSecret(), // eslint-disable-line @typescript-eslint/naming-convention
  });
  return Promise.resolve(
    fetch(TOKEN_URL, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then(handleAccessToken)
  );
}

export function getAccessTokenFromCode(code: string): Promise<Tokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code', // eslint-disable-line @typescript-eslint/naming-convention
    code,
    client_id: oauthClientId(), // eslint-disable-line @typescript-eslint/naming-convention
    client_secret: oauthClientSecret(), // eslint-disable-line @typescript-eslint/naming-convention
  });
  return Promise.resolve(
    fetch(TOKEN_URL, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then(handleAccessToken)
  );
}

function handleAccessToken(response): Tokens {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  if (response?.access_token) {
    const data = response;
    const inception = Date.now();
    const accessToken: Token = {
      value: data.access_token,
      expires: data.expires_in,
      name: 'access',
      inception,
    };

    const tokens: Tokens = {
      accessToken,
      bungieMembershipId: data.membership_id,
    };

    if (data.refresh_token) {
      tokens.refreshToken = {
        value: data.refresh_token,
        expires: data.refresh_expires_in,
        name: 'refresh',
        inception,
      };
    }

    return tokens;
  } else {
    throw new Error('No data or access token in response: ' + JSON.stringify(response));
  }
}
