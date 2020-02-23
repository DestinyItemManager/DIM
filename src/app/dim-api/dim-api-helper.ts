import { HttpClientConfig } from 'bungie-api-ts/http';
import { stringify } from 'simple-query-string';

/**
 * Call one of the unauthenticated DIM APIs.
 */
export async function unauthenticatedApi<T>(config: HttpClientConfig): Promise<T> {
  let url = `https://api.destinyitemmanager.com${config.url}`;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }
  const response = await fetch(
    new Request(url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      headers: config.body
        ? {
            // TODO: send an API Key
            // 'X-API-Key': DIM_API_KEY,
            'Content-Type': 'application/json'
          }
        : undefined
    })
  );

  return response.json() as Promise<T>;
}

/**
 * An app registered with the DIM API.
 */
export interface ApiApp {
  /** A short ID that uniquely identifies the app. */
  id: string;
  /** Apps must share their Bungie.net API key with us. */
  bungieApiKey: string;
  /** Apps also get a generated API key for accessing DIM APIs that don't involve user data. */
  dimApiKey: string;
  /** The origin used to allow CORS for this app. Only requests from this origin are allowed. */
  origin: string;
}
export async function registerApp(dimAppName: string, bungieApiKey: string) {
  const appResponse = await unauthenticatedApi<{ app: ApiApp }>({
    url: '/new_app',
    method: 'POST',
    body: {
      id: dimAppName,
      bungieApiKey,
      origin: window.location.origin
    }
  });

  return appResponse.app;
}
