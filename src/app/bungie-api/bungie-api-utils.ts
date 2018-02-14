import { IRequestConfig } from "angular";

export const API_KEY = ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') ? $DIM_WEB_API_KEY : localStorage.apiKey;

export function bungieApiUpdate(path: string, data?: object): IRequestConfig {
  return {
    method: 'POST',
    url: `https://www.bungie.net${path}`,
    headers: {
      'X-API-Key': API_KEY
    },
    withCredentials: true,
    data
  };
}

export function bungieApiQuery(path: string, params?: object): IRequestConfig {
  return {
    method: 'GET',
    url: `https://www.bungie.net${path}`,
    params,
    headers: {
      'X-API-Key': API_KEY
    },
    withCredentials: true
  };
}

export function oauthClientId(): string {
  return ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') ? $DIM_WEB_CLIENT_ID : localStorage.oauthClientId;
}

export function oauthClientSecret(): string {
  return ($DIM_FLAVOR === 'release' || $DIM_FLAVOR === 'beta') ? $DIM_WEB_CLIENT_SECRET : localStorage.oauthClientSecret;
}
