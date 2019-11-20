import {
  DestinyItemComponent,
  DestinyItemObjectivesComponent,
  DestinyObjectiveProgress,
  DestinyUnlockValueUIStyle
} from 'bungie-api-ts/destiny2';
import { DimObjective, DimFlavorObjective } from '../item-types';
import { t } from 'app/i18next-t';
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
): DimObjective[] | null {
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
  return objectives
    .filter((o) => o.visible && defs.Objective.get(o.objectiveHash))
    .map((objective) => {
      const def = defs.Objective.get(objective.objectiveHash);

      let complete = false;
      let booleanValue = false;
      let display = `${(
        objective.progress || 0
      ).toLocaleString()}/${objective.completionValue.toLocaleString()}`;
      let displayStyle: string | null;
      switch (objective.complete ? def.valueStyle : def.inProgressValueStyle) {
        case DestinyUnlockValueUIStyle.Integer:
          display = `${objective.progress || 0}`;
          displayStyle = 'integer';
          break;
        case DestinyUnlockValueUIStyle.Multiplier:
          display = `${((objective.progress || 0) / objective.completionValue).toLocaleString()}x`;
          displayStyle = 'integer';
          break;
        case DestinyUnlockValueUIStyle.DateTime: {
          const date = new Date(0);
          date.setUTCSeconds(objective.progress || 0);
          display = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
          displayStyle = 'integer';
          break;
        }
        case DestinyUnlockValueUIStyle.Checkbox:
        case DestinyUnlockValueUIStyle.Automatic:
          displayStyle = null;
          booleanValue = objective.completionValue === 1;
          complete = objective.complete;
          break;
        default:
          displayStyle = null;
          complete = objective.complete;
      }

      return {
        displayName:
          def.displayProperties.name ||
          def.progressDescription ||
          (objective.complete ? t('Objectives.Complete') : t('Objectives.Incomplete')),
        description: def.displayProperties.description,
        progress: objective.progress || 0,
        completionValue: objective.completionValue,
        complete,
        boolean: booleanValue,
        displayStyle,
        display
      };
    });
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
