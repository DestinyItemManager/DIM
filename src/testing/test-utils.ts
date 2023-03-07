import { getBuckets } from 'app/destiny2/d2-buckets';
import { allTables, buildDefinitionsFromManifest } from 'app/destiny2/d2-definitions';
import { buildStores } from 'app/inventory/d2-stores';
import { downloadManifestComponents } from 'app/manifest/manifest-service-json';
import { delay } from 'app/utils/util';
import {
  DestinyManifest,
  DestinyProfileResponse,
  DestinyVendorsResponse,
} from 'bungie-api-ts/destiny2';
import { F_OK } from 'constants';
import fs from 'fs/promises';
import _ from 'lodash';
import path from 'path';
import { getManifest as d2GetManifest } from '../app/bungie-api/destiny2-api';
import profile from './data/profile-2023-02-28.json';
import vendors from './data/vendors-2023-02-28.json';

/**
 * Get the current manifest as JSON. Downloads the manifest if not cached.
 */
// TODO: better to make the trimmed/parallel version
// TODO: maybe use the fake indexeddb and just insert it from a file on startup??
// fake indexeddb + mock server (msw or jest-mock-fetch) to simulate the API??
export async function getTestManifestJson() {
  fetchMock.dontMock();
  try {
    // download and parse manifest
    const cacheDir = path.resolve(__dirname, '..', '..', 'manifest-cache');

    let manifest: DestinyManifest;
    for (let i = 0; ; i++) {
      try {
        manifest = await d2GetManifest();
        break;
      } catch (e) {
        if (i === 4) {
          throw e;
        }
        await delay(1000);
      }
    }

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

    const manifestDb = await downloadManifestComponents(
      manifest.jsonWorldComponentContentPaths.en,
      allTables
    );
    await fs.writeFile(filename, JSON.stringify(manifestDb), 'utf-8');
    return manifestDb;
  } finally {
    fetchMock.dontMock();
  }
}

export const getTestDefinitions = _.once(async () => {
  const manifestJson = await getTestManifestJson();
  return buildDefinitionsFromManifest(manifestJson);
});

export const testAccount = {
  displayName: 'VidBoi-BMC',
  originalPlatformType: 2,
  membershipId: '4611686018433092312',
  platformLabel: 'PlayStation',
  destinyVersion: 2,
  platforms: [1, 3, 5, 2],
  lastPlayed: '2021-05-08T03:34:26.000Z',
};

export const getTestProfile = () => (profile as any).Response as DestinyProfileResponse;
export const getTestVendors = () => (vendors as any).Response as DestinyVendorsResponse;

export const getTestStores = _.once(async () => {
  const manifest = await getTestDefinitions();

  const stores = buildStores({
    defs: manifest,
    buckets: getBuckets(manifest),
    profileResponse: getTestProfile(),
    customStats: [],
  });
  return stores;
});
