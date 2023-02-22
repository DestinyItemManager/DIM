import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t, tl } from 'app/i18next-t';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import { symbolData, TranslateManually } from 'data/d2/symbol-name-sources';
import { createSelector } from 'reselect';
import { conversionTableSelector } from './rich-destiny-text';

const manualTranslations: { [key in TranslateManually]: string } = {
  [FontGlyphs.gilded_title]: tl('Glyphs.Gilded'),
  [FontGlyphs.hunter_smoke]: tl('Glyphs.Smoke'),
  [FontGlyphs.environment_hazard]: tl('Glyphs.Misadventure'),
  [FontGlyphs.void_quickfall]: tl('Glyphs.Quickfall'),
  [FontGlyphs.spear_launcher]: tl('Glyphs.ScorchCannon'),
  [FontGlyphs.kinetic]: tl('Glyphs.Kinetic'),
  [FontGlyphs.glaive_melee]: tl('Glyphs.GlaiveMelee'),
  [FontGlyphs.hive_relic]: tl('Glyphs.HiveSword'),
  [FontGlyphs.sword_melee]: tl('Glyphs.SwordMelee'),
  [FontGlyphs.titan]: tl('Glyphs.Titan'),
  [FontGlyphs.warlock]: tl('Glyphs.Warlock'),
  [FontGlyphs.hunter]: tl('Glyphs.Hunter'),
  [FontGlyphs.cabal]: tl('Glyphs.Cabal'),
  [FontGlyphs.hive_oryx]: tl('Glyphs.Hive'),
  [FontGlyphs.fallen_dusk]: tl('Glyphs.Fallen'),
  [FontGlyphs.vex]: tl('Glyphs.Vex'),
  [FontGlyphs.scorn]: tl('Glyphs.Scorn'),
  [FontGlyphs.kings_fall]: tl('Glyphs.Taken'),
  [FontGlyphs.gunsmith]: tl('Glyphs.Gunsmith'),
  [FontGlyphs.vanguard]: tl('Glyphs.Vanguard'),
  [FontGlyphs.accuracy]: tl('Glyphs.Accuracy'),
  [FontGlyphs.blast_radius]: tl('Glyphs.BlastRadius'),
  [FontGlyphs.charge_time]: tl('Glyphs.ChargeTime'),
  [FontGlyphs.draw_time]: tl('Glyphs.DrawTime'),
  [FontGlyphs.handling]: tl('Glyphs.Handling'),
  [FontGlyphs.impact]: tl('Glyphs.Impact'),
  [FontGlyphs.range]: tl('Glyphs.Range'),
  [FontGlyphs.reload_speed]: tl('Glyphs.ReloadSpeed'),
  [FontGlyphs.shield_duration]: tl('Glyphs.ShieldDuration'),
  [FontGlyphs.stability]: tl('Glyphs.Stability'),
  [FontGlyphs.velocity]: tl('Glyphs.Velocity'),
  [FontGlyphs.mobility]: tl('Glyphs.Mobility'),
  [FontGlyphs.resilience]: tl('Glyphs.Resilience'),
  [FontGlyphs.recovery]: tl('Glyphs.Recovery'),
  [FontGlyphs.discipline]: tl('Glyphs.Discipline'),
  [FontGlyphs.intellect]: tl('Glyphs.Intellect'),
  [FontGlyphs.strength]: tl('Glyphs.Strength'),
  [FontGlyphs.armor_class]: tl('Glyphs.ClassItem'),
  [FontGlyphs.light_large]: tl('Glyphs.Light'),
  [FontGlyphs.modification]: tl('Glyphs.Modification'),
  [FontGlyphs.respawn_restricted]: tl('Glyphs.RespawnRestricted'),
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
