import { D1ObjectiveDefinition } from 'app/destiny1/d1-manifest-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import {
  DestinyInventoryItemDefinition,
  DestinyObjectiveDefinition,
  DestinyObjectiveProgress,
  DestinyUnlockValueUIStyle,
} from 'bungie-api-ts/destiny2';
import trialsHashes from 'data/d2/d2-trials-objectives.json';

/**
 * These are the utilities that deal with figuring out Objectives for items.
 *
 * This is called from within d2-item-factory.service.ts
 */

/**
 * Build regular item-level objectives.
 */
export function buildObjectives(
  itemDef: DestinyInventoryItemDefinition,
  defs: D2ManifestDefinitions,
  itemInstancedObjectives: DestinyObjectiveProgress[] | undefined,
  itemUninstancedObjectives: DestinyObjectiveProgress[] | undefined
): DestinyObjectiveProgress[] | undefined {
  const objectives = itemInstancedObjectives ?? itemUninstancedObjectives ?? [];

  if (!objectives?.length) {
    // fill in objectives from its definition. not sure why if there's no available progression data? what case does this catch?
    if (itemDef.objectives) {
      return itemDef.objectives.objectiveHashes.map((o) => ({
        objectiveHash: o,
        complete: false,
        visible: true,
        completionValue: defs.Objective.get(o).completionValue,
      }));
    }

    return;
  }

  // TODO: we could make a tooltip with the location + activities for each objective (and maybe offer a ghost?)
  return objectives.filter((o) => o.visible && defs.Objective.get(o.objectiveHash));
}

export function getValueStyle(
  objectiveDef: DestinyObjectiveDefinition | D1ObjectiveDefinition | undefined,
  progress: number,
  completionValue = 0
) {
  return objectiveDef
    ? (progress < completionValue
        ? 'inProgressValueStyle' in objectiveDef && objectiveDef.inProgressValueStyle
        : 'completedValueStyle' in objectiveDef && objectiveDef.completedValueStyle) ??
        objectiveDef.valueStyle
    : DestinyUnlockValueUIStyle.Automatic;
}

export function isBooleanObjective(
  objectiveDef: DestinyObjectiveDefinition | D1ObjectiveDefinition,
  progress: number | undefined,
  completionValue: number
) {
  return (
    getValueStyle(objectiveDef, progress ?? 0, completionValue) ===
      DestinyUnlockValueUIStyle.Checkbox ||
    (completionValue === 1 &&
      (!('allowOvercompletion' in objectiveDef) ||
        !objectiveDef.allowOvercompletion ||
        !objectiveDef.showValueOnComplete))
  );
}

export function isTrialsPassage(itemHash: number) {
  return trialsHashes.passages.includes(itemHash);
}

/**
 * Checks if the trials passage is flawless
 */
export function isFlawlessPassage(objectives: DestinyObjectiveProgress[] | undefined) {
  return objectives?.some((obj) => isFlawlessObjective(obj.objectiveHash) && obj.complete);
}

export function isFlawlessObjective(objectiveHash: number) {
  return trialsHashes.objectives[objectiveHash] === 'Flawless';
}

export function isWinsObjective(objectiveHash: number) {
  return trialsHashes.objectives[objectiveHash] === 'Wins';
}

export function isRoundsWonObjective(objectiveHash: number) {
  return trialsHashes.objectives[objectiveHash] === 'Rounds Won';
}
