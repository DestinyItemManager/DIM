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
import { D2Item } from 'app/inventory/item-types';

interface ModCollectibleProps {
  inventoryItem: DestinyInventoryItemDefinition;
  defs: D2ManifestDefinitions;
  buckets: InventoryBuckets;
  owned: boolean;
  onAnItem: boolean;
}
interface ModProps {
  item: D2Item;
  defs: D2ManifestDefinitions;
  children?: React.ReactNode;
  allowFilter?: boolean;
  innerRef?;
  onClick?;
}

export function ModCollectible({
  inventoryItem,
  defs,
  buckets,
  owned,
  onAnItem
}: ModCollectibleProps) {
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
  const modDef = defs.InventoryItem.get(inventoryItem.hash);
  if (!item || !modDef) {
    return null;
  }
  item.missingSockets = false;

  const isY3 = modDef.itemCategoryHashes.includes(610365472) || modDef.plug.energyCost;

  const collectible =
    (item.isDestiny2() && item.collectibleHash && defs.Collectible.get(item.collectibleHash)) ||
    undefined;
  // for y3 mods, hide the icon for being equipped on an item
  // all weapon mods (ItemCategory [610365472] Weapon Mods) are now y3 mods
  if (isY3) {
    onAnItem = false;
  }

  const equippedIcon = modDef.itemCategoryHashes.includes(4104513227) ? ( // ItemCategory "Armor Mods"
    <img src={helmetIcon} className={styles.attachedIcon} />
  ) : modDef.itemCategoryHashes.includes(610365472) ? ( // ItemCategory "Weapon Mods"
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
      <ItemPopupTrigger
        item={item}
        extraData={{ acquired: onAnItem, owned, mod: true, collectible }}
      >
        {(ref, onClick) => (
          <Mod defs={defs} item={item} allowFilter={true} innerRef={ref} onClick={onClick}>
            {!isY3 && onAnItem && equippedIcon}
          </Mod>
        )}
      </ItemPopupTrigger>
    </div>
  );
}

/** displays a mod image + its energy cost amount & element */
export default function Mod({ item, defs, allowFilter, innerRef, onClick, children }: ModProps) {
  if (!item) {
    return null;
  }

  const modDef = defs.InventoryItem.get(item.hash);
  const energyType = defs.EnergyType.get(modDef?.plug.energyCost?.energyTypeHash);
  const energyCostStat = defs.Stat.get(energyType?.costStatHash);
  const costElementIcon = energyCostStat?.displayProperties.icon;

  return (
    <div>
      <ConnectedInventoryItem
        item={item}
        allowFilter={allowFilter}
        innerRef={innerRef}
        onClick={onClick}
      />
      {children}
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
