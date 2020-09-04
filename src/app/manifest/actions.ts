import { createAction } from 'typesafe-actions';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

export const setD2Manifest = createAction('manifest/D2')<D2ManifestDefinitions>();
export const setD1Manifest = createAction('manifest/D1')<D1ManifestDefinitions>();
