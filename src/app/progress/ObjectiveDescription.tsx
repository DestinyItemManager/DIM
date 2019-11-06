import React from 'react';
import _ from 'lodash';
import { DestinyObjectiveDefinition } from 'bungie-api-ts/destiny2';
import BungieImage from '../dim-ui/BungieImage';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';

import bow from 'destiny-icons/weapons/bow.svg';
import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg';
import handCannon from 'destiny-icons/weapons/hand_cannon.svg';
import shotgun from 'destiny-icons/weapons/shotgun.svg';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import smg from 'destiny-icons/weapons/smg.svg';
import rocketLauncher from 'destiny-icons/weapons/rocket_launcher.svg';
import sidearm from 'destiny-icons/weapons/sidearm.svg';
import melee from 'destiny-icons/weapons/melee.svg';
import grenade from 'destiny-icons/weapons/grenade.svg';
import grenadeLauncher from 'destiny-icons/weapons/grenade_launcher.svg';
import beamWeapon from 'destiny-icons/weapons/beam_weapon.svg';
import damageSolar from 'destiny-icons/weapons/damage_solar.svg';
import damageKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
import headshot from 'destiny-icons/weapons/headshot.svg';
import damageArc from 'destiny-icons/weapons/damage_arc.svg';
import damageVoid from 'destiny-icons/weapons/damage_void.svg';
import wireRifle from 'destiny-icons/weapons/wire_rifle.svg';
import swordHeavy from 'destiny-icons/weapons/sword_heavy.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';

// matches first bracketed thing in the string, or certain private unicode characters
const hashExtract = /([[\]]*)(\[[^[\]]+?\]|[\uE099-\uE154])(.*)$/u;

function supplementedConversionTable(defs) {
  // conversionTable holds input & output rules for icon replacement. baseConversionTable is used to build it.
  const baseConversionTable = [
    { icon: bow, objectiveHash: 1242546978, substring: '' },
    { icon: autoRifle, objectiveHash: 532914921, substring: '' },
    { icon: pulseRifle, objectiveHash: 2161000034, substring: '' },
    { icon: scoutRifle, objectiveHash: 2062881933, substring: '' },
    { icon: handCannon, objectiveHash: 53304862, substring: '' },
    { icon: shotgun, objectiveHash: 635284441, substring: '' },
    { icon: sniperRifle, objectiveHash: 3527067345, substring: '' },
    { icon: fusionRifle, objectiveHash: 3296270292, substring: '' },
    { icon: smg, objectiveHash: 2722409947, substring: '' },
    { icon: rocketLauncher, objectiveHash: 2203404732, substring: '' },
    { icon: sidearm, objectiveHash: 299893109, substring: '' },
    { icon: melee, objectiveHash: 3951261483, substring: '' },
    { icon: grenade, objectiveHash: 3711356257, substring: '' },
    { icon: grenadeLauncher, objectiveHash: 2152699013, substring: '' },
    { icon: beamWeapon, objectiveHash: 3080184954, substring: '' },
    { icon: damageSolar, objectiveHash: 2994623161, substring: '' },
    { icon: damageKinetic, objectiveHash: 3924246227, substring: '' },
    { icon: headshot, objectiveHash: 3287913530, substring: '' },
    { icon: damageArc, objectiveHash: 2178780271, substring: '' },
    { icon: damageVoid, objectiveHash: 695106797, substring: '' },
    { icon: wireRifle, objectiveHash: 2923868331, substring: '' },
    { icon: swordHeavy, objectiveHash: 989767424, substring: '' },
    { icon: machinegun, objectiveHash: 1788114534, substring: '' }
  ];

  // loop through conversionTable entries to update them with manifest string info
  baseConversionTable.forEach((iconEntry, index) => {
    const objectiveDef = defs.Objective.get(iconEntry.objectiveHash);
    if (!objectiveDef) {
      return;
    }
    delete baseConversionTable[index].objectiveHash;

    // lookup this lang's string for the objective
    const progressDescription = objectiveDef.progressDescription;

    // match the first bracketed item, or the first zh character, plus beforestuff and afterstuff
    const iconString = progressDescription.match(hashExtract)[2];

    // the identified iconString is the manifest's replacement marker for this icon. put back into table
    baseConversionTable[index].substring = iconString;
  });

  return baseConversionTable;
}

// returns the string-to-svg conversion table
const conversionTable = _.once(supplementedConversionTable);

// recurses progressDescription, looking for sequences to replace with icons
function replaceWithIcons(
  conversionRules: { icon: string; substring: string }[],
  remainingObjectiveString: string,
  alreadyProcessed: (string | React.ReactElement)[] = []
) {
  // check remainingObjectiveString for replaceable strings
  const matchResults = remainingObjectiveString.match(hashExtract);

  // return immediately if there's nothing to try and replace
  if (!matchResults) {
    return alreadyProcessed.concat([remainingObjectiveString]);
  }

  // set variables to do replacement
  const [, beforeMatch, iconString, afterMatch] = matchResults;

  // look through conversionRules, find corresponding icon, group with processed material
  const replacementIndex = conversionRules.find((iconEntry) => iconEntry.substring === iconString);
  const replacement = replacementIndex ? replacementIndex.icon : iconString;
  const nowProcessed = alreadyProcessed.concat([
    <span key={beforeMatch}>{beforeMatch}</span>,
    <img src={replacement} title={iconString} key={iconString} />
  ]);

  // send the rest to recurse and check for more brackets
  return replaceWithIcons(conversionRules, afterMatch, nowProcessed);
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
  return (
    <div className="objective-description">
      {objectiveDef && objectiveDef.displayProperties.hasIcon && (
        <BungieImage src={objectiveDef.displayProperties.icon} />
      )}
      <EnhancedDescription displayName={displayName} defs={defs} />
    </div>
  );
}

// TODO: break out into a top level component.
export function EnhancedDescription({
  displayName,
  defs
}: {
  displayName: string;
  defs?: D2ManifestDefinitions | D1ManifestDefinitions;
}) {
  // insert icons instead of icon markers
  return defs ? replaceWithIcons(conversionTable(defs), displayName) : displayName;
}
