import angular from 'angular';
import { oauthClientId, oauthClientSecret } from '../services/bungie-api-utils';

const TOKEN_URL = 'https://www.bungie.net/platform/app/oauth/token/';

// https://www.bungie.net/en/Clan/Post/1777779/227330965/0/0
export function OAuthService($injector, $httpParamSerializer) {
  'ngInject';

  function handleAccessToken(response) {
    if (response && response.data && response.data.access_token) {
      const data = response.data;
      const inception = Date.now();
      const accessToken = {
        value: data.access_token,
        expires: data.expires_in,
        name: 'access',
        inception: inception
      };

      const tokens = {
        accessToken,
        bungieMembershipId: data.membership_id
      };

      if (data.refresh_token) {
        tokens.refreshToken = {
          value: data.refresh_token,
          expires: data.refresh_expires_in,
          name: 'refresh',
          inception: inception
        };
      }

      return tokens;
    } else {
      throw response;
    }
  }

  function getAccessTokenFromRefreshToken(refreshToken) {
    // Break a circular dependency
    const $http = $injector.get('$http');

    return $http({
      method: 'POST',
      url: TOKEN_URL,
      data: $httpParamSerializer({
        grant_type: 'refresh_token',
        refresh_token: refreshToken.value,
        client_id: oauthClientId(),
        client_secret: oauthClientSecret()
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(handleAccessToken);
  }

  function getAccessTokenFromCode(code) {
    // Break a circular dependency
    const $http = $injector.get('$http');

    return $http({
      method: 'POST',
      url: TOKEN_URL,
      data: $httpParamSerializer({
        code: code,
        client_id: oauthClientId(),
        client_secret: oauthClientSecret(),
        grant_type: 'authorization_code'
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(handleAccessToken);
  }

  return {
    getAccessTokenFromRefreshToken,
    getAccessTokenFromCode
  };
}

