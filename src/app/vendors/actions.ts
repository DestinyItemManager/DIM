import { XurLocation, XurLocationResponse } from '@d2api/d2api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { getVendors as getVendorsApi } from 'app/bungie-api/destiny2-api';
import { VENDORS } from 'app/search/d2-known-values';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { DestinyVendorsResponse } from 'bungie-api-ts/destiny2';
import { createAction } from 'typesafe-actions';

export const loadedAll = createAction('vendors/LOADED_ALL')<{
  characterId: string;
  vendorsResponse: DestinyVendorsResponse;
}>();

export const loadedError = createAction('vendors/LOADED_ERROR')<{
  characterId: string;
  error: Error;
}>();

export const loadedXur = createAction('vendors/LOADED_XUR')<XurLocation | undefined>();

export function loadAllVendors(
  account: DestinyAccount,
  characterId: string,
  force = false
): ThunkResult {
  return async (dispatch, getState) => {
    // Only load at most once per 30 seconds
    if (
      !force &&
      Date.now() -
        (getState().vendors.vendorsByCharacter[characterId]?.lastLoaded?.getTime() || 0) <
        30 * 1000
    ) {
      return;
    }

    try {
      const vendorsResponse = await getVendorsApi(account, characterId);
      dispatch(loadedAll({ vendorsResponse, characterId }));

      // If xur is a vendor, load their location
      if (
        vendorsResponse.vendors.data &&
        Object.values(vendorsResponse.vendors.data).some((v) => v.vendorHash === VENDORS.XUR)
      ) {
        dispatch(loadXurLocation());
      } else if (getState().vendors.xurLocation) {
        dispatch(loadedXur(undefined)); // clear out xur
      }
    } catch (error) {
      dispatch(loadedError({ characterId, error }));
    }
  };
}

function loadXurLocation(): ThunkResult {
  return async (dispatch) => {
    try {
      const xurLocation = await xurLocationFetch();
      dispatch(loadedXur(xurLocation || undefined));
    } catch (e) {
      errorLog('xur', e);
    }
  };
}

async function xurLocationFetch(): Promise<XurLocationResponse> {
  const request = new Request('https://paracausal.science/xur/current.json', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const response = await Promise.resolve(fetch(request));
  if (response.ok) {
    return response.json();
  }

  throw new Error("Unable to load Xur's location: " + response.status);
}
