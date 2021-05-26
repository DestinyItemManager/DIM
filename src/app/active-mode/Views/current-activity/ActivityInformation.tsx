import styles from 'app/active-mode/Views/current-activity/ActivityInformation.m.scss';
import { profileResponseSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { ActivityModifier } from 'app/progress/ActivityModifier';
import { RaidActivity } from 'app/progress/RaidDisplay';
import { DestinyCharacterActivitiesComponent, DestinyMilestone } from 'bungie-api-ts/destiny2';
import React from 'react';
import { useSelector } from 'react-redux';

interface Props {
  store: DimStore;
  activityInfo: DestinyCharacterActivitiesComponent;
}

// const WEEKLY_VANGUARD_STRIKES = 1437935813;

/** Find unclaimed vendor bounties based on your current activity */
export default function ActivityInformation({ store, activityInfo }: Props) {
  const profileInfo = useSelector(profileResponseSelector);
  const defs = useD2Definitions()!;

  const activity =
    activityInfo.currentActivityHash && defs.Activity.get(activityInfo.currentActivityHash);

  if (!activity) {
    return null;
  }

  const profileMilestoneData = profileInfo?.characterProgressions?.data?.[store.id]?.milestones;

  const allMilestones: DestinyMilestone[] = profileMilestoneData
    ? Object.values(profileMilestoneData)
    : [];

  const milestones = allMilestones.find((milestone) => {
    const milestoneActivities = (defs.Milestone.get(milestone.milestoneHash) || {}).activities;
    return milestoneActivities?.find(
      (milesoneActivity) =>
        milesoneActivity.activityHash === activityInfo.currentPlaylistActivityHash
    );
  });

  const raidPhases = milestones?.activities.filter((activity) => activity.phases);

  const milestoneActivity = milestones?.activities.find(
    (activity) => activity.activityHash === activityInfo.currentPlaylistActivityHash
  );

  return (
    <>
      {raidPhases && raidPhases.length > 0 ? (
        <div className={styles.activityRaid}>
          {raidPhases.map((raidActivity) => (
            <RaidActivity
              activity={raidActivity}
              displayName={''}
              hideName={true}
              key={raidActivity.activityHash}
            />
          ))}
        </div>
      ) : (
        milestoneActivity?.modifierHashes?.map((modifierHash) => (
          <ActivityModifier key={modifierHash} modifierHash={modifierHash} />
        ))
      )}
    </>
  );
}
