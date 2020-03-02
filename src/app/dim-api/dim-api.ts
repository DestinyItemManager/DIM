import { unauthenticatedApi, authenticatedApi } from './dim-api-helper';
import { DestinyAccount } from 'app/accounts/destiny-account';
import {
  ProfileResponse,
  GlobalSettings,
  ProfileUpdate,
  ProfileUpdateRequest,
  ProfileUpdateResult
} from '@destinyitemmanager/dim-api-types';
import { DimData } from 'app/storage/sync.service';

export async function getGlobalSettings() {
  const response = await unauthenticatedApi<{ settings: GlobalSettings }>(
    {
      url: '/platform_info',
      method: 'GET'
    },
    true
  );
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

export async function importData(data: DimData) {
  const response = await authenticatedApi<ProfileResponse>({
    url: '/import',
    method: 'POST',
    body: data
  });
  return response;
}

export async function postUpdates(account: DestinyAccount | undefined, updates: ProfileUpdate[]) {
  const request: ProfileUpdateRequest = account
    ? {
        platformMembershipId: account.membershipId,
        destinyVersion: account.destinyVersion,
        updates
      }
    : {
        updates
      };
  const response = await authenticatedApi<{ results: ProfileUpdateResult[] }>({
    url: '/profile',
    method: 'POST',
    body: request
  });
  return response.results;
}
