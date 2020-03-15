import { unauthenticatedApi, authenticatedApi } from './dim-api-helper';
import { DestinyAccount } from 'app/accounts/destiny-account';
import {
  ProfileResponse,
  GlobalSettings,
  ProfileUpdate,
  ProfileUpdateRequest,
  ProfileUpdateResult,
  DestinyVersion,
  AuditLogEntry
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

export async function postUpdates(
  platformMembershipId: string | undefined,
  destinyVersion: DestinyVersion | undefined,
  updates: ProfileUpdate[]
) {
  // Strip properties
  updates = updates.map((u) => ({ action: u.action, payload: u.payload })) as ProfileUpdate[];

  const request: ProfileUpdateRequest =
    platformMembershipId && destinyVersion
      ? {
          platformMembershipId,
          destinyVersion,
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

export async function getAuditLog() {
  const response = await authenticatedApi<{ log: AuditLogEntry[] }>({
    url: '/audit',
    method: 'GET'
  });
  return response.log;
}
