import { t } from 'app/i18next-t';
import { D1_StatHashes } from 'app/search/d1-known-values';
import { lightStats } from 'app/search/search-filter-values';
import { getItemYear } from 'app/utils/item-utils';
import { errorLog, warnLog } from 'app/utils/log';
import {
  DestinyAmmunitionType,
  DestinyClass,
  DestinyDamageTypeDefinition,
  DestinyDisplayPropertiesDefinition,
} from 'bungie-api-ts/destiny2';
import missingSources from 'data/d1/missing_sources.json';
import _ from 'lodash';
import { vaultTypes } from '../../destiny1/d1-buckets';
import { D1ManifestDefinitions, DefinitionTable } from '../../destiny1/d1-definitions';
import { reportException } from '../../utils/exceptions';
import { InventoryBuckets } from '../inventory-buckets';
import { D1GridNode, D1Item, D1Stat, D1TalentGrid } from '../item-types';
import { D1Store } from '../store-types';
import { getQualityRating } from './armor-quality';
import { getBonus } from './character-utils';
import { createItemIndex } from './item-index';

// Maps tierType to tierTypeName in English
const tiers = ['Unknown', 'Unknown', 'Common', 'Uncommon', 'Rare', 'Legendary', 'Exotic'] as const;

/**
 * Process an entire list of items into DIM items.
 * @param owner the ID of the owning store.
 * @param items a list of "raw" items from the Destiny API
 * @return a promise for the list of items
 */
export function processItems(
  owner: D1Store,
  items: any[],
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets
): D1Item[] {
  const result: D1Item[] = [];
  for (const item of items) {
    let createdItem: D1Item | null = null;
    try {
      createdItem = makeItem(defs, buckets, item, owner);
    } catch (e) {
      errorLog('d1-stores', 'Error processing item', item, e);
      reportException('Processing D1 item', e);
    }
    if (createdItem !== null) {
      createdItem.owner = owner.id;
      result.push(createdItem);
    }
  }
  return result;
}

const getClassTypeNameLocalized = _.memoize((type: DestinyClass, defs: D1ManifestDefinitions) => {
  const klass = Object.values(defs.Class).find((c) => c.classType === type);
  if (klass) {
    return klass.className;
  } else {
    return t('Loadouts.Any');
  }
});

/**
 * Convert a D1DamageType to the D2 definition, so we don't have to maintain both codepaths
 */
const toD2DamageType = _.memoize(
  (damageType: {
    damageTypeHash: number;
    identifier: string;
    damageTypeName: string;
    description: string;
    iconPath: string;
    transparentIconPath: string;
    showIcon: boolean;
    enumValue: number;
    hash: number;
    index: number;
    redacted: boolean;
  }): DestinyDamageTypeDefinition =>
    /*    a d1 damagetype def looks like this:
    {
      "damageTypeHash": 2303181850,
      "identifier": "DAMAGE_TYPE_ARC",
      "damageTypeName": "Arc",
      "description": "This weapon causes Arc damage.",
      "iconPath": "/img/destiny_content/damage_types/arc.png",
      "transparentIconPath": "img/destiny_content/damage_types/arc_trans.png",
      "showIcon": true,
      "enumValue": 2,
      "hash": 2303181850,
      "index": 0,
      "redacted": false
    }
  i like the icons a lot
*/

    damageType && {
      displayProperties: {
        name: damageType.damageTypeName,
        description: damageType.description,
        icon: damageType.iconPath,
        hasIcon: true,
        highResIcon: '',
        iconSequences: [],
      },
      transparentIconPath: damageType.transparentIconPath,
      hash: damageType.hash,
      showIcon: damageType.showIcon,
      enumValue: damageType.enumValue,
      index: damageType.index,
      redacted: damageType.redacted,
    }
);

/**
 * Process a single raw item into a DIM item.s
 * @param defs the manifest definitions
 * @param buckets the bucket definitions
 * @param previousItems a set of item IDs representing the previous store's items
 * @param newItems a set of item IDs representing the previous list of new items
 * @param item "raw" item from the Destiny API
 * @param owner the ID of the owning store.
 */
function makeItem(
  defs: D1ManifestDefinitions,
  buckets: InventoryBuckets,
  item: any,
  owner: D1Store
) {
  let itemDef = defs.InventoryItem.get(item.itemHash);
  // Missing definition?
  if (!itemDef) {
    // maybe it is redacted...
    itemDef = {
      itemName: 'Missing Item',
      redacted: true,
    };
  }

  if (!itemDef.icon && !itemDef.action) {
    itemDef.classified = true;
    itemDef.classType = 3;
  }

  if (!itemDef.icon) {
    itemDef.icon = '/img/misc/missing_icon.png';
  }

  if (!itemDef.itemTypeName) {
    itemDef.itemTypeName = 'Unknown';
  }

  if (itemDef.redacted) {
    warnLog(
      'd1-stores',
      'Missing Item Definition:\n\n',
      item,
      '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.'
    );
  }

  if (!itemDef.itemName) {
    return null;
  }

  const numStats = _.size(itemDef.stats);

  // fix itemDef for defense items with missing nodes
  if (item.primaryStat?.statHash === D1_StatHashes.Defense && numStats > 0 && numStats !== 5) {
    const defaultMinMax = _.find(itemDef.stats, (stat) =>
      [144602215, 1735777505, 4244567218].includes(stat.statHash)
    );

    if (defaultMinMax) {
      [144602215, 1735777505, 4244567218].forEach((val) => {
        if (!itemDef.stats[val]) {
          itemDef.stats[val] = {
            maximum: defaultMinMax.maximum,
            minimum: defaultMinMax.minimum,
            statHash: val,
            value: 0,
          };
        }
      });
    }
  }

  // def.bucketTypeHash is where it goes normally
  let normalBucket = buckets ? buckets.byHash[itemDef.bucketTypeHash] : undefined;
  // item.bucket is where it IS right now
  let currentBucket = buckets.byHash[item.bucket] || normalBucket;
  if (!normalBucket) {
    currentBucket = normalBucket = buckets.unknown;
    buckets.setHasUnknown();
  }

  // We cheat a bit for items in the vault, since we treat the
  // vault as a character. So put them in the bucket they would
  // have been in if they'd been on a character.
  if (currentBucket.hash in vaultTypes) {
    // TODO: Remove this if Bungie ever returns bucket.id for classified
    // items in the vault.
    if (itemDef.classified && itemDef.itemTypeName === 'Unknown') {
      switch (currentBucket.hash) {
        case 4046403665:
          currentBucket = buckets.byType.Heavy;
          break;
        case 3003523923:
          currentBucket = buckets.byType.ClassItem;
          break;
        case 138197802:
          currentBucket = buckets.byType.Artifact;
          break;
      }
    } else {
      currentBucket = normalBucket;
    }
  }

  const itemType = normalBucket.type || 'Unknown';

  const element =
    (item.damageTypeHash && toD2DamageType(defs.DamageType.get(item.damageTypeHash))) || null;

  itemDef.sourceHashes ||= [];

  const missingSource = missingSources[itemDef.hash] || [];
  if (missingSource.length) {
    itemDef.sourceHashes = _.union(itemDef.sourceHashes, missingSource);
  }

  const createdItem: D1Item = {
    owner: owner.id,
    // figure out what year this item is probably from
    destinyVersion: 1,
    // The bucket the item is currently in
    location: currentBucket,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: normalBucket,
    hash: item.itemHash,
    // This is the type of the item (see dimCategory/dimBucketService) regardless of location
    type: itemType,
    itemCategoryHashes: itemDef.itemCategoryHashes || [],
    tier: tiers[itemDef.tierType] || 'Common',
    isExotic: tiers[itemDef.tierType] === 'Exotic',
    name: itemDef.itemName,
    description: itemDef.itemDescription || '', // Added description for Bounties for now JFLAY2015
    icon: itemDef.icon,
    secondaryIcon: itemDef.secondaryIcon,
    notransfer: Boolean(
      currentBucket.inPostmaster ||
        itemDef.nonTransferrable ||
        !itemDef.allowActions ||
        itemDef.classified
    ),
    id: item.itemInstanceId,
    equipped: item.isEquipped,
    equipment: item.isEquipment,
    equippingLabel:
      item.isEquipment && tiers[itemDef.tierType] === 'Exotic' ? normalBucket.sort : undefined,
    complete: item.isGridComplete,
    amount: item.stackSize || 1,
    primaryStat: item.primaryStat || null,
    typeName: itemDef.itemTypeName,
    isEngram: (itemDef.itemCategoryHashes || []).includes(34),
    // "perks" are the two or so talent grid items that are "featured" for an
    // item in its popup in the game. We don't currently use these.
    // perks: item.perks,
    equipRequiredLevel: item.equipRequiredLevel,
    maxStackSize: itemDef.maxStackSize > 0 ? itemDef.maxStackSize : 1,
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: itemDef.classType,
    classTypeNameLocalized: getClassTypeNameLocalized(itemDef.classType, defs),
    element,
    ammoType: getAmmoType(itemType),
    sourceHashes: itemDef.sourceHashes,
    lockable:
      normalBucket.type !== 'Class' &&
      ((currentBucket.inPostmaster && item.isEquipment) ||
        currentBucket.inWeapons ||
        item.lockable),
    trackable: Boolean(
      currentBucket.inProgress &&
        (currentBucket.hash === 2197472680 || currentBucket.hash === 1801258597)
    ),
    tracked: item.state === 2,
    locked: item.locked,
    classified: Boolean(itemDef.classified),
    // These get filled in later or aren't relevant to D1 items
    percentComplete: 0,
    talentGrid: null,
    stats: null,
    objectives: null,
    quality: null,
    sockets: null,
    breakerType: null,
    hidePercentage: false,
    taggable: false,
    comparable: false,
    power: item.primaryStat?.value ?? 0,
    index: '',
    infusable: false,
    infusionFuel: false,
    perks: null,
    masterworkInfo: null,
    infusionQuality: null,
    canPullFromPostmaster: false,
    uniqueStack: false,
    masterwork: false,
    missingSockets: false,
    energy: null,
    powerCap: null,
    pursuit: null,
  };

  // *able
  createdItem.taggable = Boolean(createdItem.lockable && !createdItem.isEngram);
  createdItem.comparable = Boolean(createdItem.equipment && createdItem.lockable);

  // Moving rare masks destroys them
  if (createdItem.itemCategoryHashes.includes(55) && createdItem.tier !== 'Legendary') {
    createdItem.notransfer = true;
  }

  if (createdItem.primaryStat) {
    const statDef = defs.Stat.get(createdItem.primaryStat.statHash);
    createdItem.primaryStat.stat = {
      ...statDef,
      // D2 is much better about display info
      displayProperties: {
        name: statDef.statName,
        description: statDef.statDescription,
        icon: statDef.icon,
        hasIcon: Boolean(statDef.icon),
      },
    };

    if (lightStats.includes(createdItem.primaryStat.statHash)) {
      createdItem.power = createdItem.primaryStat.value;
    }
  }

  try {
    createdItem.talentGrid = buildTalentGrid(item, defs.TalentGrid, defs.Progression);
  } catch (e) {
    errorLog('d1-stores', `Error building talent grid for ${createdItem.name}`, item, itemDef, e);
  }

  createdItem.infusable = Boolean(createdItem.talentGrid?.infusable);

  // An item can be used as infusion fuel if it is equipment, and has a primary stat that isn't Speed
  createdItem.infusionFuel = Boolean(
    createdItem.equipment && createdItem.primaryStat?.statHash !== 1501155019
  );

  try {
    createdItem.stats = buildStats(item, itemDef, defs.Stat, createdItem.talentGrid, itemType);

    if (createdItem.stats?.length === 0) {
      createdItem.stats = buildStats(item, item, defs.Stat, createdItem.talentGrid, itemType);
    }
  } catch (e) {
    errorLog('d1-stores', `Error building stats for ${createdItem.name}`, item, itemDef, e);
  }

  createdItem.objectives = item.objectives?.length > 0 ? item.objectives : null;

  if (createdItem.talentGrid && createdItem.infusable) {
    try {
      createdItem.quality = getQualityRating(createdItem.stats, item.primaryStat, itemType);
    } catch (e) {
      errorLog(
        'd1-stores',
        `Error building quality rating for ${createdItem.name}`,
        item,
        itemDef,
        e
      );
    }
  }

  // More objectives properties
  if (createdItem.objectives) {
    const objectives = createdItem.objectives;
    createdItem.complete =
      (!createdItem.talentGrid || createdItem.complete) &&
      createdItem.objectives.every((o) => o.complete);
    createdItem.percentComplete = _.sumBy(createdItem.objectives, (objective) => {
      if (objective.completionValue) {
        return (
          Math.min(1, (objective.progress || 0) / objective.completionValue) / objectives.length
        );
      } else {
        return 0;
      }
    });
  } else if (createdItem.talentGrid) {
    createdItem.percentComplete = Math.min(
      1,
      createdItem.talentGrid.totalXP / createdItem.talentGrid.totalXPRequired
    );
    createdItem.complete =
      getItemYear(createdItem) === 1
        ? createdItem.talentGrid.totalXP === createdItem.talentGrid.totalXPRequired
        : createdItem.talentGrid.complete;
  }

  // "The Life Exotic" perk means you can equip other exotics, so clear out the equipping label
  if (
    createdItem.isExotic &&
    createdItem.talentGrid &&
    createdItem.talentGrid.nodes.some((n) => n.hash === 4044819214)
  ) {
    createdItem.equippingLabel = undefined;
  }

  createdItem.index = createItemIndex(createdItem);

  return createdItem;
}

function getAmmoType(itemType: string) {
  switch (itemType) {
    case 'Primary':
      return DestinyAmmunitionType.Primary;
    case 'Special':
      return DestinyAmmunitionType.Special;
    case 'Heavy':
      return DestinyAmmunitionType.Heavy;
  }

  return DestinyAmmunitionType.None;
}

function buildTalentGrid(
  item: {
    talentGridHash: number;
    progression: { progressionHash: number; currentProgress: any; level: number };
    nodes: string | any[];
    primaryStat: any;
  },
  talentDefs: DefinitionTable<any>,
  progressDefs: DefinitionTable<any>
): D1TalentGrid | null {
  const talentGridDef = item.talentGridHash && talentDefs.get(item.talentGridHash);
  if (
    !item.progression ||
    !talentGridDef ||
    !item.nodes ||
    !item.nodes.length ||
    !progressDefs.get(item.progression.progressionHash)
  ) {
    return null;
  }

  const totalXP = item.progression.currentProgress;
  const totalLevel = item.progression.level; // Can be way over max

  // progressSteps gives the XP needed to reach each level, with
  // the last element repeating infinitely.
  const progressSteps = progressDefs.get(item.progression.progressionHash).steps;
  // Total XP to get to specified level
  function xpToReachLevel(level: number) {
    if (level === 0) {
      return 0;
    }
    let totalXPRequired = 0;
    for (let step = 1; step <= level; step++) {
      totalXPRequired += progressSteps[Math.min(step, progressSteps.length) - 1].progressTotal;
    }

    return totalXPRequired;
  }

  const possibleNodes = talentGridDef.nodes;

  // var featuredPerkNames = item.perks.map(function(perk) {
  //   var perkDef = perkDefs.get(perk.perkHash);
  //   return perkDef ? perkDef.displayName : 'Unknown';
  // });

  let gridNodes = (item.nodes as any[]).map((node): D1GridNode | undefined => {
    const talentNodeGroup = possibleNodes[node.nodeHash];
    const talentNodeSelected = talentNodeGroup.steps[node.stepIndex];

    if (!talentNodeSelected) {
      return undefined;
    }

    const nodeName = talentNodeSelected.nodeStepName;

    // Filter out some weird bogus nodes
    if (!nodeName || nodeName.length === 0 || talentNodeGroup.column < 0) {
      return undefined;
    }

    // Only one node in this column can be selected (scopes, etc)
    const exclusiveInColumn = Boolean(talentNodeGroup.exlusiveWithNodes?.length);

    // Unlocked is whether or not the material cost has been paid
    // for the node
    const unlocked =
      node.isActivated ||
      talentNodeGroup.autoUnlocks ||
      // If only one can be activated, the cost only needs to be
      // paid once per row.
      (exclusiveInColumn &&
        _.some(
          talentNodeGroup.exlusiveWithNodes,
          (nodeIndex: number) => item.nodes[nodeIndex].isActivated
        ));

    // Calculate relative XP for just this node
    const startProgressionBarAtProgress = talentNodeSelected.startProgressionBarAtProgress;
    const activatedAtGridLevel = talentNodeSelected.activationRequirement.gridLevel;
    const xpRequired = xpToReachLevel(activatedAtGridLevel) - startProgressionBarAtProgress;
    const xp = _.clamp(totalXP - startProgressionBarAtProgress, 0, xpRequired);

    // Build a perk string for the DTR link. See https://github.com/DestinyItemManager/DIM/issues/934
    let dtrHash: string | null = null;
    if (node.isActivated || talentNodeGroup.isRandom) {
      dtrHash = (node.nodeHash as number).toString(16);
      if (dtrHash.length > 1) {
        dtrHash += '.';
      }

      if (talentNodeGroup.isRandom) {
        dtrHash += node.stepIndex.toString(16);
        if (node.isActivated) {
          dtrHash += 'o';
        }
      }
    }

    // hacky way to determine if the node is a weapon ornament
    let ornamentComplete = false;
    if (talentNodeGroup.column > 1 && !xpRequired && !exclusiveInColumn && item.primaryStat) {
      ornamentComplete = node.isActivated;
    }

    // There's a lot more here, but we're taking just what we need
    return {
      name: nodeName,
      ornament: ornamentComplete,
      hash: talentNodeSelected.nodeStepHash,
      description: talentNodeSelected.nodeStepDescription,
      icon: talentNodeSelected.icon,
      // XP put into this node
      xp,
      // XP needed for this node to unlock
      xpRequired,
      // Position in the grid
      column: talentNodeGroup.column,
      row: talentNodeGroup.row,
      // Is the node selected (lit up in the grid)
      activated: node.isActivated,
      // The item level at which this node can be unlocked
      activatedAtGridLevel,
      // Only one node in this column can be selected (scopes, etc)
      exclusiveInColumn,
      // Whether there's enough XP in the item to buy the node
      xpRequirementMet: activatedAtGridLevel <= totalLevel,
      // Whether or not the material cost has been paid for the node
      unlocked,
      // Some nodes don't show up in the grid, like purchased ascend nodes
      hidden: node.hidden,

      // Whether (and in which order) this perk should be
      // "featured" on an abbreviated info panel, as in the
      // game. 0 = not featured, positive numbers signify the
      // order of the featured perks.
      // featuredPerk: (featuredPerkNames.indexOf(nodeName) + 1)

      // This list of material requirements to unlock the
      // item are a mystery. These hashes don't exist anywhere in
      // the manifest database. Also, the activationRequirement
      // object doesn't say how much of the material is
      // needed. There's got to be some missing DB somewhere with
      // this info.
      // materialsNeeded: talentNodeSelected.activationRequirement.materialRequirementHashes

      // These are useful for debugging or searching for new properties,
      // but they don't need to be included in the result.
      // talentNodeGroup: talentNodeGroup,
      // talentNodeSelected: talentNodeSelected,
      // itemNode: node
    };
  }) as D1GridNode[];

  // We need to unique-ify because Ornament nodes show up twice!
  gridNodes = _.uniqBy(_.compact(gridNodes), (n) => n.hash);

  if (!gridNodes.length) {
    return null;
  }

  // This can be handy for visualization/debugging
  // var columns = _.groupBy(gridNodes, 'column');

  const maxLevelRequired = _.maxBy(gridNodes, (n) => n.activatedAtGridLevel)!.activatedAtGridLevel;
  const totalXPRequired = xpToReachLevel(maxLevelRequired);

  const ascendNode = gridNodes.find((n) => n.hash === 1920788875);

  // Fix for stuff that has nothing in early columns
  const minColumn = _.minBy(
    _.reject(gridNodes, (n) => n.hidden),
    (n) => n.column
  )!.column;
  if (minColumn > 0) {
    gridNodes.forEach((node) => {
      node.column -= minColumn;
    });
  }
  const maxColumn = _.maxBy(gridNodes, (n: any) => n.column).column;

  return {
    nodes: _.sortBy(gridNodes, (node) => node.column + 0.1 * node.row),
    xpComplete: totalXPRequired <= totalXP,
    totalXPRequired,
    totalXP: Math.min(totalXPRequired, totalXP),
    hasAscendNode: Boolean(ascendNode),
    ascended: Boolean(ascendNode?.activated),
    infusable: gridNodes.some((n) => n.hash === 1270552711),
    complete:
      totalXPRequired <= totalXP &&
      _.every(gridNodes, (n: any) => n.unlocked || (n.xpRequired === 0 && n.column === maxColumn)),
  };
}

function buildStats(
  item: any,
  itemDef: { stats: any },
  statDefs: DefinitionTable<any>,
  grid: D1TalentGrid | null,
  type: string
): D1Stat[] | null {
  if (!item.stats || !item.stats.length || !itemDef.stats) {
    return null;
  }

  let armorNodes: D1GridNode[] = [];
  let activeArmorNode: D1GridNode | { hash: number };
  if (grid?.nodes && item.primaryStat?.statHash === D1_StatHashes.Defense) {
    armorNodes = grid.nodes.filter(
      (node) => [1034209669, 1263323987, 193091484].includes(node.hash) // ['Increase Intellect', 'Increase Discipline', 'Increase Strength']
    );
    if (armorNodes) {
      activeArmorNode = armorNodes.find((n) => n.activated) || { hash: 0 };
    }
  }

  return _.sortBy(
    _.compact(
      _.map(itemDef.stats, (stat: any) => {
        const def = statDefs.get(stat.statHash);
        if (!def) {
          return undefined;
        }

        const identifier = def.statIdentifier;

        // Only include these hidden stats, in this order
        const secondarySort = ['STAT_AIM_ASSISTANCE', 'STAT_EQUIP_SPEED'];
        let secondaryIndex = -1;

        let sort = _.findIndex(item.stats, (s: any) => s.statHash === stat.statHash);
        let itemStat;
        if (sort < 0) {
          secondaryIndex = secondarySort.indexOf(identifier);
          sort = 50 + secondaryIndex;
        } else {
          itemStat = item.stats[sort];
          // Always at the end
          if (identifier === 'STAT_MAGAZINE_SIZE' || identifier === 'STAT_ATTACK_ENERGY') {
            sort = 100;
          }
        }

        if (!itemStat && secondaryIndex < 0) {
          return undefined;
        }

        let maximumValue = 100;
        if (itemStat?.maximumValue) {
          maximumValue = itemStat.maximumValue;
        }

        const val: number = (itemStat ? itemStat.value : stat.value) || 0;
        let base = val;
        let bonus = 0;

        if (
          item.primaryStat?.stat.statIdentifier === 'STAT_DEFENSE' &&
          ((identifier === 'STAT_INTELLECT' &&
            armorNodes.find((n) => n.hash === 1034209669 /* Increase Intellect */)) ||
            (identifier === 'STAT_DISCIPLINE' &&
              armorNodes.find((n) => n.hash === 1263323987 /* Increase Discipline */)) ||
            (identifier === 'STAT_STRENGTH' &&
              armorNodes.find((n) => n.hash === 193091484 /* Increase Strength */)))
        ) {
          bonus = getBonus(item.primaryStat.value, type);

          if (
            activeArmorNode &&
            ((identifier === 'STAT_INTELLECT' && activeArmorNode.hash === 1034209669) ||
              (identifier === 'STAT_DISCIPLINE' && activeArmorNode.hash === 1263323987) ||
              (identifier === 'STAT_STRENGTH' && activeArmorNode.hash === 193091484))
          ) {
            base = Math.max(0, val - bonus);
          }
        }

        return {
          base,
          bonus,
          investmentValue: base,
          statHash: stat.statHash,
          displayProperties: {
            name: def.statName,
            description: def.statDescription,
          } as DestinyDisplayPropertiesDefinition,
          sort,
          value: val,
          maximumValue,
          bar: identifier !== 'STAT_MAGAZINE_SIZE' && identifier !== 'STAT_ATTACK_ENERGY', // energy == magazine for swords
          smallerIsBetter: [447667954, 2961396640].includes(stat.statHash),
          additive: item.primaryStat.stat.statIdentifier === 'STAT_DEFENSE',
          isConditionallyActive: false,
        };
      })
    ),
    (s) => s.sort
  );
}
