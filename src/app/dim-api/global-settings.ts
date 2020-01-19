import { unauthenticatedApi } from './dim-api-helper';

/**
 * Global DIM platform settings from the DIM API.
 */
export interface GlobalSettings {
  /** Whether to use the DIM API for  */
  dimApiEnabled: boolean;
  /** Don't allow refresh more often than this many seconds. */
  destinyProfileMinimumRefreshInterval: number;
  /** Time in seconds to refresh the profile when autoRefresh is true. */
  destinyProfileRefreshInterval: number;
  /** Whether to refresh profile automatically. */
  autoRefresh: boolean;
  /** Whether to refresh profile when the page becomes visible after being in the background. */
  refreshProfileOnVisible: boolean;
  /** Whether to use dirty tricks to bust the Bungie.net cache when users manually refresh. */
  bustProfileCacheOnHardRefresh: boolean;
}

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
