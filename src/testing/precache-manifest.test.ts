import fs from 'node:fs/promises';
import path from 'node:path';
import { getTestManifestJson } from './test-utils';

test('precache manifest', async () => {
  const [_manifest, filename] = await getTestManifestJson();
  console.log('Loaded manifest to', filename);

  // This is for our CI workers - it prevents the cache from accumulating manifests
  if (process.env.CLEAN_MANIFEST_CACHE) {
    const cacheDir = path.resolve(__dirname, '..', '..', 'manifest-cache');
    const files = (await fs.readdir(cacheDir)).filter((f) => f !== path.basename(filename));
    console.log(
      'Cleaning manifest cache of files',
      files,
      files.map((f) => path.join(cacheDir, f)),
    );
    await Promise.all(files.map((f) => fs.unlink(path.join(cacheDir, f))));
  }
});
