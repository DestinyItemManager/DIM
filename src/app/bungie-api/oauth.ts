import { infoLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/promises';
import { oauthClientId, oauthClientSecret } from './bungie-api-utils';
import { toHttpStatusError } from './http-client';
import { Token, Tokens, setToken } from './oauth-tokens';

// all these api url params don't match our variable naming conventions

const TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/';

/**
 * Get a new token given a valid refresh token. This can throw with a
 * full HTTP response!
 */
export const getAccessTokenFromRefreshToken = dedupePromise(
  async (refreshToken: Token): Promise<Tokens> => {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken.value,
      client_id: oauthClientId(),
      client_secret: oauthClientSecret(),
    });
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    if (response.ok) {
      const token = handleAccessToken((await response.json()) as OauthTokenResponse);
      setToken(token);
      infoLog('bungie auth', 'Successfully updated auth token from refresh token.');
      return token;
    } else {
      throw await toHttpStatusError(response);
    }
  },
);

export async function getAccessTokenFromCode(code: string): Promise<Tokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: oauthClientId(),
    client_secret: oauthClientSecret(),
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (response.ok) {
    return handleAccessToken((await response.json()) as OauthTokenResponse);
  } else {
    throw await toHttpStatusError(response);
  }
}

interface OauthTokenResponse {
  access_token: string;
  expires_in: number;
  membership_id: string;
  refresh_token?: string;
  refresh_expires_in: number;
}

function handleAccessToken(response: OauthTokenResponse | undefined): Tokens {
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
    throw new Error(`No data or access token in response: ${JSON.stringify(response)}`);
  }
}
