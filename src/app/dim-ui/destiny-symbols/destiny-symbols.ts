import { I18nKey, t, tl } from 'app/i18next-t';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { StringLookup } from 'app/utils/util-types';
import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import { DimCustomSymbols } from 'data/d2/dim-custom-symbols';
import { TranslateManually, symbolData } from 'data/d2/symbol-name-sources';
import { createSelector } from 'reselect';
import { conversionTableSelector } from './rich-destiny-text';

const manualTranslations: { [key in TranslateManually]: I18nKey } = {
  // t('Glyphs.Smoke') Let's keep this for a bit
  [FontGlyphs.gilded_title]: tl('Glyphs.Gilded'),
  [FontGlyphs.environment_hazard]: tl('Glyphs.Misadventure'),
  [FontGlyphs.void_quickfall]: tl('Glyphs.Quickfall'),
  [FontGlyphs.spear_launcher]: tl('Glyphs.ScorchCannon'),
  [DimCustomSymbols.hive_relic]: tl('Glyphs.HiveSword'),
  [DimCustomSymbols.harmonic]: tl('Glyphs.Harmonic'),
  [DimCustomSymbols.respawn_restricted]: tl('Glyphs.RespawnRestricted'),
  [FontGlyphs.light]: tl('Glyphs.LightLevel'),
};

export type SymbolsMap = { glyph: string; name: string; fullName: string }[];

const getTableLoc = (defs: D2ManifestDefinitions, tableName: string, hash: number) => {
  switch (tableName) {
    case 'Trait':
      return defs.Trait.get(hash)?.displayProperties?.name;
    case 'InventoryItem':
      return defs.InventoryItem.get(hash)?.displayProperties?.name;
    case 'SandboxPerk':
      return defs.SandboxPerk.get(hash)?.displayProperties?.name;
    case 'ActivityMode':
      return defs.ActivityMode[hash]?.displayProperties?.name;
    case 'Objective':
      return defs.Objective.get(hash)?.progressDescription;
    case 'ItemCategory':
      return defs.ItemCategory.get(hash)?.displayProperties?.name;
    case 'InventoryBucket':
      return defs.InventoryBucket[hash]?.displayProperties?.name;
    case 'Faction':
      return defs.Faction[hash]?.displayProperties?.name;
    case 'Stat':
      return defs.Stat.get(hash)?.displayProperties?.name;
    case 'DamageType':
      return defs.DamageType.get(hash)?.displayProperties?.name;
  }
};

const simplifyName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^\p{L}_]/gu, '');

export const symbolsSelector = createSelector(
  d2ManifestSelector,
  conversionTableSelector,
  (defs, richTextReplacements) => {
    const list: SymbolsMap = [];
    if (!defs) {
      return list;
    }

    for (const { codepoint, glyph, source } of symbolData) {
      const manualTranslation = (manualTranslations as StringLookup<I18nKey>)[codepoint];
      if (manualTranslation) {
        const hardCodedName = t(manualTranslation);
        list.push({
          glyph,
          fullName: hardCodedName,
          name: simplifyName(hardCodedName),
        });
        continue;
      }
      const richTextRepl = richTextReplacements[glyph];
      if (richTextRepl) {
        const fullName = richTextRepl.plaintext.slice(1, -1).trim();
        list.push({ glyph, fullName, name: simplifyName(fullName) });
        continue;
      }
      if (source) {
        const defName = defs[source.tableName].get(source.hash)?.displayProperties?.name;
        if (defName) {
          list.push({ glyph, fullName: defName, name: simplifyName(defName) });
          continue;
        }
      }

      list.push({
        glyph,
        fullName: t('Glyphs.Missing'),
        name: simplifyName(t('Glyphs.Missing')),
      });
    }
    return list;
  },
);
