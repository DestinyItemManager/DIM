import { DestinyAccount } from 'app/accounts/destiny-account';
import ActivityInformation from 'app/active-mode/Views/current-activity/ActivityInformation';
import VendorBounties from 'app/active-mode/Views/current-activity/VendorBounties';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import { getCurrentActivity } from 'app/bungie-api/destiny2-api';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { refresh } from 'app/shell/refresh';
import { RootState } from 'app/store/types';
import { DestinyCharacterActivitiesComponent } from 'bungie-api-ts/destiny2';
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

interface ProvidedProps {
  account: DestinyAccount;
  store: DimStore;
  buckets: InventoryBuckets;
}

interface StoreProps {
  defs?: D2ManifestDefinitions;
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    defs: state.manifest.d2Manifest,
  };
}

type Props = ProvidedProps & StoreProps;

const ACTIVITY_REFRESH_RATE = 10_000;
let cooldown = Date.now();
let intervalId = 0;
let firstLoad = true;

async function refreshActivity({ account, store }: { account: DestinyAccount; store: DimStore }) {
  const profileInfo = await getCurrentActivity(account);
  return profileInfo.characterActivities.data?.[store.id];
}

function CurrentActivity({ account, store, defs, buckets }: Props) {
  const [activityInfo, setActivityInfo] = useState<
    DestinyCharacterActivitiesComponent | undefined
  >();
  const prevActivityInfo = useRef<DestinyCharacterActivitiesComponent | undefined>();

  useEffect(() => {
    if (firstLoad) {
      refreshActivity({ account, store }).then(setActivityInfo);
    }

    window.clearInterval(intervalId);
    intervalId = window.setInterval(() => {
      // If the activity mode just changed, trust the new one and don't ping for a little.
      // Sometimes there is a weird cache issue, where even after some time it flips back and forth with the last
      if (Date.now() - cooldown < ACTIVITY_REFRESH_RATE * 6) {
        return;
      }

      refreshActivity({ account, store }).then(setActivityInfo);
    }, ACTIVITY_REFRESH_RATE);

    return () => {
      window.clearInterval(intervalId);
      firstLoad = true;
    };
  }, [account, store]);

  useEffect(() => {
    if (!activityInfo) {
      return;
    }
    if (
      !firstLoad &&
      prevActivityInfo.current?.currentActivityHash !== activityInfo.currentActivityHash
    ) {
      refresh();
      cooldown = Date.now();
    }
    firstLoad = false;
    prevActivityInfo.current = activityInfo;
  }, [activityInfo]);

  if (!defs) {
    return null;
  }

  const activity = activityInfo && defs.Activity.get(activityInfo.currentActivityHash);
  const activityMode = defs.ActivityMode[activityInfo?.currentActivityModeHash ?? 0];
  const place = activity && defs.Place.get(activity.placeHash);

  const placeName = place?.displayProperties.name; // "Earth" "The Crucible"
  const activityName = activity?.displayProperties.name ?? ''; // "Adventure activity quest name" "Rusted Lands"
  const gameType = activityMode?.displayProperties.name; // "Explore" "Mayhem"

  return (
    <CollapsibleTitle
      title={
        <>
          {(activityMode?.displayProperties.hasIcon && (
            <BungieImage
              className={styles.activityIcon}
              src={activityMode.displayProperties.icon}
            />
          )) ||
            (activity?.displayProperties.hasIcon && (
              <BungieImage className={styles.activityIcon} src={activity.displayProperties.icon} />
            ))}
          {gameType ||
            placeName ||
            (!activityInfo ? t('ActiveMode.Loading') : t('ActiveMode.Offline'))}
        </>
      }
      sectionId={'active-activity'}
      defaultCollapsed={true}
    >
      {activityInfo && (
        <>
          {activityName?.length > 0 && <div className={styles.title}>{activityName}</div>}
          <ActivityInformation defs={defs} store={store} activityInfo={activityInfo} />
          <VendorBounties
            account={account}
            store={store}
            activityInfo={activityInfo}
            buckets={buckets}
            defs={defs}
          />
        </>
      )}
    </CollapsibleTitle>
  );
}

export default connect<StoreProps>(mapStateToProps)(CurrentActivity);
