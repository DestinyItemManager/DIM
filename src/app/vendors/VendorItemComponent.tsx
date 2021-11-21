import { DimItem } from 'app/inventory/item-types';
import { ItemPopupExtraInfo } from 'app/item-popup/item-popup';
import { DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { Link } from 'react-router-dom';
import BungieImage from '../dim-ui/BungieImage';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import '../progress/milestone.scss';
import { AppIcon, faCheck } from '../shell/icons';
import Cost from './Cost';
import { VendorItem } from './vendor-item';
import styles from './VendorItem.m.scss';

export default function VendorItemComponent({
  item,
  owned,
  characterId,
}: {
  item: VendorItem;
  owned: boolean;
  characterId?: string;
}) {
  if (item.displayTile) {
    return (
      <div className={styles.vendorItem}>
        <Link to={`../vendors/${item.previewVendorHash}?characterId=${characterId}`}>
          <BungieImage
            className={styles.tile}
            title={item.displayProperties.name}
            src={item.displayProperties.icon}
          />
        </Link>
        {item.displayProperties.name}
      </div>
    );
  }

  if (!item.item) {
    return null;
  }

  const acquired =
    item.item.collectibleState !== undefined &&
    !(item.item.collectibleState & DestinyCollectibleState.NotAcquired);

  const unavailable =
    !item.canPurchase ||
    !item.canBeSold ||
    (owned &&
      item.item?.itemCategoryHashes.includes(ItemCategoryHashes.Bounties) &&
      !item.item.itemCategoryHashes.includes(ItemCategoryHashes.RepeatableBounties));
  return (
    <VendorItemDisplay
      item={item.item}
      unavailable={unavailable}
      owned={owned}
      acquired={acquired}
      extraData={{ failureStrings: item.failureStrings, owned, acquired }}
    >
      {item.costs.length > 0 && (
        <div className={styles.vendorCosts}>
          {item.costs.map((cost) => (
            <Cost key={cost.itemHash} cost={cost} className={styles.cost} />
          ))}
        </div>
      )}
    </VendorItemDisplay>
  );
}

export function VendorItemDisplay({
  unavailable,
  owned,
  acquired,
  item,
  extraData,
  children,
}: {
  unavailable?: boolean;
  owned?: boolean;
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
      {owned ? (
        <AppIcon className={styles.ownedIcon} icon={faCheck} />
      ) : (
        acquired && <AppIcon className={styles.acquiredIcon} icon={faCheck} />
      )}
      <ItemPopupTrigger item={item} extraData={extraData}>
        {(ref, onClick) => (
          <ConnectedInventoryItem item={item} allowFilter={true} innerRef={ref} onClick={onClick} />
        )}
      </ItemPopupTrigger>
      {children}
    </div>
  );
}
