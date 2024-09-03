import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem, DimPursuitExpiration } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { DimRecord } from 'app/records/presentation-nodes';
import { d2MissingIcon } from 'app/search/d2-known-values';
import { isClassCompatible } from 'app/utils/item-utils';
import {
  DestinyAmmunitionType,
  DestinyDisplayPropertiesDefinition,
  DestinyMilestone,
  DestinyMilestoneDefinition,
  DestinyMilestoneQuest,
  DestinyMilestoneRewardCategory,
  DestinyMilestoneRewardCategoryDefinition,
  DestinyMilestoneRewardEntry,
  DestinyMilestoneType,
  DestinyObjectiveProgress,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import _ from 'lodash';

export function milestoneToItems(
  milestone: DestinyMilestone,
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  store: DimStore,
): DimItem[] {
  const milestoneDef = defs.Milestone.get(milestone.milestoneHash);

  // TODO: activity locations (nightfalls, etc)

  if (milestone.availableQuests) {
    return milestone.availableQuests.map((availableQuest) =>
      availableQuestToItem(defs, buckets, milestone, milestoneDef, availableQuest, store),
    );
  } else if (milestone.activities?.length) {
    const item = activityMilestoneToItem(buckets, milestoneDef, milestone, defs, store);
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
          milestoneRewardDef,
          store,
        ),
      );
  } else {
    const item = makeMilestonePursuitItem(
      buckets,
      milestone,
      milestoneDef,
      milestoneDef.displayProperties,
      [],
      store,
    );
    return item ? [item] : [];
  }
}

function milestoneExpiration(milestone: DestinyMilestone): DimPursuitExpiration | undefined {
  return milestone.endDate
    ? {
        expirationDate: new Date(milestone.endDate),
        suppressExpirationWhenObjectivesComplete: false,
        expiredInActivityMessage: undefined,
      }
    : undefined;
}

function availableQuestToItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  milestone: DestinyMilestone,
  milestoneDef: DestinyMilestoneDefinition,
  availableQuest: DestinyMilestoneQuest,
  store: DimStore,
): DimItem {
  const questDef = milestoneDef.quests[availableQuest.questItemHash];
  const questItem = defs.InventoryItem.get(questDef.questItemHash);
  const challengeItemHash = questItem.setData?.itemList[0].itemHash;
  const challengeItem = challengeItemHash ? defs.InventoryItem.get(challengeItemHash) : undefined;
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
              isClassCompatible(i.classType, store.classType) &&
              // And quest steps, they're not interesting
              !i.itemCategoryHashes?.includes(ItemCategoryHashes.QuestStep),
          ),
        1,
      )
    : [];

  const objectives = availableQuest.status.stepObjectives;

  const dimItem = makeMilestonePursuitItem(
    buckets,
    milestone,
    milestoneDef,
    displayProperties,
    objectives,
    store,
  );
  if (dimItem.pursuit === null) {
    throw new Error(''); // can't happen
  }

  dimItem.secondaryIcon = challengeItem?.secondaryIcon;
  dimItem.pursuit.modifierHashes = availableQuest?.activity?.modifierHashes || [];

  if (questRewards?.length) {
    dimItem.pursuit.rewards = questRewards.map((r) => ({
      itemHash: r.hash,
      quantity: 1,
      hasConditionalVisibility: false,
    }));
  } else if (questDef.questItemHash) {
    const questItem = defs.InventoryItem.get(questDef.questItemHash);
    if (questItem?.value?.itemValue.length) {
      dimItem.pursuit.rewards = questItem.value.itemValue
        .filter((v) => v.itemHash !== 0)
        .map((v) => ({
          itemHash: v.itemHash,
          quantity: v.quantity || 1,
          hasConditionalVisibility: false,
        }));
    }
  }

  return dimItem;
}

function activityMilestoneToItem(
  buckets: InventoryBuckets,
  milestoneDef: DestinyMilestoneDefinition,
  milestone: DestinyMilestone,
  defs: D2ManifestDefinitions,
  store: DimStore,
): DimItem | null {
  // Find the first activity that hasn't been completed. TODO: Can we show all of them?
  const activity = milestone.activities.find((a) =>
    a.challenges.some((c) => !c.objective.complete),
  );
  // Ignore the milestone if all activities are complete or there are no challenges.
  if (!activity) {
    return null;
  }
  const activityDef = activity && defs.Activity.get(activity.activityHash);
  const objectives = activity.challenges.map((a) => a.objective);
  const dimItem = makeMilestonePursuitItem(
    buckets,
    milestone,
    milestoneDef,
    milestoneDef.displayProperties,
    objectives,
    store,
  );
  if (dimItem.pursuit === null) {
    throw new Error(''); // can't happen
  }

  dimItem.pursuit.modifierHashes = activity.modifierHashes || [];

  if (activityDef) {
    if (!milestone.rewards) {
      dimItem.pursuit.rewards = activityDef.challenges
        .filter((c) => objectives.some((o) => o.objectiveHash === c.objectiveHash))
        .flatMap((c) => c.dummyRewards);
    }
    if (milestoneDef.hash === 2029743966 /* Nightfall Weekly Score Challenge */) {
      dimItem.name = `${dimItem.name}: ${activityDef.displayProperties.description}`;
    } else if (milestoneDef.hash === 1506285920 /* Crucible Labs Playlist Challenge */) {
      dimItem.name = `${dimItem.name}: ${activityDef.displayProperties.name}`;
    }
  }

  return dimItem;
}

/** Build an individual clan milestone activity into a pursuit. */
function weeklyClanMilestoneToItems(
  buckets: InventoryBuckets,
  rewardEntry: DestinyMilestoneRewardEntry,
  milestoneDef: DestinyMilestoneDefinition,
  milestone: DestinyMilestone,
  milestoneRewardDef: DestinyMilestoneRewardCategoryDefinition,
  store: DimStore,
): DimItem {
  const reward = milestoneRewardDef.rewardEntries[rewardEntry.rewardEntryHash];

  const displayProperties: DestinyDisplayPropertiesDefinition = {
    ...milestoneDef.displayProperties,
    ...reward.displayProperties,
  };

  const dimItem = makeFakePursuitItem(
    buckets,
    displayProperties,
    rewardEntry.rewardEntryHash,
    milestoneDef.displayProperties.name,
    store,
  );

  dimItem.pursuit = {
    expiration: milestoneExpiration(milestone),
    modifierHashes: [],
    rewards: reward.items,
  };

  return dimItem;
}

function makeFakePursuitItem(
  buckets: InventoryBuckets,
  displayProperties: DestinyDisplayPropertiesDefinition,
  hash: number,
  typeName: string,
  store: DimStore,
): DimItem {
  const bucket = buckets.byHash[BucketHashes.Quests];
  return {
    // figure out what year this item is probably from
    destinyVersion: 2,
    // The bucket the item is currently in
    location: bucket,
    // The bucket the item normally resides in (even though it may be in the vault/postmaster)
    bucket: bucket,
    hash,
    // This is the type of the item (see DimCategory/DimBuckets) regardless of location
    type: 'Milestone',
    itemCategoryHashes: [], // see defs.ItemCategory
    tier: 'Rare',
    isExotic: false,
    name: displayProperties.name,
    description: displayProperties.description,
    icon: displayProperties.icon || d2MissingIcon,
    notransfer: true,
    canPullFromPostmaster: false,
    id: '0', // zero for non-instanced is legacy hack
    instanced: false,
    equipped: false,
    equipment: false, // TODO: this has a ton of good info for the item move logic
    complete: false,
    amount: 1,
    primaryStat: null,
    typeName,
    equipRequiredLevel: 0,
    maxStackSize: 1,
    // 0: titan, 1: hunter, 2: warlock, 3: any
    classType: 3,
    classTypeNameLocalized: 'Any',
    element: null,
    lockable: false,
    tracked: false,
    locked: false,
    masterwork: false,
    crafted: false,
    highlightedObjective: false,
    classified: false,
    isEngram: false,
    percentComplete: 0, // filled in later
    hidePercentage: false,
    stats: null, // filled in later
    objectives: undefined, // filled in later
    ammoType: DestinyAmmunitionType.None,
    missingSockets: false,
    breakerType: null,
    pursuit: null,
    taggable: false,
    comparable: false,
    wishListEnabled: false,
    power: 0,
    index: hash.toString(),
    infusable: false,
    infusionFuel: false,
    sockets: null,
    masterworkInfo: null,
    infusionCategoryHashes: null,
    owner: store.id,
    uniqueStack: false,
    trackable: false,
    energy: null,
  };
}

function makeMilestonePursuitItem(
  buckets: InventoryBuckets,
  milestone: DestinyMilestone,
  milestoneDef: DestinyMilestoneDefinition,
  displayProperties: DestinyDisplayPropertiesDefinition,
  objectives: DestinyObjectiveProgress[],
  store: DimStore,
) {
  const dimItem = makeFakePursuitItem(
    buckets,
    displayProperties,
    milestone.milestoneHash,
    milestoneTypeName(milestoneDef.milestoneType),
    store,
  );

  if (objectives) {
    dimItem.objectives = objectives;
    dimItem.percentComplete = calculatePercentComplete(dimItem.objectives);
  }

  dimItem.pursuit = {
    expiration: milestoneExpiration(milestone),
    modifierHashes: milestone.activities?.[0]?.modifierHashes || [],
    rewards: [],
  };

  if (milestone.rewards) {
    dimItem.pursuit.rewards = processRewards(milestone.rewards, milestoneDef);
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
    case DestinyMilestoneType.Unknown:
      return t('Milestone.Unknown');
  }
}

export function recordToPursuitItem(
  record: DimRecord,
  buckets: InventoryBuckets,
  store: DimStore,
  typeName: string,
  tracked: boolean,
) {
  const dimItem = makeFakePursuitItem(
    buckets,
    record.recordDef.displayProperties,
    record.recordDef.hash,
    typeName,
    store,
  );

  if (record.recordComponent.objectives) {
    dimItem.objectives = record.recordComponent.objectives;
    dimItem.percentComplete = calculatePercentComplete(dimItem.objectives);
  }

  const state = record.recordComponent.state;
  const acquired = Boolean(state & DestinyRecordState.RecordRedeemed);
  dimItem.complete = !acquired && !(state & DestinyRecordState.ObjectiveNotCompleted);

  dimItem.pursuit = {
    expiration: undefined,
    modifierHashes: [],
    rewards: [],
    recordHash: record.recordDef.hash,
    trackedInGame: record.trackedInGame,
  };

  if (record.recordDef.rewardItems) {
    dimItem.pursuit.rewards = record.recordDef.rewardItems.filter(
      (_r, i) => record.recordComponent.rewardVisibilty?.[i] ?? true,
    );
  }

  dimItem.trackable = true;
  dimItem.tracked = record.trackedInGame || tracked;

  return dimItem;
}

function calculatePercentComplete(objectives: DestinyObjectiveProgress[]) {
  const length = objectives.length;
  return _.sumBy(objectives, (objective) => {
    if (objective.completionValue) {
      return Math.min(1, (objective.progress || 0) / objective.completionValue) / length;
    } else {
      return 0;
    }
  });
}

function processRewards(
  rewards: DestinyMilestoneRewardCategory[],
  milestoneDef: DestinyMilestoneDefinition,
) {
  return rewards.flatMap((reward) => {
    const rewardCategoryDef = milestoneDef.rewards[reward.rewardCategoryHash];
    return reward.entries.flatMap(
      (entry) => rewardCategoryDef.rewardEntries[entry.rewardEntryHash]?.items ?? [],
    );
  });
}
