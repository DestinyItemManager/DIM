import { DestinyAccount } from 'app/accounts/destiny-account';
import ActivityInformation from 'app/active-mode/Views/current-activity/ActivityInformation';
import { Destinations } from 'app/active-mode/Views/current-activity/util';
import VendorBounties from 'app/active-mode/Views/current-activity/VendorBounties';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import { getCurrentActivity } from 'app/bungie-api/destiny2-api';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { RootState } from 'app/store/types';
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
  return profileInfo.characterActivities.data?.[store.id].currentActivityHash;
}

function CurrentActivity({ account, store, defs, buckets }: Props) {
  const [hash, setHash] = useState<number | undefined>();
  useEffect(() => {
    refreshActivity({ account, store }).then(setHash);
  }, [defs, account, store]);

  if (!defs || !hash || hash === Destinations.Orbit) {
    return null;
  }

  const activity = defs.Activity.get(hash);

  if (!activity) {
    return null;
  }

  const place = defs.Place.get(activity.placeHash);
  const placeName = place.displayProperties.name; // "Earth" "The Crucible"
  const activityName = activity.displayProperties.name; // "Adventure activity quest name" "Rusted Lands"
  const activityType = defs.ActivityMode[activity.activityTypeHash];
  const gameType = activityType?.displayProperties.name; // "Explore" (nothing for crucible)
  // Consider showing rewards for current activity?

  return (
    <CollapsibleTitle
      title={
        <>
          <BungieImage className={styles.activityIcon} src={activity.displayProperties.icon} />{' '}
          {gameType || placeName}
        </>
      }
      sectionId={'active-activity'}
      defaultCollapsed={true}
    >
      <div className={styles.title}>{activityName}</div>
      <div className={styles.activityItems}>
        <ActivityInformation defs={defs} store={store} activity={activity} />
        <VendorBounties
          account={account}
          store={store}
          activity={activity}
          buckets={buckets}
          defs={defs}
        />
      </div>
    </CollapsibleTitle>
  );
}

export default connect<StoreProps>(mapStateToProps)(CurrentActivity);
