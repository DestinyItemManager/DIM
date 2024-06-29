import { I18nKey, t, tl } from 'app/i18next-t';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { StringLookup } from 'app/utils/util-types';
import { FontGlyphs } from 'data/font/d2-font-glyphs';
import { DimCustomSymbols } from 'data/font/dim-custom-symbols';
import { TranslateManually, symbolData } from 'data/font/symbol-name-sources';
import { createSelector } from 'reselect';
import { conversionTableSelector } from './rich-destiny-text';

const manualTranslations: { [key in TranslateManually]: I18nKey } = {
  // t('Glyphs.Smoke') Let's keep this for a bit
  [FontGlyphs.gilded_title]: tl('Glyphs.Gilded'),
  [FontGlyphs.environment_hazard]: tl('Glyphs.Misadventure'),
  [FontGlyphs.void_quickfall]: tl('Glyphs.Quickfall'),
  [FontGlyphs.spear_launcher]: tl('Glyphs.ScorchCannon'),
  [DimCustomSymbols.hive_relic]: tl('Glyphs.HiveSword'),
  [FontGlyphs.light]: tl('Glyphs.LightLevel'),
  [DimCustomSymbols.harmonic]: tl('Glyphs.Harmonic'),
  [DimCustomSymbols.respawn_restricted]: tl('Glyphs.RespawnRestricted'),
  [DimCustomSymbols.prismatic]: tl('Glyphs.Prismatic'),
  [FontGlyphs.void_titan_axe_throw_relic]: tl('Glyphs.Axe'),
  [FontGlyphs.light_ability]: tl('Glyphs.LightAbility'),
  [FontGlyphs.darkness_ability]: tl('Glyphs.DarkAbility'),
};

export type SymbolsMap = { glyph: string; name: string; fullName: string }[];

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
        const defName =
          source.tableName === 'Objective'
            ? defs[source.tableName].get(source.hash)?.progressDescription
            : defs[source.tableName].get(source.hash)?.displayProperties?.name;

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
