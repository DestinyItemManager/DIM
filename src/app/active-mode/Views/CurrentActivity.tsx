import { DestinyAccount } from 'app/accounts/destiny-account';
import { useActivityInfo } from 'app/active-mode/Views/activity-util';
import ActivityInformation from 'app/active-mode/Views/current-activity/ActivityInformation';
import VendorBounties from 'app/active-mode/Views/current-activity/VendorBounties';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { RootState } from 'app/store/types';
import React from 'react';
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
    defs: d2ManifestSelector(state),
  };
}

type Props = ProvidedProps & StoreProps;

function CurrentActivity({ account, store, defs, buckets }: Props) {
  const activityInfo = useActivityInfo({ account, store });

  if (!defs) {
    return null;
  }

  const activity =
    (activityInfo?.currentActivityHash && defs.Activity.get(activityInfo.currentActivityHash)) ||
    undefined;
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
