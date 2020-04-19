import React from 'react';
import _ from 'lodash';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

import richTexts from 'data/d2/objective-richTexts.json';

import dmgArc from 'destiny-icons/weapons/damage_arc.svg';
import dmgVoid from 'destiny-icons/weapons/damage_void.svg';
import dmgSolar from 'destiny-icons/weapons/damage_solar.svg';
import dmgKinetic from 'destiny-icons/weapons/environment_hazard.svg';

import headshot from 'destiny-icons/weapons/headshot.svg';
import melee from 'destiny-icons/weapons/melee.svg';
import grenade from 'destiny-icons/weapons/grenade.svg';

import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';
import lFusionRifle from 'destiny-icons/weapons/wire_rifle.svg';

import handCannon from 'destiny-icons/weapons/hand_cannon.svg';
import shotgun from 'destiny-icons/weapons/shotgun.svg';
import smg from 'destiny-icons/weapons/smg.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import sidearm from 'destiny-icons/weapons/sidearm.svg';
import gLauncherFF from 'destiny-icons/weapons/grenade_launcher-field_forged.svg';

import gLauncher from 'destiny-icons/weapons/grenade_launcher.svg';
import rLauncher from 'destiny-icons/weapons/rocket_launcher.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';
import sword from 'destiny-icons/weapons/sword_heavy.svg';

import scorchCannon from 'destiny-icons/weapons/spear_launcher.svg';

import smlBlocker from 'destiny-icons/gambit/blocker_small.svg';
import medBlocker from 'destiny-icons/gambit/blocker_medium.svg';
import lrgBlocker from 'destiny-icons/gambit/blocker_large.svg';

import questMarker from 'destiny-icons/explore/quest.svg';

import overload from 'destiny-icons/breakers/overload.svg';
import pierce from 'destiny-icons/breakers/pierce.svg';
import stagger from 'destiny-icons/breakers/stagger.svg';

// matches a bracketed thing in the string, or certain private unicode characters
const iconPlaceholder = /(\[[^\]]+\]|[\uE000-\uF8FF])/g;
// prettier-ignore
// this table is too perfect to ruin
const baseConversionTable: {
  objectiveHash: number;
  unicode: string;
  substring: string | null;
  icon: string;
}[] = [
  // Damage Types
  { objectiveHash: richTexts['[Arc]'],   unicode: '', substring: null, icon: dmgArc     },
  { objectiveHash: richTexts['[Void]'],  unicode: '', substring: null, icon: dmgVoid    },
  { objectiveHash: richTexts['[Solar]'], unicode: '', substring: null, icon: dmgSolar   },
  { objectiveHash: richTexts['[Kill]'],  unicode: '', substring: null, icon: dmgKinetic },
  // Precision
  { objectiveHash: richTexts['[Headshot]'], unicode: '', substring: null, icon: headshot },
  // Abilities
  { objectiveHash: richTexts['[Melee]'],   unicode: '', substring: null, icon: melee   },
  { objectiveHash: richTexts['[Grenade]'], unicode: '', substring: null, icon: grenade },
  // All Rifle-class
  { objectiveHash: richTexts['[Auto Rifle]'],   unicode: '', substring: null, icon: autoRifle   },
  { objectiveHash: richTexts['[Pulse Rifle]'],  unicode: '', substring: null, icon: pulseRifle  },
  { objectiveHash: richTexts['[Scout Rifle]'],  unicode: '', substring: null, icon: scoutRifle  },
  { objectiveHash: richTexts['[Sniper Rifle]'], unicode: '', substring: null, icon: sniperRifle },
  { objectiveHash: richTexts['[Fusion Rifle]'], unicode: '', substring: null, icon: fusionRifle },
  { objectiveHash: richTexts['[Trace Rifle]'],  unicode: '', substring: null, icon: traceRifle  },
  {
    objectiveHash: richTexts['[Linear Fusion Rifle]'],
    unicode: '',
    substring: null,
    icon: lFusionRifle
  },
  // Remaining weapons, that are not heavy
  { objectiveHash: richTexts['[Hand Cannon]'], unicode: '', substring: null, icon: handCannon   },
  { objectiveHash: richTexts['[Shotgun]'],     unicode: '', substring: null, icon: shotgun      },
  { objectiveHash: richTexts['[SMG]'],         unicode: '', substring: null, icon: smg          },
  { objectiveHash: richTexts['[Bow]'],         unicode: '', substring: null, icon: bow          },
  { objectiveHash: richTexts['[Sidearm]'],     unicode: '', substring: null, icon: sidearm      },
  { objectiveHash: richTexts[''],             unicode: '', substring: null, icon: gLauncherFF },
  // Heavy Weapons
  {
    objectiveHash: richTexts['[Grenade Launcher]'],
    unicode: '',
    substring: null,
    icon: gLauncher
  },
  { objectiveHash: richTexts['[Rocket Launcher]'], unicode: '', substring: null, icon: rLauncher  },
  { objectiveHash: richTexts['[Machine Gun]'],     unicode: '', substring: null, icon: machinegun },
  { objectiveHash: richTexts['[Sword]'],           unicode: '', substring: null, icon: sword      },
  // Artifacts that can be picked up and used as weapons
  { objectiveHash: richTexts[''], unicode: '', substring: null, icon: scorchCannon },
  // Gambit - Blockers
  { objectiveHash: richTexts['[Small Blocker]'],  unicode: '', substring: null, icon: smlBlocker },
  { objectiveHash: richTexts['[Medium Blocker]'], unicode: '', substring: null, icon: medBlocker },
  { objectiveHash: richTexts['[Large Blocker]'],  unicode: '', substring: null, icon: lrgBlocker },
  // Quest Markers
  { objectiveHash: richTexts['[Quest]'], unicode: '', substring: null, icon: questMarker },
  // Breakers
  { objectiveHash: richTexts['[Disruption]'],      unicode: '', substring: null, icon: overload },
  { objectiveHash: richTexts['[Shield-Piercing]'], unicode: '', substring: null, icon: pierce   },
  { objectiveHash: richTexts['[Stagger]'],         unicode: '', substring: null, icon: stagger  }
];

/**
 * given defs, uses known examples from the manifest
 * and returns a localized string-to-icon conversion table
 *           "[Rocket Launcher]" -> <svg>
 */
const generateConversionTable = _.once((defs: D2ManifestDefinitions) => {
  // loop through conversionTable entries to update them with manifest string info
  baseConversionTable.forEach((iconEntry) => {
    const objectiveDef = defs.Objective.get(iconEntry.objectiveHash);
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
        ? text
        : // split into segments, filter out empty, try replacing each piece with an icon if one matches
          text
            .split(iconPlaceholder)
            .filter(Boolean)
            .map((t) => replaceWithIcon(generateConversionTable(defs), t))}
    </>
  );
}
