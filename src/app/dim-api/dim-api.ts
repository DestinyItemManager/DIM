import {
  DeleteAllResponse,
  DestinyVersion,
  ExportResponse,
  GetSharedLoadoutRequest,
  GetSharedLoadoutResponse,
  ImportResponse,
  Loadout,
  LoadoutShareRequest,
  LoadoutShareResponse,
  PlatformInfoResponse,
  ProfileResponse,
  ProfileUpdate,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { authenticatedApi, unauthenticatedApi } from './dim-api-helper';

export async function getGlobalSettings() {
  const response = await unauthenticatedApi<PlatformInfoResponse>(
    {
      // This uses "app" instead of "release" because I misremembered it when implementing the server
      url: `/platform_info?flavor=${$DIM_FLAVOR === 'release' ? 'app' : $DIM_FLAVOR}`,
      method: 'GET',
    },
    true,
  );
  return response.settings;
}

export async function getDimApiProfile(account?: DestinyAccount) {
  return authenticatedApi<ProfileResponse>({
    url: '/profile',
    method: 'GET',
    params: account
      ? {
          platformMembershipId: account.membershipId,
          destinyVersion: account.destinyVersion.toString(),
          components: 'settings,loadouts,tags,hashtags,searches,triumphs',
        }
      : {
          components: 'settings',
        },
  });
}

export async function importData(data: ExportResponse) {
  return authenticatedApi<ImportResponse>({
    url: '/import',
    method: 'POST',
    body: data,
  });
}

export async function postUpdates(
  platformMembershipId: string | undefined,
  destinyVersion: DestinyVersion | undefined,
  updates: ProfileUpdate[],
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

export async function createLoadoutShare(platformMembershipId: string, loadout: Loadout) {
  const request: LoadoutShareRequest = {
    platformMembershipId,
    loadout,
  };
  const response = await authenticatedApi<LoadoutShareResponse>({
    url: '/loadout_share',
    method: 'POST',
    body: request,
  });
  return response.shareUrl;
}

export async function getSharedLoadout(shareId: string) {
  const params = {
    shareId,
  } satisfies GetSharedLoadoutRequest;
  const response = await unauthenticatedApi<GetSharedLoadoutResponse>({
    url: '/loadout_share',
    method: 'GET',
    params,
  });
  return response.loadout;
}

export async function deleteAllData() {
  const response = await authenticatedApi<DeleteAllResponse>({
    url: '/delete_all_data',
    method: 'POST',
  });
  return response.deleted;
}

export async function exportDimApiData() {
  return authenticatedApi<ExportResponse>({
    url: '/export',
    method: 'GET',
  });
}
