import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage, { bungieBackgroundStyle, bungieNetPath } from 'app/dim-ui/BungieImage';
import {
  DestinyEnergyTypeDefinition,
  DestinyInventoryItemDefinition,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import { DimItem } from './item-types';
import styles from './ItemIcon.m.scss';

const itemTierStyles = {
  Legendary: styles.legendary,
  Exotic: styles.exotic,
  Common: styles.basic,
  Rare: styles.rare,
  Uncommon: styles.common,
};

/**
 * This is just the icon part of the inventory tile - without the bottom stats bar, tag icons, etc.
 * This exists because we have to do a fair bit of work to make the icon look like it does in game
 * with respect to masterwork, season icons, mod overlays, etc.
 *
 * This renders just a fragment - it always needs to be rendered inside another div with class "item".
 */
export default function ItemIcon({ item, className }: { item: DimItem; className?: string }) {
  const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;
  const borderless =
    (item?.destinyVersion === 2 &&
      (item.bucket.hash === BucketHashes.Subclass ||
        item.itemCategoryHashes.includes(ItemCategoryHashes.Packages))) ||
    item.isEngram;
  const itemImageStyles = clsx('item-img', className, {
    [styles.complete]: item.complete || isCapped,
    [styles.borderless]: borderless,
    [styles.masterwork]: item.masterwork,
    [itemTierStyles[item.tier]]: !borderless && !item.plug,
  });

  return (
    <>
      <BungieImage src={item.icon} className={itemImageStyles} alt="" />
      {item.masterwork && (
        <div
          className={clsx(styles.masterworkOverlay, { [styles.exoticMasterwork]: item.isExotic })}
        />
      )}
      {item.iconOverlay && (
        <div className={styles.iconOverlay}>
          <BungieImage src={item.iconOverlay} />
        </div>
      )}
      {item.plug?.costElementIcon && (
        <>
          <div
            style={bungieBackgroundStyle(item.plug.costElementIcon)}
            className={styles.energyCostOverlay}
          />
          <svg viewBox="0 0 100 100" className={styles.energyCost}>
            <svg x="100%" y="0" width="100" height="100" overflow="visible">
              <text x="-13" y="26" fontSize="18px" textAnchor="end">
                {item.plug.energyCost}
              </text>
            </svg>
          </svg>
        </>
      )}
    </>
  );
}

/**
 * A variant of ItemIcon that operates directly on an item definition.
 */
export function DefItemIcon({
  itemDef,
  defs,
  className,
  borderless,
}: {
  itemDef: DestinyInventoryItemDefinition;
  defs?: D2ManifestDefinitions;
  className?: string;
  borderless?: boolean;
}) {
  const itemCategoryHashes = itemDef.itemCategoryHashes || [];
  borderless ||=
    itemCategoryHashes.includes(ItemCategoryHashes.Packages) ||
    itemCategoryHashes.includes(ItemCategoryHashes.Engrams);
  const itemImageStyles = clsx(
    'item-img',
    className,
    {
      [styles.borderless]: borderless,
    },
    !borderless &&
      !itemDef.plug &&
      itemDef.inventory && [itemTierStyles[itemDef.inventory.tierType]]
  );
  const modInfo = defs && getModCostInfo(itemDef, defs);

  const iconOverlay = itemDef.iconWatermark || itemDef.iconWatermarkShelved || undefined;

  return (
    <>
      <BungieImage src={itemDef.displayProperties.icon} className={itemImageStyles} alt="" />
      {iconOverlay && (
        <div className={styles.iconOverlay}>
          <BungieImage src={iconOverlay} />
        </div>
      )}
      {modInfo?.energyCostElementOverlay && (
        <>
          <div
            style={{ backgroundImage: `url("${bungieNetPath(modInfo.energyCostElementOverlay)}")` }}
            className={styles.energyCostOverlay}
          />
          <svg viewBox="0 0 100 100" className={styles.energyCost}>
            <svg x="100%" y="0" width="0" height="0" overflow="visible">
              <text x="-13" y="26" fontSize="18px" textAnchor="end">
                {modInfo.energyCost}
              </text>
            </svg>
          </svg>
        </>
      )}
    </>
  );
}

/**
 * given a mod definition or hash, returns destructurable energy cost information
 */
export function getModCostInfo(
  mod: DestinyInventoryItemDefinition | number,
  defs: D2ManifestDefinitions
) {
  const modCostInfo: {
    energyCost?: number;
    energyCostElement?: DestinyEnergyTypeDefinition;
    energyCostElementOverlay?: string;
  } = {};

  if (typeof mod === 'number') {
    mod = defs.InventoryItem.get(mod);
  }

  if (mod?.plug) {
    modCostInfo.energyCost = mod.plug.energyCost?.energyCost;

    if (mod.plug.energyCost?.energyTypeHash) {
      modCostInfo.energyCostElement = defs.EnergyType.get(mod.plug.energyCost.energyTypeHash);
    }
    if (modCostInfo.energyCostElement?.costStatHash) {
      modCostInfo.energyCostElementOverlay = defs.Stat.get(
        modCostInfo.energyCostElement.costStatHash
      )?.displayProperties.icon;
    }
  }
  return modCostInfo;
}
