import { getBungieNetSettings } from 'app/bungie-api/bungie-core-api';
import { ThunkResult } from 'app/store/types';
import { Destiny2CoreSettings } from 'bungie-api-ts/core';
import { createAction } from 'typesafe-actions';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

export const setD2Manifest = createAction('manifest/D2')<D2ManifestDefinitions>();
export const setD1Manifest = createAction('manifest/D1')<D1ManifestDefinitions>();
export const coreSettingsLoaded = createAction('manifest/CORE_SETTINGS')<Destiny2CoreSettings>();

export function loadCoreSettings(): ThunkResult {
  return async (dispatch, getState) => {
    if (getState().manifest.destiny2CoreSettings) {
      return;
    }

    const settings = await getBungieNetSettings();

    if (getState().manifest.destiny2CoreSettings) {
      return;
    }

    dispatch(coreSettingsLoaded(settings.destiny2CoreSettings));
  };
}
