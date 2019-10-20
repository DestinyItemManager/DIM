import React from 'react';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { makeItem } from '../inventory/store/d2-item-factory';
import {
  ItemBindStatus,
  ItemLocation,
  TransferStatuses,
  ItemState,
  DestinyInventoryItemDefinition
} from 'bungie-api-ts/destiny2';
import './Collectible.scss';
import { bungieNetPath } from 'app/dim-ui/BungieImage';

import clsx from 'clsx';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import '../progress/milestone.scss';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { AppIcon } from '../shell/icons';
import styles from '../vendors/VendorItem.m.scss';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';

interface Props {
  inventoryItem: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  ownedItemHashes?: Set<number>;
  owned: boolean;
  onAnItem: boolean;
}

export default function ModCollectible({ inventoryItem, defs, buckets, owned, onAnItem }: Props) {
  if (!inventoryItem) {
    return null;
  }

  const item = makeItem(
    defs,
    buckets,
    new Set(),
    new Set(),
    undefined,
    undefined,
    {
      itemHash: inventoryItem.hash,
      itemInstanceId: inventoryItem.hash.toString(),
      quantity: 1,
      bindStatus: ItemBindStatus.NotBound,
      location: ItemLocation.Vendor,
      bucketHash: 0,
      transferStatus: TransferStatuses.NotTransferrable,
      lockable: false,
      state: ItemState.None,
      isWrapper: false,
      tooltipNotificationIndexes: []
    },
    undefined,
    undefined // reviewData
  );

  if (!item) {
    return null;
  }

  item.missingSockets = false;

  const modDef = defs.InventoryItem.get(item.hash);
  const isY3 = modDef.itemCategoryHashes.includes(610365472) || modDef.plug.energyCost;

  // for y3 mods, hide the icon for being equipped on an item
  // all weapon mods (ItemCategory [610365472] Weapon Mods) are now y3 mods
  if (isY3) {
    onAnItem = false;
  }
  const costElementIcon =
    modDef.plug.energyCost &&
    modDef.plug.energyCost.energyTypeHash &&
    defs.Stat.get(defs.EnergyType.get(modDef.plug.energyCost.energyTypeHash).costStatHash)
      .displayProperties.icon;

  const equippedIcon = item.itemCategoryHashes.includes(4104513227) ? ( // ItemCategory "Armor Mods"
    <img src={helmetIcon} className={styles.attachedIcon} />
  ) : item.itemCategoryHashes.includes(610365472) ? ( // ItemCategory "Weapon Mods"
    <img src={handCannonIcon} className={styles.attachedWeaponIcon} />
  ) : (
    <AppIcon className={styles.acquiredIcon} icon={faCheck} />
  );
  return (
    <div
      className={clsx(styles.vendorItem, {
        [styles.unavailable]: !owned
      })}
    >
      {!isY3 && onAnItem && equippedIcon}
      <ItemPopupTrigger item={item} extraData={{ acquired: onAnItem, owned, mod: true }}>
        {(ref, onClick) => (
          <ConnectedInventoryItem item={item} allowFilter={true} innerRef={ref} onClick={onClick} />
        )}
      </ItemPopupTrigger>
      {costElementIcon && (
        <>
          <div
            style={{ backgroundImage: `url(${bungieNetPath(costElementIcon)}` }}
            className="energyCostOverlay"
          />
          <div className="energyCost">{modDef.plug.energyCost.energyCost}</div>
        </>
      )}
    </div>
  );
}
