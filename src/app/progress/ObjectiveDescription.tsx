import React from 'react';
import _ from 'lodash';
import { DestinyObjectiveDefinition } from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions.service';

// matches first bracketed thing in the string, or certain private unicode characters
const hashExtract = /^([^[\]]*)(\[[^[\]]+?\]|[\uE099-\uE154])(.*)$/u;

// conversionTable
const conversionTable = [
  { icon: 'bow', objectiveHash: 1242546978, substring: '' },
  { icon: 'auto_rifle', objectiveHash: 532914921, substring: '' },
  { icon: 'pulse_rifle', objectiveHash: 2161000034, substring: '' },
  { icon: 'scout_rifle', objectiveHash: 2062881933, substring: '' },
  { icon: 'hand_cannon', objectiveHash: 53304862, substring: '' },
  { icon: 'shotgun', objectiveHash: 635284441, substring: '' },
  { icon: 'sniper_rifle', objectiveHash: 3527067345, substring: '' },
  { icon: 'fusion_rifle', objectiveHash: 3296270292, substring: '' },
  { icon: 'smg', objectiveHash: 2722409947, substring: '' },
  { icon: 'rocket_launcher', objectiveHash: 2203404732, substring: '' },
  { icon: 'sidearm', objectiveHash: 299893109, substring: '' },
  { icon: 'melee', objectiveHash: 3951261483, substring: '' },
  { icon: 'grenade', objectiveHash: 3711356257, substring: '' },
  { icon: 'grenade_launcher', objectiveHash: 2152699013, substring: '' },
  { icon: 'beam_weapon', objectiveHash: 3080184954, substring: '' },
  { icon: 'damage_solar', objectiveHash: 2994623161, substring: '' },
  { icon: 'damage_kinetic', objectiveHash: 3924246227, substring: '' },
  { icon: 'headshot', objectiveHash: 3287913530, substring: '' },
  { icon: 'damage_arc', objectiveHash: 2178780271, substring: '' },
  { icon: 'damage_void', objectiveHash: 695106797, substring: '' },
  { icon: 'wire_rifle', objectiveHash: 2923868331, substring: '' },
  { icon: 'sword_heavy', objectiveHash: 989767424, substring: '' },
  { icon: 'machinegun', objectiveHash: 1788114534, substring: '' }
];

/* supplementConversionTable: replaces icon SVG filename with the actual SVG
 * localizes conversionTable by finding this language's replaceable substrings
 * adds substring value for icon insertion via replacement
 */
function supplementConversionTable(defs) {
  // loop through conversionTable entries to add SVGs and update them with manifest info
  conversionTable.forEach((iconEntry, index) => {
    const objectiveDef = defs.Objective.get(iconEntry.objectiveHash);

    // add corresponding SVG
    conversionTable[index].icon = require(`../../../destiny-icons/weapons/${iconEntry.icon}.svg`);

    // lookup this lang's string for the objective
    const progressDescription = objectiveDef.progressDescription;

    // match the first bracketed item, or the first zh character, plus beforestuff and afterstuff
    const iconString = progressDescription.match(hashExtract)[2];

    // the identified iconString is the manifest's replacement marker for this icon. put back into table
    conversionTable[index].substring = iconString;
  });
}

// update the conversion table once ever
const supplementOnce = _.once(supplementConversionTable);

// recurses progressDescription, looking for sequences to replace with icons
function replaceWithIcons(alreadyProcessed, remainingObjectiveString) {
  // run match against remainingObjectiveString
  const matchResults = remainingObjectiveString.match(hashExtract);

  // return immediately if there's nothing to try and replace
  if (!matchResults) {
    return alreadyProcessed.concat([remainingObjectiveString]);
  }

  // set variables to do replacement
  const [beforeMatch, iconString, afterMatch] = matchResults.slice(1);

  // look through conversionTable, find corresponding icon, group with processed material
  const replacementIndex = conversionTable.find((iconEntry) => iconEntry.substring === iconString);
  const replacement = replacementIndex ? replacementIndex.icon : iconString;
  const nowProcessed = alreadyProcessed.concat([
    beforeMatch,
    <img src={replacement} title={iconString} key={iconString} />
  ]);

  // send the rest to recurse and check for more brackets
  return replaceWithIcons(nowProcessed, afterMatch);
}

export default function ObjectiveDescription({
  displayName,
  objectiveDef,
  defs
}: {
  displayName: string;
  objectiveDef?: DestinyObjectiveDefinition;
  defs?: D2ManifestDefinitions | D1ManifestDefinitions;
}) {
  if (defs) {
    supplementOnce(defs);
  }

  // insert icons instead of icon markers
  const displayObjective = replaceWithIcons([], displayName);

  return (
    <div className="objective-description">
      {objectiveDef && objectiveDef.displayProperties.hasIcon && (
        <BungieImage src={objectiveDef.displayProperties.icon} />
      )}
      {displayObjective}
    </div>
  );
}
