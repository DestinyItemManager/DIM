import { DestinyAccount } from 'app/accounts/destiny-account';
import { useActivityInfo } from 'app/active-mode/Views/activity-util';
import ActivityInformation from 'app/active-mode/Views/current-activity/ActivityInformation';
import VendorBounties from 'app/active-mode/Views/current-activity/VendorBounties';
import styles from 'app/active-mode/Views/CurrentActivity.m.scss';
import BungieImage from 'app/dim-ui/BungieImage';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { useD2Definitions } from 'app/manifest/selectors';
import React from 'react';

export default function CurrentActivity({
  account,
  store,
}: {
  account: DestinyAccount;
  store: DimStore;
}) {
  const activityInfo = useActivityInfo({ account, store });
  const defs = useD2Definitions();
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
          <ActivityInformation store={store} activityInfo={activityInfo} />
          <VendorBounties store={store} activityInfo={activityInfo} />
        </>
      )}
    </CollapsibleTitle>
  );
}
