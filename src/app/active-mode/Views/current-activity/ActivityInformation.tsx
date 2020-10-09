import styles from 'app/active-mode/Views/current-activity/ActivityInformation.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { profileResponseSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { RaidActivity } from 'app/progress/RaidDisplay';
import { RootState } from 'app/store/types';
import {
  DestinyActivityDefinition,
  DestinyActivityModeType,
  DestinyMilestone,
  DestinyProfileResponse,
} from 'bungie-api-ts/destiny2';
import React from 'react';
import { connect } from 'react-redux';

interface ProvidedProps {
  defs: D2ManifestDefinitions;
  store: DimStore;
  activity: DestinyActivityDefinition;
}

interface StoreProps {
  profileInfo?: DestinyProfileResponse;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    profileInfo: profileResponseSelector(state),
  };
}

type Props = ProvidedProps & StoreProps;

/** Find unclaimed vendor bounties based on your current activity */
function ActivityInformation({ defs, store, activity, profileInfo }: Props) {
  if (
    !activity?.activityModeTypes.length ||
    activity?.activityModeTypes.includes(DestinyActivityModeType.Social)
  ) {
    return null;
  }

  const profileMilestoneData = profileInfo?.characterProgressions?.data?.[store.id]?.milestones;
  const allMilestones: DestinyMilestone[] = profileMilestoneData
    ? Object.values(profileMilestoneData)
    : [];

  // filter to milestones with child activities of type <ActivityType "Raid" 2043403989>
  const raid = allMilestones.find((milestone) => {
    const milestoneActivities = (defs.Milestone.get(milestone.milestoneHash) || {}).activities;
    return milestoneActivities?.find(
      (milesoneActivity) => milesoneActivity.activityHash === activity.hash
    );
  });

  if (!raid) {
    return null;
  }

  const activities = raid.activities.filter((activity) => activity.phases);

  return (
    <>
      {raid && (
        <div className={styles.activityRaid}>
          {activities.map((raidActivity) => (
            <RaidActivity
              activity={raidActivity}
              displayName={''}
              defs={defs}
              hideName={true}
              key={raidActivity.activityHash}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default connect<StoreProps>(mapStateToProps)(ActivityInformation);
