import { unauthenticatedApi } from './dim-api-helper';

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
