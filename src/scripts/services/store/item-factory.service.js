import angular from 'angular';
import _ from 'underscore';
import { sum } from '../../util';
import missingSources from 'app/data/missing_sources.json';
import { getClass, getBonus } from './character-utils';
import { getQualityRating } from './armor-quality';

const yearHashes = {
  //         tTK       Variks        CoE         FoTL    Kings Fall
  year2: [2659839637, 512830513, 1537575125, 3475869915, 1662673928],
  //         RoI       WoTM         FoTl       Dawning    Raid Reprise
  year3: [2964550958, 4160622434, 3475869915, 3131490494, 4161861381]
};

// Maps tierType to tierTypeName in English
const tiers = [
  'Unused 0',
  'Unused 1',
  'Common',
  'Uncommon',
  'Rare',
  'Legendary',
  'Exotic'
];

/**
 * A factory service for producing DIM inventory items.
 */
export function ItemFactory(
  dimState,
  dimManifestService,
  dimSettingsService,
  $i18next,
  NewItemsService,
  ClassifiedDataService,
  dimDefinitions,
  dimBucketService,
  $q
) {
  'ngInject';

  let _idTracker = {};

  /**
   * Check to see if this item has a node that restricts it to a
   * certain faction, and if the character is aligned with that
   * faction.
   */
  function factionItemAligns(store, item) {
    if (!item.talentGrid) {
      return true;
    }

    // Nodes that require matching faction alignment
    const factionNodes = {
      652505621: 'New Monarchy',
      2669659850: 'Future War Cult',
      2794386410: 'Dead Orbit'
    };

    const factionNode = _.find(item.talentGrid.nodes, (n) => factionNodes[n.hash]);
    if (!factionNode) {
      return true;
    }

    return factionNodes[factionNode.hash] === store.factionAlignment();
  }

  // Prototype for Item objects - add methods to this to add them to all
  // items.
  const ItemProto = {
    // Can this item be equipped by the given store?
    canBeEquippedBy: function(store) {
      if (store.isVault) {
        return false;
      }

      return this.equipment &&
        // For the right class
        (this.classTypeName === 'unknown' || this.classTypeName === store.class) &&
        // nothing we are too low-level to equip
        this.equipRequiredLevel <= store.level &&
        // can be moved or is already here
        (!this.notransfer || this.owner === store.id) &&
        !this.location.inPostmaster &&
        factionItemAligns(store, this);
    },
    inCategory: function(categoryName) {
      return _.contains(this.categories, categoryName);
    },
    isEngram: function() {
      return this.inCategory('CATEGORY_ENGRAM');
    },
    canBeInLoadout: function() {
      return this.equipment || this.type === 'Material' || this.type === 'Consumable';
    },
    // "The Life Exotic" Perk on Exotic Items means you can equip another exotic
    hasLifeExotic: function() {
      return this.isExotic && this.talentGrid && (_.find(this.talentGrid.nodes, { hash: 4044819214 }) !== undefined);
    }
  };

  return {
    resetIdTracker,
    processItems,
    makeItem,
    createItemIndex
  };


  function resetIdTracker() {
    _idTracker = {};
  }

  /**
   * Process an entire list of items into DIM items.
   * @param {string} owner the ID of the owning store.
   * @param {Array} items a list of "raw" items from the Destiny API
   * @param {Set<string>} previousItems a set of item IDs representing the previous store's items
   * @param {Set<string>} newItems a set of item IDs representing the previous list of new items
   * @param itemInfoService the item info factory for this store's platform
   * @return {Promise<Array>} a promise for the list of items
   */
  function processItems(owner, items, previousItems = new Set(), newItems = new Set(), itemInfoService) {
    return $q.all([
      dimDefinitions.getDefinitions(),
      dimBucketService.getBuckets(),
      previousItems,
      newItems,
      itemInfoService,
      ClassifiedDataService.getClassifiedData()])
      .then((args) => {
        const result = [];
        dimManifestService.statusText = `${$i18next.t('Manifest.LoadCharInv')}...`;
        _.each(items, (item) => {
          let createdItem = null;
          try {
            createdItem = makeItem(...args, item, owner);
          } catch (e) {
            console.error("Error processing item", item, e);
          }
          if (createdItem !== null) {
            createdItem.owner = owner.id;
            result.push(createdItem);
          }
        });
        return result;
      });
  }

  /**
   * Process a single raw item into a DIM item.s
   * @param defs the manifest definitions from dimDefinitions
   * @param buckets the bucket definitions from dimBucketService
   * @param {Set<string>} previousItems a set of item IDs representing the previous store's items
   * @param {Set<string>} newItems a set of item IDs representing the previous list of new items
   * @param itemInfoService the item info factory for this store's platform
   * @param classifiedData a mapping from item hash to details for a classified item
   * @param item "raw" item from the Destiny API
   * @param {string} owner the ID of the owning store.
   */
  function makeItem(defs, buckets, previousItems, newItems, itemInfoService, classifiedData, item, owner) {
    let itemDef = defs.InventoryItem.get(item.itemHash);
    // Missing definition?
    if (!itemDef) {
      // maybe it is redacted...
      itemDef = {
        itemName: "Missing Item",
        redacted: true
      };
      dimManifestService.warnMissingDefinition();
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
      console.warn('Missing Item Definition:\n\n', item, '\n\nThis item is not in the current manifest and will be added at a later time by Bungie.');
    }

    if (itemDef.classified) {
      const classifiedItemDef = ClassifiedDataService.buildClassifiedItem(classifiedData, itemDef.hash);
      if (classifiedItemDef) {
        itemDef = classifiedItemDef;
        item.primaryStat = itemDef.primaryStat;
      }
    }

    if (!itemDef || !itemDef.itemName) {
      return null;
    }

    // fix itemDef for defense items with missing nodes
    if (item.primaryStat && item.primaryStat.statHash === 3897883278 && _.size(itemDef.stats) > 0 && _.size(itemDef.stats) !== 5) {
      const defaultMinMax = _.find(itemDef.stats, (stat) => {
        return _.indexOf([144602215, 1735777505, 4244567218], stat.statHash) >= 0;
      });

      if (defaultMinMax) {
        [144602215, 1735777505, 4244567218].forEach((val) => {
          if (!itemDef.stats[val]) {
            itemDef.stats[val] = {
              maximum: defaultMinMax.maximum,
              minimum: defaultMinMax.minimum,
              statHash: val,
              value: 0
            };
          }
        });
      }
    }

    // def.bucketTypeHash is where it goes normally
    let normalBucket = buckets.byHash[itemDef.bucketTypeHash];
    // item.bucket is where it IS right now
    let currentBucket = buckets.byHash[item.bucket] || normalBucket;
    if (!normalBucket) {
      currentBucket = normalBucket = buckets.unknown;
      buckets.setHasUnknown();
    }

    // We cheat a bit for items in the vault, since we treat the
    // vault as a character. So put them in the bucket they would
    // have been in if they'd been on a character.
    if (currentBucket.id.startsWith('BUCKET_VAULT')) {
      // TODO: Remove this if Bungie ever returns bucket.id for classified
      // items in the vault.
      if (itemDef.classified && itemDef.itemTypeName === 'Unknown') {
        if (currentBucket.id.endsWith('WEAPONS')) {
          currentBucket = buckets.byType.Heavy;
        } else if (currentBucket.id.endsWith('ARMOR')) {
          currentBucket = buckets.byType.ClassItem;
        } else if (currentBucket.id.endsWith('ITEMS')) {
          currentBucket = buckets.byType.Artifact;
        }
      } else {
        currentBucket = normalBucket;
      }
    }

    const itemType = normalBucket.type || 'Unknown';

    const categories = itemDef.itemCategoryHashes ? _.compact(itemDef.itemCategoryHashes.map((c) => {
      const category = defs.ItemCategory.get(c);
      return category ? category.identifier : null;
    })) : [];

    const dmgName = [null, 'kinetic', 'arc', 'solar', 'void'][item.damageType];

    itemDef.sourceHashes = itemDef.sourceHashes || [];

    const missingSource = missingSources[itemDef.hash] || [];
    if (missingSource.length) {
      itemDef.sourceHashes = _.union(itemDef.sourceHashes, missingSource);
    }

    const createdItem = angular.extend(Object.create(ItemProto), {
      // figure out what year this item is probably from

      // The bucket the item is currently in
      location: currentBucket,
      // The bucket the item normally resides in (even though it may be in the vault/postmaster)
      bucket: normalBucket,
      hash: item.itemHash,
      // This is the type of the item (see dimCategory/dimBucketService) regardless of location
      type: itemType,
      categories: categories, // see defs.ItemCategory
      tier: tiers[itemDef.tierType] || 'Common',
      isExotic: tiers[itemDef.tierType] === 'Exotic',
      isVendorItem: (!owner || owner.id === null),
      name: itemDef.itemName,
      description: itemDef.itemDescription || '', // Added description for Bounties for now JFLAY2015
      icon: itemDef.icon,
      notransfer: Boolean(currentBucket.inPostmaster || itemDef.nonTransferrable || !itemDef.allowActions || itemDef.classified),
      id: item.itemInstanceId,
      equipped: item.isEquipped,
      equipment: item.isEquipment,
      complete: item.isGridComplete,
      amount: item.stackSize,
      primStat: item.primaryStat || null,
      typeName: itemDef.itemTypeName,
      // "perks" are the two or so talent grid items that are "featured" for an
      // item in its popup in the game. We don't currently use these.
      // perks: item.perks,
      equipRequiredLevel: item.equipRequiredLevel,
      maxStackSize: (itemDef.maxStackSize > 0) ? itemDef.maxStackSize : 1,
      // 0: titan, 1: hunter, 2: warlock, 3: any
      classType: itemDef.classType,
      classTypeName: getClass(itemDef.classType),
      classTypeNameLocalized: getClassTypeNameLocalized(defs, itemDef.classType),
      dmg: dmgName,
      visible: true,
      sourceHashes: itemDef.sourceHashes,
      lockable: normalBucket.type !== 'Class' && ((currentBucket.inPostmaster && item.isEquipment) || currentBucket.inWeapons || item.lockable),
      trackable: Boolean(currentBucket.inProgress && (currentBucket.hash === 2197472680 || currentBucket.hash === 1801258597)),
      tracked: item.state === 2,
      locked: item.locked,
      redacted: Boolean(itemDef.redacted),
      classified: Boolean(itemDef.classified),
      isInLoadout: false,
      dtrRating: item.dtrRating,
      percentComplete: null, // filled in later
      talentGrid: null, // filled in later
      stats: null, // filled in later
      objectives: null, // filled in later
      quality: null // filled in later
    });

    // *able
    createdItem.taggable = Boolean($featureFlags.tagsEnabled && createdItem.lockable && !_.contains(categories, 'CATEGORY_ENGRAM'));
    createdItem.comparable = Boolean($featureFlags.compareEnabled && createdItem.equipment && createdItem.lockable);
    createdItem.reviewable = Boolean($featureFlags.reviewsEnabled && createdItem.primStat && createdItem.primStat.statHash === 368428387);

    // Moving rare masks destroys them
    if (createdItem.inCategory('CATEGORY_MASK') && createdItem.tier !== 'Legendary') {
      createdItem.notransfer = true;
    }

    if (createdItem.primStat) {
      createdItem.primStat.stat = defs.Stat.get(createdItem.primStat.statHash);
    }

    // An item is new if it was previously known to be new, or if it's new since the last load (previousItems);
    createdItem.isNew = false;
    try {
      createdItem.isNew = NewItemsService.isItemNew(createdItem.id, previousItems, newItems);
    } catch (e) {
      console.error(`Error determining new-ness of ${createdItem.name}`, item, itemDef, e);
    }

    if (itemInfoService) {
      try {
        createdItem.dimInfo = itemInfoService.infoForItem(createdItem.hash, createdItem.id);
      } catch (e) {
        console.error(`Error getting extra DIM info for ${createdItem.name}`, item, itemDef, e);
      }
    }

    try {
      createdItem.talentGrid = buildTalentGrid(item, defs.TalentGrid, defs.Progression);
    } catch (e) {
      console.error(`Error building talent grid for ${createdItem.name}`, item, itemDef, e);
    }
    try {
      createdItem.stats = buildStats(item, itemDef, defs.Stat, createdItem.talentGrid, itemType);

      if (createdItem.stats && createdItem.stats.length === 0) {
        createdItem.stats = buildStats(item, item, defs.Stat, createdItem.talentGrid, itemType);
      }
    } catch (e) {
      console.error(`Error building stats for ${createdItem.name}`, item, itemDef, e);
    }
    try {
      createdItem.objectives = buildObjectives(item.objectives, defs.Objective);
    } catch (e) {
      console.error(`Error building objectives for ${createdItem.name}`, item, itemDef, e);
    }
    if (createdItem.talentGrid && createdItem.talentGrid.infusable) {
      try {
        createdItem.quality = getQualityRating(createdItem.stats, item.primaryStat, itemType);
      } catch (e) {
        console.error(`Error building quality rating for ${createdItem.name}`, item, itemDef, e);
      }
    }

    createdItem.year = getItemYear(createdItem);

    // More objectives properties
    if (createdItem.objectives) {
      createdItem.complete = (!createdItem.talentGrid || createdItem.complete) && _.all(createdItem.objectives, 'complete');
      createdItem.percentComplete = sum(createdItem.objectives, (objective) => {
        if (objective.completionValue) {
          return Math.min(1.0, objective.progress / objective.completionValue) / createdItem.objectives.length;
        } else {
          return 0;
        }
      });
    } else if (createdItem.talentGrid) {
      createdItem.percentComplete = Math.min(1.0, createdItem.talentGrid.totalXP / createdItem.talentGrid.totalXPRequired);
      createdItem.complete = createdItem.year === 1 ? createdItem.talentGrid.totalXP === createdItem.talentGrid.totalXPRequired : createdItem.talentGrid.complete;
    }

    // In debug mode, keep the original JSON around
    if (dimState.debug) {
      createdItem.originalItem = item;
    }

    // do specific things for specific items
    if (createdItem.hash === 491180618) { // Trials Cards
      createdItem.objectives = buildTrials(owner.advisors.activities.trials);
      const best = owner.advisors.activities.trials.extended.highestWinRank;
      createdItem.complete = owner.advisors.activities.trials.completion.success;
      createdItem.percentComplete = createdItem.complete ? 1 : (best >= 7 ? .66 : (best >= 5 ? .33 : 0));
    }

    createdItem.index = createItemIndex(createdItem);

    return createdItem;
  }

  // Set an ID for the item that should be unique across all items
  function createItemIndex(item) {
    // Try to make a unique, but stable ID. This isn't always possible, such as in the case of consumables.
    let index = item.id;
    if (item.id === '0') {
      index = `${item.hash}-am${item.amount}`;
      _idTracker[index] = (_idTracker[index] || 0) + 1;
      index = `${index}-t${_idTracker[index]}`;
    }

    // Perf hack: the index is used as a key for ng-repeat. What we are doing here
    // is adding extra info to that key in order to force items to be re-rendered when
    // this index changes. These properties are selected because they're used in the
    // dimStoreItem directive. Ideally this would just be a hash of all these properties,
    // but for now a big string will do.
    //
    // Oh, also, this value needs to be safe as an HTML ID.

    if (!item.complete && item.percentComplete) {
      index += `-pc${Math.round(item.percentComplete * 100)}`;
    }
    if (item.quality) {
      index += `-q${item.quality.min}`;
    }
    if (item.primStat && item.primStat.value) {
      index += `-ps${item.primStat.value}`;
    }

    return index;
  }

  function buildTalentGrid(item, talentDefs, progressDefs) {
    const talentGridDef = talentDefs.get(item.talentGridHash);
    if (!item.progression || !talentGridDef || !item.nodes || !item.nodes.length || !progressDefs.get(item.progression.progressionHash)) {
      return undefined;
    }

    const totalXP = item.progression.currentProgress;
    const totalLevel = item.progression.level; // Can be way over max

    // progressSteps gives the XP needed to reach each level, with
    // the last element repeating infinitely.
    const progressSteps = progressDefs.get(item.progression.progressionHash).steps;
    // Total XP to get to specified level
    function xpToReachLevel(level) {
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

    let gridNodes = item.nodes.map((node) => {
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
      const exclusiveInColumn = Boolean(talentNodeGroup.exlusiveWithNodes &&
                               talentNodeGroup.exlusiveWithNodes.length > 0);

      // Unlocked is whether or not the material cost has been paid
      // for the node
      const unlocked = node.isActivated ||
            talentNodeGroup.autoUnlocks ||
            // If only one can be activated, the cost only needs to be
            // paid once per row.
            (exclusiveInColumn &&
             _.any(talentNodeGroup.exlusiveWithNodes, (nodeIndex) => {
               return item.nodes[nodeIndex].isActivated;
             }));

      // Calculate relative XP for just this node
      const startProgressionBarAtProgress = talentNodeSelected.startProgressionBarAtProgress;
      const activatedAtGridLevel = talentNodeSelected.activationRequirement.gridLevel;
      const xpRequired = xpToReachLevel(activatedAtGridLevel) - startProgressionBarAtProgress;
      const xp = Math.max(0, Math.min(totalXP - startProgressionBarAtProgress, xpRequired));

      // Build a perk string for the DTR link. See https://github.com/DestinyItemManager/DIM/issues/934
      let dtrHash = null;
      if (node.isActivated || talentNodeGroup.isRandom) {
        dtrHash = node.nodeHash.toString(16);
        if (dtrHash.length > 1) {
          dtrHash += ".";
        }

        if (talentNodeGroup.isRandom) {
          dtrHash += node.stepIndex.toString(16);
          if (node.isActivated) {
            dtrHash += "o";
          }
        }
      }

      // Generate a hash that identifies the weapons permutation and selected perks.
      // This is used by the Weapon Reviewing system.
      const generateNodeDtrRoll = (node, talentNodeSelected) => {
        let dtrRoll = node.nodeHash.toString(16);

        if (dtrRoll.length > 1) {
          dtrRoll += ".";
        }

        dtrRoll += node.stepIndex.toString(16);

        if (node.isActivated) {
          dtrRoll += "o";
        }

        if (talentNodeSelected.perkHashes && talentNodeSelected.perkHashes.length > 0) {
          dtrRoll += `,${talentNodeSelected.perkHashes.join(',')}`;
        }

        return dtrRoll;
      };

      const dtrRoll = generateNodeDtrRoll(node, talentNodeSelected);

      // hacky way to determine if the node is a weapon ornament
      let ornamentComplete = null;
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
        xp: xp,
        // XP needed for this node to unlock
        xpRequired: xpRequired,
        // Position in the grid
        column: talentNodeGroup.column,
        row: talentNodeGroup.row,
        // Is the node selected (lit up in the grid)
        activated: node.isActivated,
        // The item level at which this node can be unlocked
        activatedAtGridLevel: activatedAtGridLevel,
        // Only one node in this column can be selected (scopes, etc)
        exclusiveInColumn: exclusiveInColumn,
        // Whether there's enough XP in the item to buy the node
        xpRequirementMet: activatedAtGridLevel <= totalLevel,
        // Whether or not the material cost has been paid for the node
        unlocked: unlocked,
        // Some nodes don't show up in the grid, like purchased ascend nodes
        hidden: node.hidden,

        dtrHash: dtrHash,
        dtrRoll: dtrRoll

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
    });

    // We need to unique-ify because Ornament nodes show up twice!
    gridNodes = _.uniq(_.compact(gridNodes), false, 'hash');

    if (!gridNodes.length) {
      return undefined;
    }

    // This can be handy for visualization/debugging
    // var columns = _.groupBy(gridNodes, 'column');

    const maxLevelRequired = _.max(gridNodes, 'activatedAtGridLevel').activatedAtGridLevel;
    const totalXPRequired = xpToReachLevel(maxLevelRequired);

    const ascendNode = _.find(gridNodes, { hash: 1920788875 });

    // Fix for stuff that has nothing in early columns
    const minColumn = _.min(_.reject(gridNodes, 'hidden'), 'column').column;
    if (minColumn > 0) {
      gridNodes.forEach((node) => { node.column -= minColumn; });
    }
    const maxColumn = _.max(gridNodes, 'column').column;

    return {
      nodes: _.sortBy(gridNodes, (node) => { return node.column + (0.1 * node.row); }),
      xpComplete: totalXPRequired <= totalXP,
      totalXPRequired: totalXPRequired,
      totalXP: Math.min(totalXPRequired, totalXP),
      hasAscendNode: Boolean(ascendNode),
      ascended: Boolean(ascendNode && ascendNode.activated),
      infusable: _.any(gridNodes, { hash: 1270552711 }),
      dtrPerks: _.compact(_.pluck(gridNodes, 'dtrHash')).join(';'),
      dtrRoll: _.compact(_.pluck(gridNodes, 'dtrRoll')).join(';'),
      complete: totalXPRequired <= totalXP && _.all(gridNodes, (n) => n.unlocked || (n.xpRequired === 0 && n.column === maxColumn))
    };
  }

  function buildTrials(trials) {
    const flawless = trials.completion.success;
    trials = trials.extended;
    function buildObjective(name, current, max, bool, style) {
      return {
        displayStyle: style,
        displayName: $i18next.t(`TrialsCard.${name}`),
        progress: current,
        completionValue: max,
        complete: bool ? current >= max : false,
        boolean: bool
      };
    }

    return [
      buildObjective('Wins', trials.scoreCard.wins, trials.scoreCard.maxWins, false, 'trials'),
      buildObjective('Losses', trials.scoreCard.losses, trials.scoreCard.maxLosses, false, 'trials'),
      buildObjective('FiveWins', trials.highestWinRank, trials.winRewardDetails[0].winCount, true),
      buildObjective('SevenWins', trials.highestWinRank, trials.winRewardDetails[1].winCount, true),
      buildObjective('Flawless', flawless, 1, true),
    ];
  }

  function buildObjectives(objectives, objectiveDefs) {
    if (!objectives || !objectives.length) {
      return undefined;
    }

    return objectives.map((objective) => {
      const def = objectiveDefs.get(objective.objectiveHash);

      return {
        displayName: def.displayDescription ||
          (objective.isComplete
            ? $i18next.t('Objectives.Complete')
            : $i18next.t('Objectives.Incomplete')),
        progress: objective.progress,
        completionValue: def.completionValue,
        complete: objective.isComplete,
        boolean: def.completionValue === 1,
        display: `${objective.progress}/${def.completionValue}`
      };
    });
  }

  function getClassTypeNameLocalized(defs, type) {
    const klass = _.find(_.values(defs.Class), { classType: type });
    if (klass) {
      return klass.className;
    } else {
      return $i18next.t('Loadouts.Any');
    }
  }

  function getItemYear(item) {
    // determine what year this item came from based on sourceHash value
    // items will hopefully be tagged as follows
    // No value: Vanilla, Crota's End, House of Wolves
    // The Taken King (year 2): 460228854
    // Rise of Iron (year 3): 24296771

    // This could be further refined for CE/HoW based on activity. See
    // DestinyRewardSourceDefinition and filter on %SOURCE%
    // if sourceHash doesn't contain these values, we assume they came from
    // year 1

    let year = 1;
    const infusable = (item.talentGrid && item.talentGrid.infusable);
    const ttk = item.sourceHashes.includes(yearHashes.year2[0]);
    const roi = item.sourceHashes.includes(yearHashes.year3[0]);
    if (ttk || infusable || _.intersection(yearHashes.year2, item.sourceHashes).length) {
      year = 2;
    }
    if (!ttk && (item.classified || roi || _.intersection(yearHashes.year3, item.sourceHashes).length)) {
      year = 3;
    }

    return year;
  }

  function buildStats(item, itemDef, statDefs, grid, type) {
    if (!item.stats || !item.stats.length || !itemDef.stats) {
      return undefined;
    }

    let armorNodes = [];
    let activeArmorNode;
    if (grid && grid.nodes && item.primaryStat && item.primaryStat.statHash === 3897883278) {
      armorNodes = _.filter(grid.nodes, (node) => {
        return _.contains([1034209669, 1263323987, 193091484], node.hash); // ['Increase Intellect', 'Increase Discipline', 'Increase Strength']
      });
      if (armorNodes) {
        activeArmorNode = _.find(armorNodes, { activated: true }) || { hash: 0 };
      }
    }

    return _.sortBy(_.compact(_.map(itemDef.stats, (stat) => {
      const def = statDefs.get(stat.statHash);
      if (!def) {
        return undefined;
      }

      const identifier = def.statIdentifier;

      // Only include these hidden stats, in this order
      const secondarySort = ['STAT_AIM_ASSISTANCE', 'STAT_EQUIP_SPEED'];
      let secondaryIndex = -1;

      let sort = _.findIndex(item.stats, { statHash: stat.statHash });
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
      if (itemStat && itemStat.maximumValue) {
        maximumValue = itemStat.maximumValue;
      }

      const val = itemStat ? itemStat.value : stat.value;
      let base = val;
      let bonus = 0;

      if (item.primaryStat && item.primaryStat.stat.statIdentifier === 'STAT_DEFENSE') {
        if ((identifier === 'STAT_INTELLECT' && _.find(armorNodes, { hash: 1034209669 /* Increase Intellect */ })) ||
           (identifier === 'STAT_DISCIPLINE' && _.find(armorNodes, { hash: 1263323987 /* Increase Discipline */ })) ||
           (identifier === 'STAT_STRENGTH' && _.find(armorNodes, { hash: 193091484 /* Increase Strength */ }))) {
          bonus = getBonus(item.primaryStat.value, type);

          if (activeArmorNode &&
              ((identifier === 'STAT_INTELLECT' && activeArmorNode.hash === 1034209669) ||
               (identifier === 'STAT_DISCIPLINE' && activeArmorNode.hash === 1263323987) ||
               (identifier === 'STAT_STRENGTH' && activeArmorNode.hash === 193091484))) {
            base = Math.max(0, val - bonus);
          }
        }
      }

      return {
        base: base,
        bonus: bonus,
        statHash: stat.statHash,
        name: def.statName,
        id: def.statIdentifier,
        sort: sort,
        value: val,
        maximumValue: maximumValue,
        bar: identifier !== 'STAT_MAGAZINE_SIZE' && identifier !== 'STAT_ATTACK_ENERGY' // energy == magazine for swords
      };
    })), 'sort');
  }
}
