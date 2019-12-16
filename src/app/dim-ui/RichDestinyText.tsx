import React from 'react';
import _ from 'lodash';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

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
  { objectiveHash: 2178780271, unicode: '', substring: null, icon: dmgArc       },
  { objectiveHash:  400711454, unicode: '', substring: null, icon: dmgVoid      },
  { objectiveHash: 2994623161, unicode: '', substring: null, icon: dmgSolar     },
  { objectiveHash: 1554970245, unicode: '', substring: null, icon: dmgKinetic   },
  // Precision
  { objectiveHash:  437290134, unicode: '', substring: null, icon: headshot     },
  // Abilities
  { objectiveHash:  314405660, unicode: '', substring: null, icon: melee        },
  { objectiveHash: 3711356257, unicode: '', substring: null, icon: grenade      },
  // All Rifle-class
  { objectiveHash:  532914921, unicode: '', substring: null, icon: autoRifle    },
  { objectiveHash: 2161000034, unicode: '', substring: null, icon: pulseRifle   },
  { objectiveHash: 2062881933, unicode: '', substring: null, icon: scoutRifle   },
  { objectiveHash: 3527067345, unicode: '', substring: null, icon: sniperRifle  },
  { objectiveHash: 3296270292, unicode: '', substring: null, icon: fusionRifle  },
  { objectiveHash: 3080184954, unicode: '', substring: null, icon: traceRifle   },
  { objectiveHash: 3373536132, unicode: '', substring: null, icon: lFusionRifle },
  // Remaining weapons, that are not heavy
  { objectiveHash:   53304862, unicode: '', substring: null, icon: handCannon   },
  { objectiveHash:  635284441, unicode: '', substring: null, icon: shotgun      },
  { objectiveHash: 2722409947, unicode: '', substring: null, icon: smg          },
  { objectiveHash: 1242546978, unicode: '', substring: null, icon: bow          },
  { objectiveHash:  299893109, unicode: '', substring: null, icon: sidearm      },
  { objectiveHash: 2258101260, unicode: '', substring: null, icon: gLauncherFF  },
  // Heavy Weapons
  { objectiveHash: 2152699013, unicode: '', substring: null, icon: gLauncher    },
  { objectiveHash: 2203404732, unicode: '', substring: null, icon: rLauncher    },
  { objectiveHash: 1788114534, unicode: '', substring: null, icon: machinegun   },
  { objectiveHash:  989767424, unicode: '', substring: null, icon: sword        },
  // Artifacts that can be picked up and used as weapons
  { objectiveHash: 4231452845, unicode: '', substring: null, icon: scorchCannon },
  // Gambit - Blockers
  { objectiveHash:  276438067, unicode: '', substring: null, icon: smlBlocker   },
  { objectiveHash: 3792840449, unicode: '', substring: null, icon: medBlocker   },
  { objectiveHash: 2031240843, unicode: '', substring: null, icon: lrgBlocker   },
  // Quest Markers
  { objectiveHash: 3915460773, unicode: '', substring: null, icon: questMarker  },
  // Breakers
  { objectiveHash: 3068403538, unicode: '', substring: null, icon: overload     },
  { objectiveHash: 2678922819, unicode: '', substring: null, icon: pierce       },
  { objectiveHash: 3879088617, unicode: '', substring: null, icon: stagger      }
];

/**
 * given defs, uses known examples from the manifest
 * and returns a localized string-to-icon conversion table
 *           "[Rocket Launcher]" -> <svg>
 */
const generateConversionTable = _.once((defs) => {
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
        ? { text }
        : // split into segments, filter out empty, try replacing each piece with an icon if one matches
          text
            .split(iconPlaceholder)
            .filter(Boolean)
            .map((t) => replaceWithIcon(generateConversionTable(defs), t))}
    </>
  );
}
