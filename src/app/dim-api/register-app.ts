import { unauthenticatedApi } from './dim-api-helper';
import { ApiApp, ErrorResponse } from '@destinyitemmanager/dim-api-types';

export async function registerApp(dimAppName: string, bungieApiKey: string) {
  const appResponse = await unauthenticatedApi<{ app: ApiApp }>(
    {
      url: '/new_app',
      method: 'POST',
      body: {
        id: dimAppName,
        bungieApiKey,
        origin: window.location.origin
      }
    },
    true
  );

  // Check if request failed for various possible reasons
  if ('error' in appResponse) {
    const failResponse: ErrorResponse = appResponse; // Unexpected result, recast
    throw new Error('Could not register app: ' + failResponse.error + ' - ' + failResponse.message);
  }
  return appResponse.app;
}
