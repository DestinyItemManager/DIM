import { GlobalSettings } from './api-types';
import { unauthenticatedApi } from './dim-api-helper';

export async function getGlobalSettings() {
  try {
    const response = await unauthenticatedApi<{ settings: GlobalSettings }>({
      url: '/platform_info',
      method: 'GET'
    });
    return response.settings;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
