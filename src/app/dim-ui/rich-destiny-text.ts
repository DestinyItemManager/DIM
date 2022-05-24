import { FontGlyphs } from 'data/d2/d2-font-glyphs';
import type { StringsNeedingReplacement } from 'data/d2/objective-richTexts';
import richTextManifestExamples from 'data/d2/objective-richTexts';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

const glyphInfos: [exampleReplacement: StringsNeedingReplacement, codepoint: FontGlyphs][] = [
  // Damage Types
  ['[Arc]', FontGlyphs.arc], // 
  ['[Void]', FontGlyphs.void], // 
  ['[Solar]', FontGlyphs.thermal], // 
  ['[Stasis]', FontGlyphs.stasis], // 
  // ['[Kill]', FontGlyphs.environment_hazard], // 
  // Precision
  ['[Headshot]', FontGlyphs.headshot], // 
  // Abilities
  ['[Melee]', FontGlyphs.melee], // 
  ['[Grenade]', FontGlyphs.grenade], // 
  // All Rifle-class
  ['[Auto Rifle]', FontGlyphs.auto_rifle], // 
  ['[Pulse Rifle]', FontGlyphs.pulse_rifle], // 
  ['[Scout Rifle]', FontGlyphs.scout_rifle], // 
  ['[Sniper Rifle]', FontGlyphs.sniper_rifle], // 
  ['[Fusion Rifle]', FontGlyphs.fusion_rifle], // 
  ['[Trace Rifle]', FontGlyphs.beam_weapon], // 
  ['[Linear Fusion Rifle]', FontGlyphs.wire_rifle], // 
  // Remaining weapons, that are not heavy
  ['[Hand Cannon]', FontGlyphs.hand_cannon], // 
  ['[Shotgun]', FontGlyphs.shotgun], // 
  ['[SMG]', FontGlyphs.smg], // 
  ['[Bow]', FontGlyphs.bow], // 
  ['[Sidearm]', FontGlyphs.sidearm], // 
  ['[Special Grenade Launcher]', FontGlyphs.grenade_launcher_field_forged], // 
  ['[Glaive]', FontGlyphs.glaive], //
  // Heavy Weapons
  ['[Grenade Launcher]', FontGlyphs.grenade_launcher], // 
  ['[Rocket Launcher]', FontGlyphs.rocket_launcher], // 
  ['[Machine Gun]', FontGlyphs.machinegun], // 
  ['[Sword]', FontGlyphs.sword_heavy], // 
  // Artifacts that can be picked up and used as weapons
  ['', FontGlyphs.spear_launcher], // 
  // Map Markers
  ['[Quest]', FontGlyphs.quest], // 
  ['[Lost Sector]', FontGlyphs.lostsector], // 
  // Breakers
  ['[Disruption]', FontGlyphs.combat_role_overload], // 
  ['[Shield-Piercing]', FontGlyphs.combat_role_pierce], // 
  ['[Stagger]', FontGlyphs.combat_role_stagger], // 
  // New Items
  // ['[Currency]', FontGlyphs.UniFFFD_001], // 

  // Supers - these are unused right now
  // ['[Titan: Sentinel Super]', FontGlyphs.void_titan_super], // 
  // ['[Titan: Striker Super]', FontGlyphs.fist_of_havoc], // 
  // ['[Titan: Sunbreaker Super]', FontGlyphs.solar_titan_super], // 
  // ['[Hunter: Nightstalker Super]', FontGlyphs.void_hunter_super], // 
  // ['[Hunter: Arcstrider Super]', FontGlyphs.hunter_staff], // 
  // ['[Hunter: Gunslinger Super]', FontGlyphs.golden_gun], // 
  // ['[Warlock: Voidwalker Super]', FontGlyphs.nova_bomb], // 
  // ['[Warlock: Dawnblade Super]', FontGlyphs.warlock_blade], // 
];

// matches a bracketed thing in the string, or certain private unicode characters
export const iconPlaceholder = /(\[[^\]]+\]|[\uE000-\uF8FF])/g;

// this table converts manifest strings to their appropriate special unicode characters
// (and special unicode characters to themselves, but formatted)
// for example, if we were only setting this up for rocket launchers, with DIM set to english,
// generateConversionTable would end up outputting this:

// {
//   "[Rocket Launcher]": { plaintext:"[Rocket Launcher]", unicode:"" },
//   "": { plaintext:"[Rocket Launcher]", unicode:"" },
// }

export const conversionTable: NodeJS.Dict<{
  unicode: string;
  plaintext: string;
}> = {};

/**
 * given defs, uses known examples from the manifest
 * and returns a localized string-to-font glyph conversion table
 *           "[Rocket Launcher]" -> ""
 */
export const generateConversionTable = _.once(async (defs: D2ManifestDefinitions) => {
  // loop through conversionTable entries to update them with manifest string info
  for (const [exampleReplacement, codepoint] of glyphInfos) {
    // the single private use character in the d2 font that represents this
    const unicode = String.fromCodePoint(codepoint);

    // info we'll use to look up current language's version of the "[Rocket Launcher] final blows" objective
    const [tableName, hash] = richTextManifestExamples[exampleReplacement];
    const localizedString =
      tableName === 'Objective'
        ? defs.Objective.get(hash)?.progressDescription
        : tableName === 'SandboxPerk'
        ? defs.SandboxPerk.get(hash)?.displayProperties.description
        : undefined;

    // find just the text segment that says "[Rocket Launcher]" in current language
    const progressDescriptionMatch = localizedString?.match(iconPlaceholder)?.[0];

    // data we'll need later to render a glyph and give it a title attribute
    const thisReplacementInfo = { unicode, plaintext: progressDescriptionMatch ?? unicode };

    // insert it into the lookup table, keyed by the unicode character
    conversionTable[unicode] = thisReplacementInfo;

    // and also keyed by the matching string, if we found one
    if (progressDescriptionMatch) {
      conversionTable[progressDescriptionMatch] = thisReplacementInfo;
    }
  }

  // free up an absolutely minuscule bit of memory
  glyphInfos.length = 0;
  for (const k in richTextManifestExamples) {
    delete richTextManifestExamples[k];
  }
});
