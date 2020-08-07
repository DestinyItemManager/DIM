import { D2Item } from 'app/inventory/item-types';
import { ItemProto } from 'app/inventory/store/d2-item-factory';
import {
  DestinyAmmunitionType,
  DestinyMilestone,
  DestinyClass,
  DestinyMilestoneDefinition,
  DestinyMilestoneQuest,
  DestinyDisplayPropertiesDefinition,
  DestinyMilestoneRewardEntry,
  DestinyMilestoneRewardCategoryDefinition,
  DestinyMilestoneType,
  DestinyObjectiveProgress,
} from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import _ from 'lodash';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

export function milestoneToItems(
  milestone: DestinyMilestone,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  characterClass: DestinyClass
): D2Item[] {
  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);

  // TODO: activity locations (nightfalls, etc)

  if (milestone.availableQuests) {
    return milestone.availableQuests.map((availableQuest) =>
      availableQuestToItem(defs, buckets, milestone, milestoneDef, availableQuest, characterClass)
    );
  } else if (milestone.activities?.length) {
    const item = activityMilestoneToItem(buckets, milestoneDef, milestone);
    return item ? [item] : [];
  } else if (milestone.rewards) {
    // Weekly Clan Milestones
    const rewards = milestone.rewards[0];
    const milestoneRewardDef = milestoneDef.rewards[rewards.rewardCategoryHash];

    return rewards.entries
      .filter((r) => !r.earned)
      .map((rewardEntry) =>
        weeklyClanMilestoneToItems(
          buckets,
          rewardEntry,
          milestoneDef,
          milestone,
          milestoneRewardDef
        )
      );
  }

  return [];
}

function availableQuestToItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  milestone: DestinyMilestone,
  milestoneDef: DestinyMilestoneDefinition,
  availableQuest: DestinyMilestoneQuest,
  characterClass: DestinyClass
): D2Item {
  const questDef = milestoneDef.quests[availableQuest.questItemHash];
  const displayProperties: DestinyDisplayPropertiesDefinition =
    questDef.displayProperties || milestoneDef.displayProperties;

  // Only look at the first reward, the rest are screwy (old engram versions, etc)
  const questRewards = questDef.questRewards
    ? _.take(
        questDef.questRewards.items
          // 75% of "rewards" are the invalid hash 0
          .filter((r) => r.itemHash)
          .map((r) => defs.InventoryItem.get(r.itemHash))
          // Filter out rewards that are for other characters
          .filter(
            (i) =>
              i &&
              (i.classType === characterClass || i.classType === DestinyClass.Unknown) &&
              // And quest steps, they're not interesting
              !i.itemCategoryHashes?.includes(ItemCategoryHashes.QuestStep)
          ),
        1
      )
    : [];

  const objectives = availableQuest.status.stepObjectives;

  const dimItem = makeMilestonePursuitItem(
    buckets,
    milestone,
    milestoneDef,
    displayProperties,
    objectives
  );

  if (questRewards) {
    dimItem.pursuit = {
      expirationDate: milestone.endDate ? new Date(milestone.endDate) : undefined,
      suppressExpirationWhenObjectivesComplete: false,
      places: [],
      activityTypes: [],
      modifierHashes: availableQuest?.activity?.modifierHashes || [],
      rewards: questRewards.map((r) => ({ itemHash: r.hash, quantity: 1 })),
    };
  }

  return dimItem;
}

function activityMilestoneToItem(
  buckets: InventoryBuckets,
  milestoneDef: DestinyMilestoneDefinition,
  milestone: DestinyMilestone
): D2Item | null {
  const objectives = milestone.activities[0].challenges.map((a) => a.objective);
  if (objectives.every((objective) => objective.complete)) {
    return null;
  }

  const dimItem = makeMilestonePursuitItem(
    buckets,
    milestone,
    milestoneDef,
    milestoneDef.displayProperties,
    objectives
  );

  if (milestone.rewards) {
    const rewards = milestone.rewards.flatMap((reward) =>
      Object.values(milestoneDef.rewards[reward.rewardCategoryHash].rewardEntries).flatMap(
        (entry) => entry.items
      )
    );

    dimItem.pursuit = {
      expirationDate: milestone.endDate ? new Date(milestone.endDate) : undefined,
      suppressExpirationWhenObjectivesComplete: false,
      places: [],
      activityTypes: [],
      modifierHashes: milestone.activities[0].modifierHashes || [],
      rewards,
    };
  }

  return dimItem;
}

/** Build an individual clan milestone activity into a pursuit. */
function weeklyClanMilestoneToItems(
  buckets: InventoryBuckets,
  rewardEntry: DestinyMilestoneRewardEntry,
  milestoneDef: DestinyMilestoneDefinition,
  milestone: DestinyMilestone,
  milestoneRewardDef: DestinyMilestoneRewardCategoryDefinition
): D2Item {
  const reward = milestoneRewardDef.rewardEntries[rewardEntry.rewardEntryHash];

  const displayProperties = {
    ...milestoneDef.displayProperties,
    ...reward.displayProperties,
  };

  const dimItem = makeFakePursuitItem(
    buckets,
    displayProperties,
    rewardEntry.rewardEntryHash,
    milestoneDef.displayProperties.name
  );

  dimItem.pursuit = {
    suppressExpirationWhenObjectivesComplete: false,
    expirationDate: milestone.endDate ? new Date(milestone.endDate) : undefined,
    places: [],
    activityTypes: [],
    modifierHashes: [],
    rewards: reward.items,
  };

  return dimItem;
}

function makeFakePursuitItem(
  buckets: InventoryBuckets,
  displayProperties: DestinyDisplayPropertiesDefinition,
  hash: number,
  typeName: string
) {
  const dimItem: D2Item = Object.assign(Object.create(ItemProto), {
    // figure out what year this item is probably from
    destinyVersion: 2,
    // The bucket the item is currently in
    location: buckets.byType.Pursuits,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: buckets.byType.Pursuits,
    hash,
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
    typeName,
    equipRequiredLevel: 0,
    maxStackSize: 1,
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: 3,
    classTypeNameLocalized: 'Any',
    element: null,
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
    collectibleHash: null,
    missingSockets: false,
  });

  return dimItem;
}

function makeMilestonePursuitItem(
  buckets: InventoryBuckets,
  milestone: DestinyMilestone,
  milestoneDef: DestinyMilestoneDefinition,
  displayProperties: DestinyDisplayPropertiesDefinition,
  objectives: DestinyObjectiveProgress[]
) {
  const dimItem = makeFakePursuitItem(
    buckets,
    displayProperties,
    milestone.milestoneHash,
    milestoneTypeName(milestoneDef.milestoneType)
  );

  if (objectives) {
    dimItem.objectives = objectives;

    const length = dimItem.objectives.length;
    dimItem.percentComplete = _.sumBy(dimItem.objectives, (objective) => {
      if (objective.completionValue) {
        return Math.min(1, (objective.progress || 0) / objective.completionValue) / length;
      } else {
        return 0;
      }
    });
  }

  return dimItem;
}

function milestoneTypeName(milestoneType: DestinyMilestoneType) {
  switch (milestoneType) {
    case DestinyMilestoneType.Daily:
      return t('Milestone.Daily');
    case DestinyMilestoneType.Weekly:
      return t('Milestone.Weekly');
    case DestinyMilestoneType.Special:
      return t('Milestone.Special');
    case DestinyMilestoneType.Tutorial:
      return t('Milestone.Tutorial');
    case DestinyMilestoneType.OneTime:
      return t('Milestone.OneTime');
  }
  return t('Milestone.Unknown');
}
