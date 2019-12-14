import React from 'react';
import _ from 'lodash';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

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
import damageKinetic from 'destiny-icons/weapons/environment_hazard.svg';
import headshot from 'destiny-icons/weapons/headshot.svg';
import damageArc from 'destiny-icons/weapons/damage_arc.svg';
import damageVoid from 'destiny-icons/weapons/damage_void.svg';
import wireRifle from 'destiny-icons/weapons/wire_rifle.svg';
import swordHeavy from 'destiny-icons/weapons/sword_heavy.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';
import smallBlocker from 'destiny-icons/gambit/blocker_small.svg';
import mediumBlocker from 'destiny-icons/gambit/blocker_medium.svg';
import largeBlocker from 'destiny-icons/gambit/blocker_large.svg';

// matches a bracketed thing in the string, or certain private unicode characters
const iconPlaceholder = /(\[[^\]]+\]|[\uE000-\uF8FF])/g;
// prettier-ignore
// this table is too perfect to ruin
const baseConversionTable: {
  icon: string;
  exampleObjectiveHash: number;
  unicode: string;
  substring: string | null;
}[] = [
  { icon: bow,             exampleObjectiveHash: 1242546978, unicode: '', substring: null },
  { icon: autoRifle,       exampleObjectiveHash: 532914921,  unicode: '', substring: null },
  { icon: pulseRifle,      exampleObjectiveHash: 2161000034, unicode: '', substring: null },
  { icon: scoutRifle,      exampleObjectiveHash: 2062881933, unicode: '', substring: null },
  { icon: handCannon,      exampleObjectiveHash: 53304862,   unicode: '', substring: null },
  { icon: shotgun,         exampleObjectiveHash: 635284441,  unicode: '', substring: null },
  { icon: sniperRifle,     exampleObjectiveHash: 3527067345, unicode: '', substring: null },
  { icon: fusionRifle,     exampleObjectiveHash: 3296270292, unicode: '', substring: null },
  { icon: smg,             exampleObjectiveHash: 2722409947, unicode: '', substring: null },
  { icon: rocketLauncher,  exampleObjectiveHash: 2203404732, unicode: '', substring: null },
  { icon: sidearm,         exampleObjectiveHash: 299893109,  unicode: '', substring: null },
  { icon: melee,           exampleObjectiveHash: 314405660,  unicode: '', substring: null },
  { icon: grenade,         exampleObjectiveHash: 3711356257, unicode: '', substring: null },
  { icon: grenadeLauncher, exampleObjectiveHash: 2152699013, unicode: '', substring: null },
  { icon: beamWeapon,      exampleObjectiveHash: 3080184954, unicode: '', substring: null },
  { icon: damageSolar,     exampleObjectiveHash: 2994623161, unicode: '', substring: null },
  { icon: damageKinetic,   exampleObjectiveHash: 1554970245, unicode: '', substring: null },
  { icon: headshot,        exampleObjectiveHash: 437290134,  unicode: '', substring: null },
  { icon: damageArc,       exampleObjectiveHash: 2178780271, unicode: '', substring: null },
  { icon: damageVoid,      exampleObjectiveHash: 400711454,  unicode: '', substring: null },
  { icon: wireRifle,       exampleObjectiveHash: 3373536132, unicode: '', substring: null },
  { icon: swordHeavy,      exampleObjectiveHash: 989767424,  unicode: '', substring: null },
  { icon: machinegun,      exampleObjectiveHash: 1788114534, unicode: '', substring: null },
  { icon: smallBlocker,    exampleObjectiveHash: 276438067,  unicode: '', substring: null },
  { icon: mediumBlocker,   exampleObjectiveHash: 3792840449, unicode: '', substring: null },
  { icon: largeBlocker,    exampleObjectiveHash: 2031240843, unicode: '', substring: null }
/*
  { icon: disruption,      exampleObjectiveHash: 3068403538, unicode: '', substring: null },
  { icon: shieldPiercing,  exampleObjectiveHash: 2678922819, unicode: '', substring: null },
  { icon: stagger,         exampleObjectiveHash: 3879088617, unicode: '', substring: null }
*/
];

/**
 * given defs, uses known examples from the manifest
 * and returns a localized string-to-icon conversion table
 *           "[Rocket launcher]" -> <svg>
 */
const generateConversionTable = _.once((defs) => {
  // loop through conversionTable entries to update them with manifest string info
  baseConversionTable.forEach((iconEntry) => {
    const objectiveDef = defs.Objective.get(iconEntry.exampleObjectiveHash);
    if (!objectiveDef) {
      return;
    }
    // lookup this lang's string for the objective
    const progressDescriptionMatch = objectiveDef.progressDescription.match(iconPlaceholder);
    const iconString = progressDescriptionMatch && progressDescriptionMatch[0];
    // this language's localized replacement, which we will detect and un-replace back into an icon
    iconEntry.substring = iconString;
  });
  return baseConversionTable;
});

const replaceWithIcon = (
  conversionRules: { icon: string; unicode: string; substring: string | null }[],
  textSegment: string
) => {
  const replacement = conversionRules.find(
    (r) => r.substring === textSegment || r.unicode === textSegment
  );
  return (
    (replacement && <img src={replacement.icon} title={textSegment} key={textSegment} />) || (
      <span key={textSegment}>{textSegment}</span>
    )
  );
};

/**
 * converts an objective description or other string to html nodes
 * identifies:
 * • bungie's localized placeholder strings
 * • special unicode characters representing weapon/etc icons in the game's font
 * and puts known SVG icons in their place
 */
export default function RichDestinyText({
  text,
  defs
}: {
  text: string;
  defs?: D1ManifestDefinitions | D2ManifestDefinitions;
}): React.ReactElement {
  return (
    <>
      {// don't bother processing without d2 defs
      !defs || defs.isDestiny1()
        ? { text }
        : // split into segments, filter out empty, try replacing each piece with an icon if one matches
          text
            .split(iconPlaceholder)
            .filter(Boolean)
            .map((t) => replaceWithIcon(generateConversionTable(defs), t))}
    </>
  );
}
