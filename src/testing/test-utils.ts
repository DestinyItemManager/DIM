import { getBuckets } from 'app/destiny2/d2-buckets';
import { allTables, buildDefinitionsFromManifest } from 'app/destiny2/d2-definitions';
import { buildStores } from 'app/inventory/store/d2-store-factory';
import { downloadManifestComponents } from 'app/manifest/manifest-service-json';
import { percent } from 'app/shell/formatters';
import { humanBytes } from 'app/storage/human-bytes';
import { delay } from 'app/utils/promises';
import { AllDestinyManifestComponents, DestinyManifest } from 'bungie-api-ts/destiny2';
import { F_OK } from 'constants';
import { maxBy, once } from 'es-toolkit';
import i18next from 'i18next';
import fetchMock from 'jest-fetch-mock';
import de from 'locale/de.json' with { type: 'json' };
import en from 'locale/en.json' with { type: 'json' };
import es from 'locale/es.json' with { type: 'json' };
import esMX from 'locale/esMX.json' with { type: 'json' };
import fr from 'locale/fr.json' with { type: 'json' };
import it from 'locale/it.json' with { type: 'json' };
import ja from 'locale/ja.json' with { type: 'json' };
import ko from 'locale/ko.json' with { type: 'json' };
import pl from 'locale/pl.json' with { type: 'json' };
import ptBR from 'locale/ptBR.json' with { type: 'json' };
import ru from 'locale/ru.json' with { type: 'json' };
import zhCHS from 'locale/zhCHS.json' with { type: 'json' };
import zhCHT from 'locale/zhCHT.json' with { type: 'json' };
import fs from 'node:fs/promises';
import path from 'node:path';
import profile from 'testing/data/profile-2026-06-09.json' with { type: 'json' };
import vendors from 'testing/data/vendors-2026-06-29.json' with { type: 'json' };
import { getManifest as d2GetManifest } from '../app/bungie-api/destiny2-api';

/**
 * Get the current manifest as JSON. Downloads the manifest if not cached.
 */
// TODO: maybe use the fake indexeddb and just insert it from a file on startup??
// fake indexeddb + mock server (msw or jest-mock-fetch) to simulate the API??
export async function getTestManifestJson() {
  fetchMock.dontMock();
  try {
    // download and parse manifest
    const cacheDir = path.resolve(process.cwd(), 'manifest-cache');

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

    const filename = path.resolve(cacheDir, maxBy(mtimes, (f) => f.mtime)!.filename);
    return [
      JSON.parse(await fs.readFile(filename, 'utf-8')) as AllDestinyManifestComponents,
      filename,
    ] as const;
  }
}

export const getTestDefinitions = once(async () => {
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

export const getTestProfile = () => profile.Response;
export const fetchTestProfile = async () => profile.Response;
export const getTestVendors = () => vendors.Response;

export const getTestStores = once(async () => {
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
export async function setupi18n() {
  await i18next.init({
    lng: 'en',
    debug: true,
    lowerCaseLng: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: en,
      },
      ja: {
        translation: ja,
      },
      de: {
        translation: de,
      },
      es: {
        translation: es,
      },
      'es-mx': {
        translation: esMX,
      },
      fr: {
        translation: fr,
      },
      it: {
        translation: it,
      },
      ko: {
        translation: ko,
      },
      pl: {
        translation: pl,
      },
      'pt-br': {
        translation: ptBR,
      },
      ru: {
        translation: ru,
      },
      'zh-chs': {
        translation: zhCHS,
      },
      'zh-cht': {
        translation: zhCHT,
      },
    },
  });
  i18next.services.formatter?.add('pct', percent);
  i18next.services.formatter?.add('humanBytes', (val) => humanBytes(parseInt(val as string, 10)));
}
