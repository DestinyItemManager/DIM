import { unauthenticatedApi, authenticatedApi } from './dim-api-helper';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { ProfileResponse, GlobalSettings } from '@destinyitemmanager/dim-api-types';

export async function getGlobalSettings() {
  const response = await unauthenticatedApi<{ settings: GlobalSettings }>({
    url: '/platform_info',
    method: 'GET'
  });
  return response.settings;
}

export async function getDimApiProfile(account?: DestinyAccount) {
  const response = await authenticatedApi<ProfileResponse>({
    url: '/profile',
    method: 'GET',
    params: account
      ? {
          platformMembershipId: account.membershipId,
          destinyVersion: account.destinyVersion,
          components: 'settings,loadouts,tags'
        }
      : {
          components: 'settings'
        }
  });
  return response;
}
