import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import React from 'react';
import _ from 'lodash';
import styles from './RichDestinyText.m.scss';

import autoRifle from 'destiny-icons/weapons/auto_rifle.svg';
import bow from 'destiny-icons/weapons/bow.svg';
import dmgArc from 'destiny-icons/weapons/damage_arc.svg';
import dmgKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
import dmgSolar from 'destiny-icons/weapons/damage_solar.svg';
import dmgVoid from 'destiny-icons/weapons/damage_void.svg';
import fusionRifle from 'destiny-icons/weapons/fusion_rifle.svg';
import gLauncher from 'destiny-icons/weapons/grenade_launcher.svg';
import gLauncherFF from 'destiny-icons/weapons/grenade_launcher-field_forged.svg';
import grenade from 'destiny-icons/weapons/grenade.svg';
import handCannon from 'destiny-icons/weapons/hand_cannon.svg';
import headshot from 'destiny-icons/weapons/headshot.svg';
import lFusionRifle from 'destiny-icons/weapons/wire_rifle.svg';
import lrgBlocker from 'destiny-icons/gambit/blocker_large.svg';
import machinegun from 'destiny-icons/weapons/machinegun.svg';
import medBlocker from 'destiny-icons/gambit/blocker_medium.svg';
import melee from 'destiny-icons/weapons/melee.svg';
import overload from 'destiny-icons/breakers/overload.svg';
import pierce from 'destiny-icons/breakers/pierce.svg';
import pulseRifle from 'destiny-icons/weapons/pulse_rifle.svg';
import questMarker from 'destiny-icons/explore/quest.svg';
import rLauncher from 'destiny-icons/weapons/rocket_launcher.svg';
import rT from 'data/d2/objective-richTexts.ts';
import scorchCannon from 'destiny-icons/weapons/spear_launcher.svg';
import scoutRifle from 'destiny-icons/weapons/scout_rifle.svg';
import shotgun from 'destiny-icons/weapons/shotgun.svg';
import sidearm from 'destiny-icons/weapons/sidearm.svg';
import smg from 'destiny-icons/weapons/smg.svg';
import smlBlocker from 'destiny-icons/gambit/blocker_small.svg';
import sniperRifle from 'destiny-icons/weapons/sniper_rifle.svg';
import stagger from 'destiny-icons/breakers/stagger.svg';
import sword from 'destiny-icons/weapons/sword_heavy.svg';
import traceRifle from 'destiny-icons/weapons/beam_weapon.svg';

import superVTitan from 'destiny-icons/supers/void_titan.svg';
import superATitan from 'destiny-icons/supers/arc_titan.svg';
import superSTitan from 'destiny-icons/supers/solar_titan.svg';

import superVHunter from 'destiny-icons/supers/void_hunter.svg';
import superAHunter from 'destiny-icons/supers/arc_hunter.svg';
import superSHunter from 'destiny-icons/supers/solar_hunter.svg';

import superVWarlock from 'destiny-icons/supers/void_warlock.svg';
// import superAWarlock from 'destiny-icons/supers/arc_warlock.svg';
import superSWarlock from 'destiny-icons/supers/solar_warlock.svg';

// matches a bracketed thing in the string, or certain private unicode characters
const iconPlaceholder = /(\[[^\]]+\]|[\uE000-\uF8FF])/g;

// prettier-ignore
// this table is too perfect to ruin
const baseConversionTable: {
  objectiveHash?: typeof rT[string];
  unicode: string;
  substring?: string;
  icon: string;
}[] = [
  // Damage Types
  { unicode: '', icon: dmgArc,        objectiveHash: rT['[Arc]']                        },
  { unicode: '', icon: dmgVoid,       objectiveHash: rT['[Void]']                       },
  { unicode: '', icon: dmgSolar,      objectiveHash: rT['[Solar]']                      },
  { unicode: '', icon: dmgKinetic,    objectiveHash: rT['[Kill]']                       },
  // Precision
  { unicode: '', icon: headshot,      objectiveHash: rT['[Headshot]']                   },
  // Abilities
  { unicode: '', icon: melee,         objectiveHash: rT['[Melee]']                      },
  { unicode: '', icon: grenade,       objectiveHash: rT['[Grenade]']                    },
  // All Rifle-class
  { unicode: '', icon: autoRifle,     objectiveHash: rT['[Auto Rifle]']                 },
  { unicode: '', icon: pulseRifle,    objectiveHash: rT['[Pulse Rifle]']                },
  { unicode: '', icon: scoutRifle,    objectiveHash: rT['[Scout Rifle]']                },
  { unicode: '', icon: sniperRifle,   objectiveHash: rT['[Sniper Rifle]']               },
  { unicode: '', icon: fusionRifle,   objectiveHash: rT['[Fusion Rifle]']               },
  { unicode: '', icon: traceRifle,    objectiveHash: rT['[Trace Rifle]']                },
  { unicode: '', icon: lFusionRifle,  objectiveHash: rT['[Linear Fusion Rifle]']        },
  // Remaining weapons, that are not heavy
  { unicode: '', icon: handCannon,    objectiveHash: rT['[Hand Cannon]']                },
  { unicode: '', icon: shotgun,       objectiveHash: rT['[Shotgun]']                    },
  { unicode: '', icon: smg,           objectiveHash: rT['[SMG]']                        },
  { unicode: '', icon: bow,           objectiveHash: rT['[Bow]']                        },
  { unicode: '', icon: sidearm,       objectiveHash: rT['[Sidearm]']                    },
  { unicode: '', icon: gLauncherFF,   objectiveHash: rT['']                            },
  // Heavy Weapons
  { unicode: '', icon: gLauncher,     objectiveHash: rT['[Grenade Launcher]']            },
  { unicode: '', icon: rLauncher,     objectiveHash: rT['[Rocket Launcher]']             },
  { unicode: '', icon: machinegun,    objectiveHash: rT['[Machine Gun]']                 },
  { unicode: '', icon: sword,         objectiveHash: rT['[Sword]']                       },
  // Artifacts that can be picked up and used as weapons
  { unicode: '', icon: scorchCannon,  objectiveHash: rT['']                             },
  // Gambit - Blockers
  { unicode: '', icon: smlBlocker,    objectiveHash: rT['[Small Blocker]']               },
  { unicode: '', icon: medBlocker,    objectiveHash: rT['[Medium Blocker]']              },
  { unicode: '', icon: lrgBlocker,    objectiveHash: rT['[Large Blocker]']               },
  // Quest Markers
  { unicode: '', icon: questMarker,   objectiveHash: rT['[Quest]']                       },
  // Breakers
  { unicode: '', icon: overload,      objectiveHash: rT['[Disruption]']                  },
  { unicode: '', icon: pierce,        objectiveHash: rT['[Shield-Piercing]']             },
  { unicode: '', icon: stagger,       objectiveHash: rT['[Stagger]']                     },
  // Supers
  { unicode: '', icon: superVTitan,   objectiveHash: rT['[Titan: Sentinel Super]']      },
  { unicode: '', icon: superATitan,   objectiveHash: rT['[Titan: Striker Super]']       },
  { unicode: '', icon: superSTitan,   objectiveHash: rT['[Titan: Sunbreaker Super]']    },
  { unicode: '', icon: superVHunter,  objectiveHash: rT['[Hunter: Nightstalker Super]'] },
  { unicode: '', icon: superAHunter,  objectiveHash: rT['[Hunter: Arcstrider Super]']   },
  { unicode: '', icon: superSHunter,  objectiveHash: rT['[Hunter: Gunslinger Super]']   },
  { unicode: '', icon: superVWarlock, objectiveHash: rT['[Warlock: Voidwalker Super]']  },
  { unicode: '', icon: superSWarlock, objectiveHash: rT['[Warlock: Dawnblade Super]']   }
]

/**
 * given defs, uses known examples from the manifest
 * and returns a localized string-to-icon conversion table
 *           "[Rocket Launcher]" -> '<svg>'
 */
const generateConversionTable = _.once((defs: D2ManifestDefinitions) => {
  // loop through conversionTable entries to update them with manifest string info
  baseConversionTable.forEach((iconEntry) => {
    if (!iconEntry.objectiveHash) {
      return;
    }
    const [lookupTable, hash] = iconEntry.objectiveHash;
    const localizedString =
      lookupTable === 'Objective'
        ? defs.Objective.get(hash)?.progressDescription
        : lookupTable === 'SandboxPerk'
        ? defs.SandboxPerk.get(hash)?.displayProperties.description
        : undefined;

    if (!localizedString) {
      return;
    }
    // lookup this lang's string for the objective
    const progressDescriptionMatch = localizedString.match(iconPlaceholder);
    const iconString = progressDescriptionMatch?.[0];
    // this language's localized replacement, which we will detect and un-replace back into an icon
    iconEntry.substring = iconString;
  });
});

const replaceWithIcon = (textSegment: string) => {
  const replacement = baseConversionTable.find(
    (r) => r.substring === textSegment || r.unicode === textSegment
  );
  return (
    (replacement && (
      <img
        src={replacement.icon}
        className={styles.inlineSvg}
        title={textSegment}
        key={textSegment}
      />
    )) || <span key={textSegment}>{textSegment}</span>
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
  defs,
}: {
  text?: string;
  defs?: D1ManifestDefinitions | D2ManifestDefinitions;
}): React.ReactElement {
  // don't bother processing without d2 defs available
  if (!defs?.isDestiny2()) {
    return <>{text}</>;
  }
  // if they are, do a 1-time table enrichment
  generateConversionTable(defs);
  return (
    <>
      {
        // split into segments, filter out empty, try replacing each piece with an icon if one matches
        (text ?? '')
          .split(iconPlaceholder)
          .filter(Boolean)
          .map((t) => replaceWithIcon(t))
      }
    </>
  );
}
