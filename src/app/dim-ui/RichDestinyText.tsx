import { dynamicStringsSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import rT from 'data/d2/objective-richTexts';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';

// this table is too perfect to ruin so
// prettier-ignore
const baseConversionTable: {
  objectiveHash?: [string, number];
  unicode: string;
  substring?: string;
}[] = [
  // Damage Types
  { unicode: '', objectiveHash: rT['[Arc]']                        },
  { unicode: '', objectiveHash: rT['[Void]']                       },
  { unicode: '', objectiveHash: rT['[Solar]']                      },
  { unicode: '', objectiveHash: rT['[Stasis]']                     },
  { unicode: '', objectiveHash: rT['[Kill]']                       },
  // Precision
  { unicode: '', objectiveHash: rT['[Headshot]']                   },
  // Abilities
  { unicode: '', objectiveHash: rT['[Melee]']                      },
  { unicode: '', objectiveHash: rT['[Grenade]']                    },
  // All Rifle-class
  { unicode: '', objectiveHash: rT['[Auto Rifle]']                 },
  { unicode: '', objectiveHash: rT['[Pulse Rifle]']                },
  { unicode: '', objectiveHash: rT['[Scout Rifle]']                },
  { unicode: '', objectiveHash: rT['[Sniper Rifle]']               },
  { unicode: '', objectiveHash: rT['[Fusion Rifle]']               },
  { unicode: '', objectiveHash: rT['[Trace Rifle]']                },
  { unicode: '', objectiveHash: rT['[Linear Fusion Rifle]']        },
  // Remaining weapons, that are not heavy
  { unicode: '', objectiveHash: rT['[Hand Cannon]']                },
  { unicode: '', objectiveHash: rT['[Shotgun]']                    },
  { unicode: '', objectiveHash: rT['[SMG]']                        },
  { unicode: '', objectiveHash: rT['[Bow]']                        },
  { unicode: '', objectiveHash: rT['[Sidearm]']                    },
  { unicode: '', objectiveHash: rT['']                            },
  // Heavy Weapons
  { unicode: '', objectiveHash: rT['[Grenade Launcher]']            },
  { unicode: '', objectiveHash: rT['[Rocket Launcher]']             },
  { unicode: '', objectiveHash: rT['[Machine Gun]']                 },
  { unicode: '', objectiveHash: rT['[Sword]']                       },
  // Artifacts that can be picked up and used as weapons
  { unicode: '', objectiveHash: rT['']                             },
  // Gambit - Blockers
  { unicode: '', objectiveHash: rT['[Small Blocker]']               },
  { unicode: '', objectiveHash: rT['[Medium Blocker]']              },
  { unicode: '', objectiveHash: rT['[Large Blocker]']               },
  // Map Markers
  { unicode: '', objectiveHash: rT['[Quest]']                       },
  { unicode: '', objectiveHash: rT['[Lost Sector]']                 },
  // Breakers
  { unicode: '', objectiveHash: rT['[Disruption]']                  },
  { unicode: '', objectiveHash: rT['[Shield-Piercing]']             },
  { unicode: '', objectiveHash: rT['[Stagger]']                     },
  // Supers
  { unicode: '', objectiveHash: rT['[Titan: Sentinel Super]']      },
  { unicode: '', objectiveHash: rT['[Titan: Striker Super]']       },
  { unicode: '', objectiveHash: rT['[Titan: Sunbreaker Super]']    },
  { unicode: '', objectiveHash: rT['[Hunter: Nightstalker Super]'] },
  { unicode: '', objectiveHash: rT['[Hunter: Arcstrider Super]']   },
  { unicode: '', objectiveHash: rT['[Hunter: Gunslinger Super]']   },
  { unicode: '', objectiveHash: rT['[Warlock: Voidwalker Super]']  },
  { unicode: '', objectiveHash: rT['[Warlock: Dawnblade Super]']   },
  // New Items
  { unicode: '', objectiveHash: rT['[Currency]']                   }
]

// matches a bracketed thing in the string, or certain private unicode characters
const iconPlaceholder = /(\[[^\]]+\]|[\uE000-\uF8FF])/g;

/**
 * given defs, uses known examples from the manifest
 * and returns a localized string-to-font glyph conversion table
 *           "[Rocket Launcher]" -> ""
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

function replaceWithIcon(textSegment: string, index: number) {
  const replacement = baseConversionTable.find(
    (r) => r.substring === textSegment || r.unicode === textSegment
  );
  return (
    <span key={textSegment + index} title={replacement?.substring}>
      {replacement?.unicode ?? textSegment}
    </span>
  );
}

const dynamicTextFinder = /\{var:\d+\}/g;

/**
 * converts an objective description or other string to html nodes
 * identifies:
 * • bungie's localized placeholder strings
 * • special unicode characters representing weapon/etc icons in the game's font
 * and puts known SVG icons in their place
 *
 * include the characterId of the item's owner if possible
 */
export default function RichDestinyText({
  text,
  ownerId = '', // normalize for cleaner indexing later
}: {
  text?: string;
  ownerId?: string;
}): React.ReactElement {
  const defs = useD2Definitions();
  const dynamicStrings = useSelector(dynamicStringsSelector);

  // perform dynamic string replacement
  text = (text ?? '').replace(dynamicTextFinder, (segment) => {
    const hash = segment.match(/\d+/)![0];
    const dynamicValue =
      dynamicStrings?.byCharacter[ownerId]?.[hash] ?? dynamicStrings?.allProfile[hash];
    return dynamicValue?.toString() ?? segment;
  });

  // don't bother with further processing without d2 defs available
  if (!defs) {
    return <>{text}</>;
  }
  // if they are, do a 1-time table enrichment
  generateConversionTable(defs);

  // split into segments, filter out empty, try replacing each piece with an icon if one matches
  const richTextSegments = text
    .split(iconPlaceholder)
    .filter(Boolean)
    .map((t, index) => replaceWithIcon(t, index));
  return <>{richTextSegments}</>;
}
