
import {
  DestinyObjectiveProgress,
  DestinyQuestStatus,
} from 'bungie-api-ts/destiny2';
import * as React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { settings } from '../settings/settings';

/**
 * The display for a milestone quest's objective. Either a count to be shown under the icon, or a
 * checkmark if the objective has been completed but not picked up. If it's a single-step objective
 * don't display anything until it's complete, because it's obvious there's only one thing to do.
 */
export default function MilestoneObjectiveStatus({
  objective,
  defs,
  status
}: {
  objective: DestinyObjectiveProgress | null;
  status: DestinyQuestStatus;
  defs: D2ManifestDefinitions;
}) {
  if (objective) {
    const objectiveDef = defs.Objective.get(objective.objectiveHash);

    let progress = objective.progress || 0;
    let completionValue = objectiveDef.completionValue;
    if (objective.objectiveHash === 3289403948) {
      // This is the personal clan XP progression
      const progressDef = defs.Progression.get(540048094);
      progress *= progressDef.steps[1].progressTotal;
      completionValue *= progressDef.steps[1].progressTotal;
    }

    if (status.completed) {
      return <span><i className="fa fa-check-circle-o"/></span>;
    } else if (completionValue > 1) {
      const formatter = new Intl.NumberFormat(settings.language);
      return <span>{formatter.format(progress)}<wbr/>/<wbr/>{formatter.format(completionValue)}</span>;
    }
  }

  return null;
}
