import { VendorItem } from './vendor-item';
import React from 'react';
import BungieImage from '../dim-ui/BungieImage';
import clsx from 'clsx';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DestinyItemQuantity, DestinyCollectibleState } from 'bungie-api-ts/destiny2';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';
import '../progress/milestone.scss';
import { AppIcon, faCheck } from '../shell/icons';
import styles from './VendorItem.m.scss';
import { DimItem } from 'app/inventory/item-types';
import { ItemPopupExtraInfo } from 'app/item-popup/item-popup';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';
import { Link } from 'react-router-dom';
import { ItemCategoryHashes } from 'data/d2/generated-enums';

export default function VendorItemComponent({
  item,
  defs,
  owned,
  characterId,
}: {
  defs: D2ManifestDefinitions;
  item: VendorItem;
  owned: boolean;
  characterId?: string;
}) {
  if (item.displayTile) {
    return (
      <div className={styles.vendorItem}>
        <Link to={`vendors/${item.previewVendorHash}?characterId=${characterId}`}>
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

  const itemDef = defs.InventoryItem.get(item.item.hash);

  const collectible =
    itemDef.collectibleHash !== undefined
      ? defs.Collectible.get(itemDef.collectibleHash)
      : undefined;

  const acquired =
    item.item.isDestiny2() &&
    item.item.collectibleState !== null &&
    !(item.item.collectibleState & DestinyCollectibleState.NotAcquired);

  return (
    <VendorItemDisplay
      item={item.item}
      unavailable={!item.canPurchase || !item.canBeSold}
      owned={owned}
      acquired={acquired}
      extraData={{ failureStrings: item.failureStrings, collectible, owned, acquired }}
    >
      {item.costs.length > 0 && (
        <div className={styles.vendorCosts}>
          {item.costs.map((cost) => (
            <VendorItemCost key={cost.itemHash} defs={defs} cost={cost} />
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
  const acquiredIcon = item.itemCategoryHashes.includes(ItemCategoryHashes.ArmorMods) ? (
    <img src={helmetIcon} className={styles.attachedIcon} />
  ) : item.itemCategoryHashes.includes(ItemCategoryHashes.WeaponMods) ? (
    <img src={handCannonIcon} className={styles.attachedWeaponIcon} />
  ) : (
    <AppIcon className={styles.acquiredIcon} icon={faCheck} />
  );

  return (
    <div
      className={clsx(styles.vendorItem, {
        [styles.unavailable]: unavailable,
      })}
    >
      {owned ? <AppIcon className={styles.ownedIcon} icon={faCheck} /> : acquired && acquiredIcon}
      <ItemPopupTrigger item={item} extraData={extraData}>
        {(ref, onClick) => (
          <ConnectedInventoryItem item={item} allowFilter={true} innerRef={ref} onClick={onClick} />
        )}
      </ItemPopupTrigger>
      {children}
    </div>
  );
}

function VendorItemCost({
  cost,
  defs,
}: {
  defs: D2ManifestDefinitions;
  cost: DestinyItemQuantity;
}) {
  const currencyItem = defs.InventoryItem.get(cost.itemHash);
  return (
    <div className={styles.cost}>
      {cost.quantity}
      <span className={styles.currency}>
        <BungieImage
          src={currencyItem.displayProperties.icon}
          title={currencyItem.displayProperties.name}
        />
      </span>
    </div>
  );
}
