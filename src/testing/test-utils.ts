import { getBuckets } from 'app/destiny2/d2-buckets';
import { allTables, buildDefinitionsFromManifest } from 'app/destiny2/d2-definitions';
import { DIM_LANG_INFOS } from 'app/i18n';
import { buildStores } from 'app/inventory/store/d2-store-factory';
import { downloadManifestComponents } from 'app/manifest/manifest-service-json';
import { humanBytes } from 'app/storage/human-bytes';
import { delay } from 'app/utils/promises';
import {
  AllDestinyManifestComponents,
  DestinyManifest,
  DestinyProfileResponse,
  DestinyVendorsResponse,
  ServerResponse,
} from 'bungie-api-ts/destiny2';
import { F_OK } from 'constants';
import i18next from 'i18next';
import fetchMock from 'jest-fetch-mock';
import en from 'locale/en.json';
import ja from 'locale/ja.json';
import _ from 'lodash';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getManifest as d2GetManifest } from '../app/bungie-api/destiny2-api';
import profile from './data/profile-2024-06-13.json';
import vendors from './data/vendors-2024-06-13.json';

/**
 * Get the current manifest as JSON. Downloads the manifest if not cached.
 */
// TODO: maybe use the fake indexeddb and just insert it from a file on startup??
// fake indexeddb + mock server (msw or jest-mock-fetch) to simulate the API??
export async function getTestManifestJson() {
  fetchMock.dontMock();
  try {
    // download and parse manifest
    const cacheDir = path.resolve(__dirname, '..', '..', 'manifest-cache');

    // In this mode we assume the last-written file in the manifest-cache directory is the one we want
    if (process.env.LOCAL_MANIFEST) {
      const result = await getLocalManifest(cacheDir);
      if (result) {
        return result;
      }
    }

    let manifest: DestinyManifest;
    for (let i = 0; ; i++) {
      try {
        manifest = await d2GetManifest();
        break;
      } catch (e) {
        if (i === 4) {
          // Fall back on local manifest when Bungie.net is down
          const result = await getLocalManifest(cacheDir);
          if (result) {
            return result;
          }
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
      return [
        JSON.parse(await fs.readFile(filename, 'utf-8')) as AllDestinyManifestComponents,
        filename,
      ] as const;
    }

    await fs.mkdir(cacheDir, { recursive: true });

    const manifestDb = await downloadManifestComponents(
      manifest.jsonWorldComponentContentPaths.en,
      allTables,
    );
    await fs.writeFile(filename, JSON.stringify(manifestDb), 'utf-8');
    return [manifestDb, filename] as const;
  } finally {
    fetchMock.dontMock();
  }
}

// This gets the local manifest by finding the most recently modified json file in the cache directory.
async function getLocalManifest(cacheDir: string) {
  const files = (await fs.readdir(cacheDir)).filter((f) => path.extname(f) === '.json');
  if (files.length) {
    const mtimes = await Promise.all(
      files.map(async (f) => ({
        filename: f,
        mtime: (await fs.stat(path.join(cacheDir, f))).mtime.getTime(),
      })),
    );

    const filename = path.resolve(cacheDir, _.maxBy(mtimes, (f) => f.mtime)!.filename);
    return [
      JSON.parse(await fs.readFile(filename, 'utf-8')) as AllDestinyManifestComponents,
      filename,
    ] as const;
  }
}

export const getTestDefinitions = _.once(async () => {
  const [manifestJson] = await getTestManifestJson();
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

export const getTestProfile = () =>
  (profile as unknown as ServerResponse<DestinyProfileResponse>).Response;
export const getTestVendors = () =>
  (vendors as unknown as ServerResponse<DestinyVendorsResponse>).Response;

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

/**
 * Set up i18n so the `t` function will work, for en and ja locales.
 *
 * Use `i18next.changeLanguage('en');` to set language before tests.
 */
export function setupi18n() {
  i18next.init({
    lng: 'en',
    debug: true,
    initImmediate: true,
    compatibilityJSON: 'v3',
    lowerCaseLng: true,
    interpolation: {
      escapeValue: false,
      format(val: string, format) {
        switch (format) {
          case 'pct':
            return `${Math.min(100, Math.floor(100 * parseFloat(val)))}%`;
          case 'humanBytes':
            return humanBytes(parseInt(val, 10));
          case 'number':
            return parseInt(val, 10).toLocaleString();
          default:
            return val;
        }
      },
    },
    resources: {
      en: {
        translation: en,
      },
      ja: {
        translation: ja,
      },
    },
  });

  for (const [otherLang, { pluralOverride }] of Object.entries(DIM_LANG_INFOS)) {
    if (pluralOverride) {
      // eslint-disable-next-line
      i18next.services.pluralResolver.addRule(
        otherLang,
        // eslint-disable-next-line
        i18next.services.pluralResolver.getRule('en'),
      );
    }
  }
}
