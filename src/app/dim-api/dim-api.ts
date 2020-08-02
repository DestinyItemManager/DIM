import { unauthenticatedApi, authenticatedApi } from './dim-api-helper';
import { DestinyAccount } from 'app/accounts/destiny-account';
import {
  ProfileResponse,
  ProfileUpdate,
  ProfileUpdateRequest,
  DestinyVersion,
  ExportResponse,
  PlatformInfoResponse,
  ImportResponse,
  ProfileUpdateResponse,
  AuditLogResponse,
  DeleteAllResponse,
} from '@destinyitemmanager/dim-api-types';
import { DimData } from 'app/storage/sync.service';

export async function getGlobalSettings() {
  const response = await unauthenticatedApi<PlatformInfoResponse>(
    {
      url: '/platform_info',
      method: 'GET',
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
          // TODO: triumphs
          components: 'settings,loadouts,tags,hashtags,searches',
        }
      : {
          components: 'settings',
        },
  });
  return response;
}

export async function importData(data: DimData) {
  const response = await authenticatedApi<ImportResponse>({
    url: '/import',
    method: 'POST',
    body: data,
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
          updates,
        }
      : {
          updates,
        };
  const response = await authenticatedApi<ProfileUpdateResponse>({
    url: '/profile',
    method: 'POST',
    body: request,
  });
  return response.results;
}

export async function getAuditLog() {
  const response = await authenticatedApi<AuditLogResponse>({
    url: '/audit',
    method: 'GET',
  });
  return response.log;
}

export async function deleteAllData() {
  const response = await authenticatedApi<DeleteAllResponse>({
    url: '/delete_all_data',
    method: 'POST',
  });
  return response.deleted;
}

export async function exportDimApiData() {
  const response = await authenticatedApi<ExportResponse>({
    url: '/export',
    method: 'GET',
  });
  return response;
}
