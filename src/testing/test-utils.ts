import { buildDefinitionsFromManifest } from 'app/destiny2/d2-definitions';
import { F_OK } from 'constants';
import fs from 'fs/promises';
import _ from 'lodash';
import path from 'path';
import { getManifest as d2GetManifest } from '../app/bungie-api/destiny2-api';

/**
 * Get the current manifest as JSON. Downloads the manifest if not cached.
 */
// TODO: better to make the trimmed/parallel version
// TODO: maybe use the fake indexeddb and just insert it from a file on startup??
// fake indexeddb + mock server (msw or jest-mock-fetch) to simulate the API??
export async function getTestManifestJson() {
  // download and parse manifest
  const cacheDir = path.resolve(__dirname, '..', '..', 'manifest-cache');

  const manifest = await d2GetManifest();

  const enManifestUrl = manifest.jsonWorldContentPaths.en;
  const filename = path.resolve(cacheDir, path.basename(enManifestUrl));

  const fileExists = await fs
    .access(filename, F_OK)
    .then(() => true)
    .catch(() => false);

  if (fileExists) {
    return JSON.parse(await fs.readFile(filename, 'utf-8'));
  }

  await fs.mkdir(cacheDir, { recursive: true });
  const response = await fetch(`https://www.bungie.net${enManifestUrl}`);
  const data = await response.text();
  await fs.writeFile(filename, data, 'utf-8');
  return JSON.parse(data);
}

export const getTestDefinitions = _.once(async () => {
  const manifestJson = await getTestManifestJson();
  return buildDefinitionsFromManifest(manifestJson);
});

export function getProfile() {
  // use a stored profile
}

export function getStores() {
  // get processed stores
}

export function getExampleItems() {
  // tricky items
}
