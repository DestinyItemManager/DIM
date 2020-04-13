import {
  DestinyItemComponent,
  DestinyItemObjectivesComponent,
  DestinyObjectiveProgress,
  DestinyObjectiveDefinition,
  DestinyUnlockValueUIStyle
} from 'bungie-api-ts/destiny2';
import { DimFlavorObjective } from '../item-types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';

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
  objectivesMap: { [key: string]: DestinyItemObjectivesComponent },
  defs: D2ManifestDefinitions,
  uninstancedItemObjectives?: {
    [key: number]: DestinyObjectiveProgress[];
  }
): DestinyObjectiveProgress[] | null {
  const objectives =
    item.itemInstanceId && objectivesMap[item.itemInstanceId]
      ? objectivesMap[item.itemInstanceId].objectives
      : uninstancedItemObjectives
      ? uninstancedItemObjectives[item.itemHash]
      : [];

  if (!objectives || !objectives.length) {
    return null;
  }

  // TODO: we could make a tooltip with the location + activities for each objective (and maybe offer a ghost?)
  return objectives.filter((o) => o.visible && defs.Objective.get(o.objectiveHash));
}

/**
 * Build "Flavor" objectives. These are typically counters (like emblem stats), not real objectives.
 */
export function buildFlavorObjective(
  item: DestinyItemComponent,
  objectivesMap: { [key: string]: DestinyItemObjectivesComponent },
  defs: D2ManifestDefinitions
): DimFlavorObjective | null {
  if (!item.itemInstanceId || !objectivesMap[item.itemInstanceId]) {
    return null;
  }

  const flavorObjective = objectivesMap[item.itemInstanceId].flavorObjective;
  if (!flavorObjective) {
    return null;
  }

  // Fancy emblems with multiple trackers are tracked as regular objectives, but the info is duplicated in
  // flavor objective. If that's the case, skip flavor.
  const objectives = objectivesMap[item.itemInstanceId].objectives;
  if (objectives?.some((o) => o.objectiveHash === flavorObjective.objectiveHash)) {
    return null;
  }

  const def = defs.Objective.get(flavorObjective.objectiveHash);
  return {
    description: def.progressDescription,
    icon: def.displayProperties.hasIcon ? def.displayProperties.icon : '',
    progress:
      def.valueStyle === 5
        ? (flavorObjective.progress || 0) / flavorObjective.completionValue
        : (def.valueStyle === 6 || def.valueStyle === 0 ? flavorObjective.progress : 0) || 0
  };
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
