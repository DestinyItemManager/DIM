import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t, tl } from 'app/i18next-t';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import { DimCustomSymbols } from 'data/d2/dim-custom-symbols';
import { symbolData, TranslateManually } from 'data/d2/symbol-name-sources';
import { createSelector } from 'reselect';
import { conversionTableSelector } from './rich-destiny-text';

const manualTranslations: { [key in TranslateManually]: string } = {
  [FontGlyphs.gilded_title]: tl('Glyphs.Gilded'),
  [FontGlyphs.hunter_smoke]: tl('Glyphs.Smoke'),
  [FontGlyphs.environment_hazard]: tl('Glyphs.Misadventure'),
  [FontGlyphs.void_quickfall]: tl('Glyphs.Quickfall'),
  /*
  [FontGlyphs.spear_launcher]: tl('Glyphs.ScorchCannon'),
  [DimCustomSymbols.kinetic]: tl('Glyphs.Kinetic'),
  [DimCustomSymbols.glaive_melee]: tl('Glyphs.GlaiveMelee'),
  */
  [DimCustomSymbols.hive_relic]: tl('Glyphs.HiveSword'),
  /*
  [DimCustomSymbols.sword_melee]: tl('Glyphs.SwordMelee'),
  [DimCustomSymbols.titan]: tl('Glyphs.Titan'),
  [DimCustomSymbols.warlock]: tl('Glyphs.Warlock'),
  [DimCustomSymbols.hunter]: tl('Glyphs.Hunter'),
  [DimCustomSymbols.cabal]: tl('Glyphs.Cabal'),
  [DimCustomSymbols.hive_oryx]: tl('Glyphs.Hive'),
  [DimCustomSymbols.fallen_dusk]: tl('Glyphs.Fallen'),
  [DimCustomSymbols.vex]: tl('Glyphs.Vex'),
  [DimCustomSymbols.scorn]: tl('Glyphs.Scorn'),
  [DimCustomSymbols.kings_fall]: tl('Glyphs.Taken'),
  [DimCustomSymbols.gunsmith]: tl('Glyphs.Gunsmith'),
  [DimCustomSymbols.vanguard]: tl('Glyphs.Vanguard'),
  [DimCustomSymbols.accuracy]: tl('Glyphs.Accuracy'),
  [DimCustomSymbols.blast_radius]: tl('Glyphs.BlastRadius'),
  [DimCustomSymbols.charge_time]: tl('Glyphs.ChargeTime'),
  [DimCustomSymbols.draw_time]: tl('Glyphs.DrawTime'),
  [DimCustomSymbols.handling]: tl('Glyphs.Handling'),
  [DimCustomSymbols.impact]: tl('Glyphs.Impact'),
  [DimCustomSymbols.range]: tl('Glyphs.Range'),
  [DimCustomSymbols.reload_speed]: tl('Glyphs.ReloadSpeed'),
  [DimCustomSymbols.shield_duration]: tl('Glyphs.ShieldDuration'),
  [DimCustomSymbols.stability]: tl('Glyphs.Stability'),
  [DimCustomSymbols.velocity]: tl('Glyphs.Velocity'),
  [DimCustomSymbols.mobility]: tl('Glyphs.Mobility'),
  [DimCustomSymbols.resilience]: tl('Glyphs.Resilience'),
  [DimCustomSymbols.recovery]: tl('Glyphs.Recovery'),
  [DimCustomSymbols.discipline]: tl('Glyphs.Discipline'),
  [DimCustomSymbols.intellect]: tl('Glyphs.Intellect'),
  [DimCustomSymbols.strength]: tl('Glyphs.Strength'),
  [DimCustomSymbols.armor_class]: tl('Glyphs.ClassItem'),
  [DimCustomSymbols.light_large]: tl('Glyphs.Light'),
  [DimCustomSymbols.modification]: tl('Glyphs.Modification'),
  */
  [DimCustomSymbols.respawn_restricted]: tl('Glyphs.RespawnRestricted'),
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
      const hardCodedName = t(manualTranslations[codepoint]);
      if (hardCodedName) {
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
        const defName = getTableLoc(defs, source.tableName, source.hash);
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
  }
);
