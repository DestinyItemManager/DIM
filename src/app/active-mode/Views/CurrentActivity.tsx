import { DestinyAccount } from 'app/accounts/destiny-account';
import ActivityInformation from 'app/active-mode/Views/current-activity/ActivityInformation';
import VendorBounties from 'app/active-mode/Views/current-activity/VendorBounties';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import { getCurrentActivity } from 'app/bungie-api/destiny2-api';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { RootState } from 'app/store/types';
import { DestinyCharacterActivitiesComponent } from 'bungie-api-ts/destiny2';
import React, { useEffect, useState } from 'react';
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

async function refreshActivity({ account, store }: { account: DestinyAccount; store: DimStore }) {
  const profileInfo = await getCurrentActivity(account);
  return profileInfo.characterActivities.data?.[store.id]; //
}

function CurrentActivity({ account, store, defs, buckets }: Props) {
  const [activityInfo, setActivityInfo] = useState<
    DestinyCharacterActivitiesComponent | undefined
  >();
  useEffect(() => {
    refreshActivity({ account, store }).then(setActivityInfo);
  }, [defs, account, store]);

  if (!defs || !activityInfo) {
    return null;
  }

  const activity = defs.Activity.get(activityInfo.currentActivityHash);
  const activityMode = defs.ActivityMode[activityInfo.currentActivityModeHash];
  const place = defs.Place.get(activity.placeHash);

  const placeName = place.displayProperties.name; // "Earth" "The Crucible"
  const activityName = activity.displayProperties.name; // "Adventure activity quest name" "Rusted Lands"
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
            (activity.displayProperties.hasIcon && (
              <BungieImage className={styles.activityIcon} src={activity.displayProperties.icon} />
            ))}
          {gameType || placeName}
        </>
      }
      sectionId={'active-activity'}
      defaultCollapsed={true}
    >
      {activityName.length > 0 && <div className={styles.title}>{activityName}</div>}
      <div className={styles.activityItems}>
        <ActivityInformation defs={defs} store={store} activityInfo={activityInfo} />
        <VendorBounties
          account={account}
          store={store}
          activityInfo={activityInfo}
          buckets={buckets}
          defs={defs}
        />
      </div>
    </CollapsibleTitle>
  );
}

export default connect<StoreProps>(mapStateToProps)(CurrentActivity);
