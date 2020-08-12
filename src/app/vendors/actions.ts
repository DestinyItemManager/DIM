import { DestinyVendorsResponse } from 'bungie-api-ts/destiny2';
import { createAction } from 'typesafe-actions';
import { ThunkResult } from 'app/store/types';
import { getAllVendorDrops } from 'app/vendorEngramsXyzApi/vendorEngramsXyzService';
import { getVendors as getVendorsApi } from '../bungie-api/destiny2-api';
import { fetchRatingsForVendors } from './vendor-ratings';
import { DestinyAccount } from 'app/accounts/destiny-account';

export const loadedAll = createAction('vendors/LOADED_ALL')<{
  characterId: string;
  vendorsResponse: DestinyVendorsResponse;
}>();

export const loadedError = createAction('vendors/LOADED_ERROR')<{
  characterId: string;
  error: Error;
}>();

export function loadAllVendors(
  account: DestinyAccount,
  characterId: string,
  force = false
): ThunkResult {
  return async (dispatch, getState) => {
    // Only load at most once per 30 seconds
    if (
      !force &&
      Date.now() - (getState().vendors.vendorsByCharacter[characterId]?.lastLoaded.getTime() || 0) <
        30 * 1000
    ) {
      return;
    }

    if ($featureFlags.vendorEngrams) {
      dispatch(getAllVendorDrops());
    }

    try {
      const vendorsResponse = await getVendorsApi(account, characterId);
      dispatch(loadedAll({ vendorsResponse, characterId }));

      if ($featureFlags.reviewsEnabled && vendorsResponse) {
        dispatch(fetchRatingsForVendors(getState().manifest.d2Manifest!, vendorsResponse));
      }
    } catch (error) {
      dispatch(loadedError({ characterId, error }));
    }
  };
}
