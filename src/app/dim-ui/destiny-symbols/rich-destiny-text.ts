import { d2ManifestSelector } from 'app/manifest/selectors';
import { symbolData } from 'data/font/symbol-name-sources';
import { createSelector } from 'reselect';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions';

// matches a bracketed thing in the string
export const iconPlaceholder = /(\[[^\]]+\])/g;

// this table converts manifest strings to their appropriate special unicode characters
// (and special unicode characters to themselves, but formatted)
// for example, if we were only setting this up for rocket launchers, with DIM set to english,
// generateConversionTable would end up outputting this:

// {
//   "[Rocket Launcher]": { plaintext:"[Rocket Launcher]", unicode:"" },
//   "": { plaintext:"[Rocket Launcher]", unicode:"" },
// }
export type RichTextConversionTable = NodeJS.Dict<{
  unicode: string;
  plaintext: string;
}>;

/**
 * given defs, uses known examples from the manifest
 * and returns a localized string-to-font glyph conversion table
 *           "[Rocket Launcher]" -> ""
 */
export const conversionTableSelector = createSelector(
  d2ManifestSelector,
  (defs: D2ManifestDefinitions | undefined) => {
    const conversionTable: RichTextConversionTable = {};

    if (!defs) {
      return conversionTable;
    }

    for (const { glyph, source } of symbolData) {
      if (!source?.fromRichText) {
        continue;
      }
      const unicode = glyph;
      const { tableName, hash } = source;
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

    return conversionTable;
  },
);
