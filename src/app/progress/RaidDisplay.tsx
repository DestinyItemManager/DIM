import { useD2Definitions } from 'app/manifest/selectors';
import {
  ARMSMASTER_ACTIVITY_MODIFIER,
  ENCOUNTERS_COMPLETED_OBJECTIVE,
} from 'app/search/d2-known-values';
import {
  DestinyDisplayPropertiesDefinition,
  DestinyMilestoneChallengeActivity,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import { ActivityModifier } from './ActivityModifier';
import {
  ObjectiveCheckbox,
  ObjectiveDescription,
  ObjectiveProgress,
  ObjectiveRow,
} from './Objective';
import * as styles from './RaidDisplay.m.scss';

/**
 * Outer wrapper of a Raid type (example: EoW) with icon
 */
export function RaidDisplay(props: {
  displayProperties: DestinyDisplayPropertiesDefinition;
  children?: React.ReactNode;
}) {
  const { displayProperties, children } = props;

  return (
    <div className="milestone-quest">
      <div className="milestone-icon">
        {displayProperties.hasIcon && (
          <BungieImage className="milestone-img" src={displayProperties.icon} />
        )}
      </div>
      <div className={clsx('milestone-info', styles.raidTiers)}>{children}</div>
    </div>
  );
}

/**
 * a Raid Activity, (examples: "EoW", or "EoW Prestige")
 * describes its phases and difficulty tier if applicable
 *
 * a Raid Phase, described in EN strings as an "Encounter", is a segment of a Raid
 * which offers loot 1x per week, whose completion is tracked by the game & API
 */
export function RaidActivity({
  activity,
  displayName,
  hideName,
}: {
  activity: DestinyMilestoneChallengeActivity;
  /** an override label to use instead of the activity's name */
  displayName?: string;
  hideName?: boolean;
}) {
  const defs = useD2Definitions()!;
  // a manifest-localized string describing raid segments with loot. "Encounters completed"
  const encountersString = defs.Objective.get(ENCOUNTERS_COMPLETED_OBJECTIVE).progressDescription;

  // convert character's DestinyMilestoneChallengeActivity to manifest's DestinyActivityDefinition
  const activityDef = defs.Activity.get(activity.activityHash);

  // override individual activity name if there's only 1 tier of the raid
  const activityName = displayName || activityDef.displayProperties.name;

  return (
    <div className={styles.raidActivity}>
      {!hideName && <span className="milestone-name">{activityName}</span>}
      {activity.modifierHashes?.map(
        (modifierHash) =>
          modifierHash !== ARMSMASTER_ACTIVITY_MODIFIER && (
            <ActivityModifier key={modifierHash} modifierHash={modifierHash} small />
          ),
      )}
      {activity.phases && activity.phases.length > 0 && (
        <ObjectiveRow
          complete={activity.phases.every((p) => p.complete)}
          className={styles.questObjectives}
          boolean
        >
          {activity.phases?.map((phase) => (
            <ObjectiveCheckbox key={phase.phaseHash} completed={phase.complete} />
          ))}
          <ObjectiveProgress>
            <ObjectiveDescription description={encountersString} />
          </ObjectiveProgress>
        </ObjectiveRow>
      )}
    </div>
  );
}
