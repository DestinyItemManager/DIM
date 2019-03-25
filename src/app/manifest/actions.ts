import { createStandardAction } from 'typesafe-actions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions.service';

export const setD2Manifest = createStandardAction('manifest/D2')<D2ManifestDefinitions>();
export const setD1Manifest = createStandardAction('manifest/D1')<D1ManifestDefinitions>();
