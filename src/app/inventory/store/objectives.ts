import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemObjectivesComponent,
  DestinyObjectiveDefinition,
  DestinyObjectiveProgress,
  DestinyUnlockValueUIStyle,
} from 'bungie-api-ts/destiny2';
import { DimItem } from '../item-types';

/**
 * These are the utilities that deal with figuring out Objectives for items.
 *
 * This is called from within d2-item-factory.service.ts
 */

/**
 * Build regular item-level objectives.
 */
export function buildObjectives(
  item: DestinyItemComponent,
  itemDef: DestinyInventoryItemDefinition,
  objectivesMap: { [key: string]: DestinyItemObjectivesComponent } | undefined,
  defs: D2ManifestDefinitions,
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  }
): DestinyObjectiveProgress[] | null {
  const objectives =
    item.itemInstanceId && objectivesMap?.[item.itemInstanceId]
      ? objectivesMap[item.itemInstanceId].objectives
      : uninstancedItemObjectives
      ? uninstancedItemObjectives[item.itemHash]
      : [];

  if (!objectives || !objectives.length) {
    // Hmm, it should have objectives
    if (itemDef.objectives) {
      return itemDef.objectives.objectiveHashes.map((o) => ({
        objectiveHash: o,
        complete: false,
        visible: true,
        completionValue: defs.Objective.get(o).completionValue,
      }));
    }

    return null;
  }

  // TODO: we could make a tooltip with the location + activities for each objective (and maybe offer a ghost?)
  return objectives.filter((o) => o.visible && defs.Objective.get(o.objectiveHash));
}

export function isBooleanObjective(
  objectiveDef: DestinyObjectiveDefinition,
  completionValue: number
) {
  return (
    objectiveDef.valueStyle === DestinyUnlockValueUIStyle.Checkbox ||
    (completionValue === 1 &&
      (!objectiveDef.allowOvercompletion || !objectiveDef.showValueOnComplete))
  );
}

export function isTrialsPassage(item: DimItem, defs: D2ManifestDefinitions) {
  if (item.objectives?.length === 3 && item.isExotic) {
    for (const objective of item.objectives) {
      const objectiveDef = defs.Objective.get(objective.objectiveHash);
      if (isFlawlessObjective(objective, objectiveDef)) {
        return true;
      }
    }
  }
  return false;
}

export function isFlawlessPassage(
  objectives: DestinyObjectiveProgress[] | null,
  defs: D2ManifestDefinitions
) {
  if (objectives && objectives.length === 3) {
    for (const objective of objectives) {
      if (isFlawlessObjective(objective, defs.Objective.get(objective.objectiveHash))) {
        return objective.complete;
      }
    }
    return false;
  }
  return false;
}

// Assumes that the item related to the objective is a trials passage
export function isFlawlessObjective(
  objective: DestinyObjectiveProgress,
  objectiveDef: DestinyObjectiveDefinition
) {
  return (
    objective.completionValue === 1 &&
    objectiveDef.allowValueChangeWhenCompleted &&
    !objectiveDef.allowOvercompletion
  );
}

export function isWinsObjective(
  objective: DestinyObjectiveProgress,
  objectiveDef: DestinyObjectiveDefinition
) {
  return (
    objective.completionValue === 7 &&
    !objectiveDef.allowValueChangeWhenCompleted &&
    !objectiveDef.allowOvercompletion
  );
}
