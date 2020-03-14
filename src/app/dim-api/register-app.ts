import { unauthenticatedApi } from './dim-api-helper';
import { ApiApp } from '@destinyitemmanager/dim-api-types';

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
