import { RootState } from 'app/store/types';
import { symbolData } from 'data/font/symbol-name-sources';
import { getTestDefinitions, setupi18n } from 'testing/test-utils';
import { symbolsSelector } from './destiny-symbols';
import { conversionTableSelector } from './rich-destiny-text';

test('dim-custom-symbols symbols map', async () => {
  setupi18n();
  const defs = await getTestDefinitions();

  for (const { codepoint, source } of symbolData) {
    if (!source?.fromRichText) {
      continue;
    }
    const { tableName, hash } = source;
    const def =
      tableName === 'Objective'
        ? defs.Objective.get(hash)
        : tableName === 'SandboxPerk'
          ? defs.SandboxPerk.get(hash)
          : undefined;

    if (!def) {
      throw new Error(
        `No definition exists for ${codepoint}: ${JSON.stringify(source)}. You may need to update the dim-custom-symbols repo.`,
      );
    }
  }

  const conversionTable = conversionTableSelector({ manifest: { d2Manifest: defs } } as RootState);
  for (const [key, value] of Object.entries(conversionTable)) {
    if (!value) {
      throw new Error(`Conversion table entry doesn't exist for ${key}`);
    }
    if (!value.plaintext || value.plaintext.length < 3) {
      throw new Error(
        `Conversion table entry ${key} has no plaintext. You may need to update the dim-custom-symbols repo.`,
      );
    }
    if (!value.unicode) {
      throw new Error(
        `Conversion table entry ${key} has no unicode. You may need to update the dim-custom-symbols repo.`,
      );
    }
  }

  const symbolsMap = symbolsSelector({ manifest: { d2Manifest: defs } } as RootState);

  for (const value of symbolsMap) {
    if (!value.name) {
      throw new Error(
        `Symbol ${JSON.stringify(value)} has no name. You may need to update the dim-custom-symbols repo.`,
      );
    }
    if (!value.fullName) {
      throw new Error(
        `Symbol ${JSON.stringify(value)} has no fullName. You may need to update the dim-custom-symbols repo.`,
      );
    }
  }
});
