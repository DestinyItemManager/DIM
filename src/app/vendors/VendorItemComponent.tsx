import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { ItemPopupExtraInfo } from 'app/item-popup/item-popup';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React, { useContext } from 'react';
import BungieImage from '../dim-ui/BungieImage';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import '../progress/milestone.scss';
import { AppIcon, faCheck, lockIcon } from '../shell/icons';
import Cost from './Cost';
import styles from './VendorItem.m.scss';
import { SingleVendorSheetContext } from './single-vendor/SingleVendorSheetContainer';
import { VendorItem } from './vendor-item';

export default function VendorItemComponent({
  item,
  owned,
  characterId,
}: {
  item: VendorItem;
  owned: boolean;
  characterId?: string;
}) {
  const showVendor = useContext(SingleVendorSheetContext);
  if (item.displayTile) {
    return (
      <div className={styles.vendorItem}>
        <a onClick={() => showVendor?.({ characterId, vendorHash: item.previewVendorHash })}>
          <BungieImage
            className={styles.tile}
            title={item.displayProperties.name}
            src={item.displayProperties.icon}
          />
        </a>
        {item.displayProperties.name}
      </div>
    );
  }

  if (!item.item) {
    return null;
  }

  const acquired =
    item.collectibleState !== undefined &&
    !(item.collectibleState & DestinyCollectibleState.NotAcquired);

  // Can't buy more copies of emblems or bounties other than repeatables.
  const ownershipRule =
    item.item?.itemCategoryHashes.includes(ItemCategoryHashes.Emblems) ||
    (item.item?.itemCategoryHashes.includes(ItemCategoryHashes.Bounties) &&
      !item.item.itemCategoryHashes.includes(ItemCategoryHashes.RepeatableBounties));

  const mod = item.item.itemCategoryHashes.includes(ItemCategoryHashes.Mods_Mod);

  const unavailable = !item.canBeSold || (owned && ownershipRule);
  return (
    <VendorItemDisplay
      item={item.item}
      // do not allow dimming from filtering, since the D2 vendors page hides non-matching items entirely
      allowFilter={false}
      unavailable={unavailable}
      owned={owned}
      locked={item.locked}
      acquired={acquired}
      extraData={{ failureStrings: item.failureStrings, characterId, owned, acquired, mod }}
    >
      {item.costs.length > 0 && (
        <div>
          {item.costs.map((cost) => (
            <Cost key={cost.itemHash} cost={cost} className={styles.cost} />
          ))}
        </div>
      )}
    </VendorItemDisplay>
  );
}

export function VendorItemDisplay({
  allowFilter,
  unavailable,
  owned,
  locked,
  acquired,
  item,
  extraData,
  children,
}: {
  allowFilter?: boolean;
  /** i.e. greyed out */
  unavailable?: boolean;
  owned?: boolean;
  locked?: boolean;
  acquired?: boolean;
  item: DimItem;
  extraData?: ItemPopupExtraInfo;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={clsx(styles.vendorItem, {
        [styles.unavailable]: unavailable,
      })}
    >
      <ItemPopupTrigger item={item} extraData={extraData}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            allowFilter={allowFilter ?? true}
            innerRef={ref}
            onClick={onClick}
          />
        )}
      </ItemPopupTrigger>
      {children}
      {owned ? (
        <AppIcon className={styles.ownedIcon} icon={faCheck} title={t('MovePopup.Owned')} />
      ) : acquired ? (
        <AppIcon className={styles.acquiredIcon} icon={faCheck} title={t('MovePopup.Acquired')} />
      ) : (
        locked && (
          <AppIcon
            className={styles.lockedIcon}
            icon={lockIcon}
            title={t('MovePopup.LockUnlock.Locked')}
          />
        )
      )}
    </div>
  );
}
