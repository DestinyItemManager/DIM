import { D2Item } from 'app/inventory/item-types';
import { ItemProto } from 'app/inventory/store/d2-item-factory.service';
import {
  DestinyAmmunitionType,
  DestinyUnlockValueUIStyle,
  DestinyMilestone,
  DestinyClass,
  DestinyMilestoneDefinition,
  DestinyMilestoneQuest,
  DestinyDisplayPropertiesDefinition,
  DestinyMilestoneRewardEntry,
  DestinyMilestoneRewardCategoryDefinition
} from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import _ from 'lodash';

export function milestoneToItems(
  milestone: DestinyMilestone,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  characterClass: DestinyClass
): D2Item[] {
  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);

  // TODO: modifiers
  // TODO: activity locations (nightfalls, etc)

  if (milestone.availableQuests) {
    return milestone.availableQuests.map((availableQuest) =>
      availableQuestToItem(defs, buckets, milestoneDef, availableQuest, characterClass)
    );
  } else if (milestone.activities && milestone.activities.length) {
    const item = activityMilestoneToItem(defs, buckets, milestoneDef, milestone);
    return item ? [item] : [];
  } else if (milestone.rewards) {
    // Weekly Clan Milestones
    const rewards = milestone.rewards[0];
    const milestoneRewardDef = milestoneDef.rewards[rewards.rewardCategoryHash];

    return rewards.entries
      .filter((r) => !r.redeemed)
      .map((rewardEntry) =>
        weeklyClanMilestoneToItems(buckets, rewardEntry, milestoneDef, milestoneRewardDef)
      );
  }

  return [];
}

function availableQuestToItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  milestoneDef: DestinyMilestoneDefinition,
  availableQuest: DestinyMilestoneQuest,
  characterClass: DestinyClass
): D2Item {
  const questDef = milestoneDef.quests[availableQuest.questItemHash];
  const displayProperties: DestinyDisplayPropertiesDefinition =
    questDef.displayProperties || milestoneDef.displayProperties;
  /*
  let modifiers: DestinyActivityModifierDefinition[] = [];
  if (availableQuest.activity) {
    if (availableQuest.activity.modifierHashes) {
      modifiers = availableQuest.activity.modifierHashes.map((h) => defs.ActivityModifier.get(h));
    }
  }*/

  // Only look at the first reward, the rest are screwy (old engram versions, etc)
  const questRewards = questDef.questRewards
    ? _.take(
        questDef.questRewards.items
          .map((r) => defs.InventoryItem.get(r.itemHash))
          // Filter out rewards that are for other characters
          .filter(
            (i) =>
              i &&
              (i.classType === characterClass || i.classType === DestinyClass.Unknown) &&
              // And quest steps, they're not interesting
              !i.itemCategoryHashes.includes(16)
          ),
        1
      )
    : [];

  const objectives = availableQuest.status.stepObjectives;
  const objective = objectives.length ? objectives[0] : null;
  const objectiveDef = objective ? defs.Objective.get(objective.objectiveHash) : null;

  const suppressObjectiveDescription = Boolean(
    objectiveDef && objectiveDef.progressDescription === displayProperties.description
  );

  const dimItem: D2Item = Object.assign(Object.create(ItemProto), {
    // figure out what year this item is probably from
    destinyVersion: 2,
    // The bucket the item is currently in
    location: buckets.byType.Pursuits,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: buckets.byType.Pursuits,
    hash: availableQuest.questItemHash,
    // This is the type of the item (see DimCategory/DimBuckets) regardless of location
    type: 'Milestone',
    itemCategoryHashes: [], // see defs.ItemCategory
    tier: 'Common',
    isExotic: false,
    isVendorItem: false,
    name: displayProperties.name,
    description: displayProperties.description,
    icon: displayProperties.icon || '/img/misc/missing_icon_d2.png',
    secondaryIcon: '/img/misc/missing_icon_d2.png',
    notransfer: true,
    canPullFromPostmaster: false,
    id: '0', // zero for non-instanced is legacy hack
    equipped: false,
    equipment: false, // TODO: this has a ton of good info for the item move logic
    complete: false,
    amount: 1,
    primStat: null,
    typeName: 'Milestone',
    equipRequiredLevel: 0,
    maxStackSize: 1,
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: 3,
    classTypeNameLocalized: 'Any',
    dmg: null,
    visible: true,
    lockable: false,
    tracked: false,
    locked: false,
    masterwork: false,
    classified: false,
    isEngram: false,
    lastManuallyMoved: 0,
    percentComplete: 0, // filled in later
    hidePercentage: false,
    talentGrid: null, // filled in later
    stats: null, // filled in later
    objectives: null, // filled in later
    dtrRating: null,
    ammoType: DestinyAmmunitionType.None,
    source: null,
    collectibleState: null,
    missingSockets: false
  });

  if (objective && objectiveDef) {
    const complete = objective.complete || (objective as any).isComplete;
    const displayName =
      (!suppressObjectiveDescription && objectiveDef.progressDescription) ||
      t(complete ? 'Objectives.Complete' : 'Objectives.Incomplete');

    const progress = objective.progress || 0;
    const completionValue =
      objective.completionValue !== undefined
        ? objective.completionValue
        : objectiveDef.completionValue;
    const isBoolean =
      objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Checkbox ||
      (completionValue === 1 && !objectiveDef.allowOvercompletion);

    dimItem.objectives = [
      {
        displayName,
        description: objectiveDef.displayProperties.description,
        progress,
        completionValue,
        complete,
        boolean: isBoolean,
        display: `${progress}/${completionValue}`,
        /** Override display styles for objectives, such as 'trials' or 'integer' */
        // TODO: fold 'boolean' into this
        displayStyle: null
      }
    ];
  }

  if (questRewards) {
    dimItem.pursuit = {
      suppressExpirationWhenObjectivesComplete: false,
      places: [],
      activityTypes: [],
      rewards: questRewards.map((r) => ({ itemHash: r.hash, quantity: 1 }))
    };
  }

  return dimItem;
}

function activityMilestoneToItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  milestoneDef: DestinyMilestoneDefinition,
  milestone: DestinyMilestone
): D2Item | null {
  const displayProperties = milestoneDef.displayProperties;
  const objectives = milestone.activities[0].challenges.map((a) => a.objective);
  if (objectives.every((objective) => objective.complete)) {
    return null;
  }

  const dimItem: D2Item = Object.assign(Object.create(ItemProto), {
    // figure out what year this item is probably from
    destinyVersion: 2,
    // The bucket the item is currently in
    location: buckets.byType.Pursuits,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: buckets.byType.Pursuits,
    hash: milestone.milestoneHash,
    // This is the type of the item (see DimCategory/DimBuckets) regardless of location
    type: 'Milestone',
    itemCategoryHashes: [], // see defs.ItemCategory
    tier: 'Common',
    isExotic: false,
    isVendorItem: false,
    name: displayProperties.name,
    description: displayProperties.description,
    icon: displayProperties.icon || '/img/misc/missing_icon_d2.png',
    secondaryIcon: '/img/misc/missing_icon_d2.png',
    notransfer: true,
    canPullFromPostmaster: false,
    id: '0', // zero for non-instanced is legacy hack
    equipped: false,
    equipment: false, // TODO: this has a ton of good info for the item move logic
    complete: false,
    amount: 1,
    primStat: null,
    typeName: 'Milestone',
    equipRequiredLevel: 0,
    maxStackSize: 1,
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: 3,
    classTypeNameLocalized: 'Any',
    dmg: null,
    visible: true,
    lockable: false,
    tracked: false,
    locked: false,
    masterwork: false,
    classified: false,
    isEngram: false,
    lastManuallyMoved: 0,
    percentComplete: 0, // filled in later
    hidePercentage: false,
    talentGrid: null, // filled in later
    stats: null, // filled in later
    objectives: null, // filled in later
    dtrRating: null,
    ammoType: DestinyAmmunitionType.None,
    source: null,
    collectibleState: null,
    missingSockets: false
  });

  if (objectives) {
    dimItem.objectives = objectives.map((objective) => {
      const objectiveDef = defs.Objective.get(objective.objectiveHash);
      const complete = objective.complete || (objective as any).isComplete;
      const displayName =
        objectiveDef.progressDescription ||
        t(complete ? 'Objectives.Complete' : 'Objectives.Incomplete');

      const progress = objective.progress || 0;
      const completionValue =
        objective.completionValue !== undefined
          ? objective.completionValue
          : objectiveDef.completionValue;
      const isBoolean =
        objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Checkbox ||
        (completionValue === 1 && !objectiveDef.allowOvercompletion);

      return {
        displayName,
        description: objectiveDef.displayProperties.description,
        progress,
        completionValue,
        complete,
        boolean: isBoolean,
        display: `${progress}/${completionValue}`,
        /** Override display styles for objectives, such as 'trials' or 'integer' */
        // TODO: fold 'boolean' into this
        displayStyle: null
      };
    });
  }

  if (milestone.rewards) {
    dimItem.pursuit = {
      suppressExpirationWhenObjectivesComplete: false,
      places: [],
      activityTypes: [],
      rewards: milestone.rewards.flatMap((reward) =>
        Object.values(milestoneDef.rewards[reward.rewardCategoryHash].rewardEntries).flatMap(
          (entry) => entry.items
        )
      )
    };
  }

  /*
  const modifiers = (milestone.activities[0].modifierHashes || []).map((h) =>
    defs.ActivityModifier.get(h)
  );
  */

  return dimItem;
}

function weeklyClanMilestoneToItems(
  buckets: InventoryBuckets,
  rewardEntry: DestinyMilestoneRewardEntry,
  milestoneDef: DestinyMilestoneDefinition,
  milestoneRewardDef: DestinyMilestoneRewardCategoryDefinition
): D2Item {
  const displayProperties = milestoneDef.displayProperties;

  const reward = milestoneRewardDef.rewardEntries[rewardEntry.rewardEntryHash];

  const dimItem: D2Item = Object.assign(Object.create(ItemProto), {
    // figure out what year this item is probably from
    destinyVersion: 2,
    // The bucket the item is currently in
    location: buckets.byType.Pursuits,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: buckets.byType.Pursuits,
    hash: milestoneDef.hash,
    // This is the type of the item (see DimCategory/DimBuckets) regardless of location
    type: 'Milestone',
    itemCategoryHashes: [], // see defs.ItemCategory
    tier: 'Common',
    isExotic: false,
    isVendorItem: false,
    name: reward.displayProperties.name,
    description: reward.displayProperties.description,
    icon:
      reward.displayProperties.icon || displayProperties.icon || '/img/misc/missing_icon_d2.png',
    secondaryIcon: '/img/misc/missing_icon_d2.png',
    notransfer: true,
    canPullFromPostmaster: false,
    id: '0', // zero for non-instanced is legacy hack
    equipped: false,
    equipment: false, // TODO: this has a ton of good info for the item move logic
    complete: false,
    amount: 1,
    primStat: null,
    typeName: displayProperties.name,
    equipRequiredLevel: 0,
    maxStackSize: 1,
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: 3,
    classTypeNameLocalized: 'Any',
    dmg: null,
    visible: true,
    lockable: false,
    tracked: false,
    locked: false,
    masterwork: false,
    classified: false,
    isEngram: false,
    lastManuallyMoved: 0,
    percentComplete: 0, // filled in later
    hidePercentage: false,
    talentGrid: null, // filled in later
    stats: null, // filled in later
    objectives: null, // filled in later
    dtrRating: null,
    ammoType: DestinyAmmunitionType.None,
    source: null,
    collectibleState: null,
    missingSockets: false
  });

  dimItem.pursuit = {
    suppressExpirationWhenObjectivesComplete: false,
    places: [],
    activityTypes: [],
    rewards: reward.items
  };

  return dimItem;
}
