import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { DUNGEON_ACTIVITY_TYPE_HASH } from 'app/search/d2-known-values';
import {
  DestinyActivity,
  DestinyActivityDefinition,
  DestinyDisplayPropertiesDefinition,
  DestinyProfileResponse,
} from 'bungie-api-ts/destiny2';
import { DungeonActivity, DungeonDisplay } from './DungeonDisplay';
import { getCharacterActivities } from './selectors';

interface DungeonVariant {
  activityHash: number;
  name?: string;
  modifierHashes: number[];
}

interface DungeonDetails {
  displayProperties: DestinyDisplayPropertiesDefinition;
  complete: boolean;
  variants: DungeonVariant[];
}

function getDungeonName(activityDef: DestinyActivityDefinition): string {
  return activityDef.originalDisplayProperties?.name || activityDef.displayProperties.name;
}

export function buildDungeonDetails(
  baseActivityHash: number,
  activities: readonly DestinyActivity[],
  getActivityDefinition: (activityHash: number) => DestinyActivityDefinition | undefined,
  getModifierName: (modifierHash: number) => string | undefined,
  dungeonDisplayProperties: DestinyDisplayPropertiesDefinition,
): DungeonDetails | undefined {
  const baseActivity = activities.find(
    (activity) =>
      activity.activityHash === baseActivityHash &&
      activity.isVisible &&
      (activity.canLead || activity.canJoin),
  );

  const baseActivityDef = getActivityDefinition(baseActivityHash);

  if (!baseActivity || baseActivityDef?.activityTypeHash !== DUNGEON_ACTIVITY_TYPE_HASH) {
    return undefined;
  }

  const dungeonName = getDungeonName(baseActivityDef);

  if (!dungeonName) {
    return undefined;
  }

  const activeObjectives = (baseActivity.challenges ?? [])
    .map((challenge) => challenge.objective)
    .filter((objective) => objective.visible);

  // Bungie removes the weekly challenge after it is completed. Once we
  // confirm a dungeon is featured, a missing challenge indicates that
  // this character completed it.
  const complete =
    activeObjectives.length === 0 || activeObjectives.every((objective) => objective.complete);

  const variants = activities.flatMap((activity): DungeonVariant[] => {
    if (!activity.isVisible || (!activity.canLead && !activity.canJoin)) {
      return [];
    }

    const activityDef = getActivityDefinition(activity.activityHash);

    if (activityDef?.activityTypeHash !== DUNGEON_ACTIVITY_TYPE_HASH) {
      return [];
    }

    if (getDungeonName(activityDef) !== dungeonName) {
      return [];
    }

    const modifierHashes = (activity.modifierHashes ?? []).filter((modifierHash) =>
      Boolean(getModifierName(modifierHash)),
    );

    // Don't render an empty Standard/Normal/Master heading.
    if (modifierHashes.length === 0) {
      return [];
    }

    const selectionName = activityDef.selectionScreenDisplayProperties?.name;

    return [
      {
        activityHash: activity.activityHash,
        name: selectionName && selectionName !== dungeonName ? selectionName : undefined,
        modifierHashes,
      },
    ];
  });

  return {
    displayProperties: {
      ...dungeonDisplayProperties,
      name: dungeonName,
    },
    complete,
    variants,
  };
}

export default function Dungeon({
  activityHash,
  store,
  profileInfo,
}: {
  activityHash: number;
  store: DimStore;
  profileInfo: DestinyProfileResponse;
}) {
  const defs = useD2Definitions()!;

  const activities = getCharacterActivities(profileInfo, store.id)?.availableActivities ?? [];

  const dungeonMode = defs.ActivityMode.get(DUNGEON_ACTIVITY_TYPE_HASH);

  if (!dungeonMode) {
    return null;
  }

  const dungeon = buildDungeonDetails(
    activityHash,
    activities,
    (hash) => defs.Activity.get(hash),
    (hash) => defs.ActivityModifier.get(hash)?.displayProperties.name,
    dungeonMode.displayProperties,
  );

  if (!dungeon) {
    return null;
  }

  return (
    <DungeonDisplay displayProperties={dungeon.displayProperties} complete={dungeon.complete}>
      {dungeon.variants.map((variant) => (
        <DungeonActivity
          key={variant.activityHash}
          displayName={variant.name}
          modifierHashes={variant.modifierHashes}
        />
      ))}
    </DungeonDisplay>
  );
}
