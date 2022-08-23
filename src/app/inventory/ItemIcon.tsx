import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import BungieImage, { bungieBackgroundStyle, bungieNetPath } from 'app/dim-ui/BungieImage';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { useD2Definitions } from 'app/manifest/selectors';
import { d2MissingIcon } from 'app/search/d2-known-values';
import { errorLog } from 'app/utils/log';
import { isModCostVisible } from 'app/utils/socket-utils';
import {
  DestinyEnergyTypeDefinition,
  DestinyInventoryItemDefinition,
  DestinyRecordState,
} from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import pursuitComplete from 'images/highlightedObjective.svg';
import { DimItem } from './item-types';
import styles from './ItemIcon.m.scss';

// These solar abilities have stasis-colored icons in their Bungie-provided definitions.
// To make them match the orange solar color (best we can) we apply a css filter.
const solarSubclassDefsToColorFilter = [
  2979486802, // InventoryItem "Empowering Rift"
  2979486803, // InventoryItem "Healing Rift"
  3686638443, // InventoryItem "Strafe Glide"
  3686638442, // InventoryItem "Burst Glide"
  3686638441, // InventoryItem "Balanced Glide"
  2495523340, // InventoryItem "Towering Barricade"
  2495523341, // InventoryItem "Rally Barricade"
  2225231092, // InventoryItem "High Lift"
  2225231093, // InventoryItem "Strafe Lift"
  2225231094, // InventoryItem "Catapult Lift"
  3636300854, // InventoryItem "Marksman's Dodge"
  3636300855, // InventoryItem "Gambler's Dodge"
  1128768654, // InventoryItem "High Jump"
  1128768655, // InventoryItem "Strafe Jump"
  1128768652, // InventoryItem "Triple Jump"
];

// And again for Arc
const arcSubclassDefsToColorFilter = [
  25156515, // InventoryItem "Healing Rift"
  25156514, // InventoryItem "Empowering Rift"
  4154539169, // InventoryItem "Strafe Glide"
  4154539168, // InventoryItem "Burst Glide"
  4154539171, // InventoryItem "Balanced Glide"
  426473316, // InventoryItem "Marksman's Dodge"
  426473317, // InventoryItem "Gambler's Dodge"
  95544328, // InventoryItem "Triple Jump"
  95544331, // InventoryItem "Strafe Jump"
  95544330, // InventoryItem "High Jump"
  489583096, // InventoryItem "Towering Barricade"
  489583097, // InventoryItem "Rally Barricade"
  1698387814, // InventoryItem "High Lift"
  1698387815, // InventoryItem "Strafe Lift"
  1698387812, // InventoryItem "Catapult Lift"
  2708585277, // InventoryItem "Seismic Strike"
  2708585276, // InventoryItem "Ballistic Slam"
  2708585279, // InventoryItem "Thunderclap"
];

const itemTierStyles = {
  Legendary: styles.legendary,
  Exotic: styles.exotic,
  Common: styles.basic,
  Rare: styles.rare,
  Uncommon: styles.common,
};

export function getItemImageStyles(item: DimItem, className?: string) {
  const isCapped = item.maxStackSize > 1 && item.amount === item.maxStackSize && item.uniqueStack;
  const borderless =
    (item?.destinyVersion === 2 &&
      (item.bucket.hash === BucketHashes.Subclass ||
        item.itemCategoryHashes.includes(ItemCategoryHashes.Packages))) ||
    item.isEngram;
  const useClassifiedPlaceholder = item.icon === d2MissingIcon && item.classified;
  const itemImageStyles = clsx('item-img', className, {
    [styles.complete]: item.complete || isCapped,
    [styles.borderless]: borderless,
    [styles.masterwork]: item.masterwork,
    [styles.deepsight]: item.deepsightInfo,
    [styles.bucketIcon]: useClassifiedPlaceholder,
    [itemTierStyles[item.tier]]: !borderless && !item.plug,
  });
  return itemImageStyles;
}

/**
 * This is just the icon part of the inventory tile - without the bottom stats bar, tag icons, etc.
 * This exists because we have to do a fair bit of work to make the icon look like it does in game
 * with respect to masterwork, season icons, mod overlays, etc.
 *
 * This renders just a fragment - it always needs to be rendered inside another div with class "item".
 */
export default function ItemIcon({ item, className }: { item: DimItem; className?: string }) {
  const useClassifiedPlaceholder = item.icon === d2MissingIcon && item.classified;
  const itemImageStyles = getItemImageStyles(item, className);

  return (
    <>
      {useClassifiedPlaceholder ? (
        <BucketIcon item={item} className={itemImageStyles} />
      ) : (
        <div style={bungieBackgroundStyle(item.icon)} className={itemImageStyles} />
      )}
      {item.iconOverlay && (
        <div className={styles.iconOverlay} style={bungieBackgroundStyle(item.iconOverlay)} />
      )}
      {(item.masterwork || item.deepsightInfo) && (
        <div
          className={clsx(styles.backgroundOverlay, {
            [styles.legendaryMasterwork]: item.masterwork && !item.isExotic,
            [styles.exoticMasterwork]: item.masterwork && item.isExotic,
            [styles.deepsightBorder]: item.deepsightInfo,
          })}
        />
      )}
      {item.plug?.costElementIcon && (
        <>
          <div
            style={bungieBackgroundStyle(item.plug.costElementIcon)}
            className={styles.energyCostOverlay}
          />
          <svg viewBox="0 0 100 100" className={styles.energyCost}>
            <text x="87" y="26" fontSize="18px" textAnchor="end">
              {item.plug.energyCost}
            </text>
          </svg>
        </>
      )}
      {item.highlightedObjective &&
        (!item.deepsightInfo || item.deepsightInfo.attunementObjective.complete) && (
          <img className={styles.highlightedObjective} src={pursuitComplete} />
        )}
      {Boolean(
        item.deepsightInfo &&
          !item.deepsightInfo.attunementObjective.complete &&
          item.patternUnlockRecord &&
          item.patternUnlockRecord.state & DestinyRecordState.ObjectiveNotCompleted
      ) && <div className={styles.deepsightPattern} />}
    </>
  );
}

/**
 * A variant of ItemIcon that operates directly on an item definition.
 */
export function DefItemIcon({
  itemDef,
  className,
  borderless,
}: {
  itemDef: DestinyInventoryItemDefinition;
  className?: string;
  borderless?: boolean;
}) {
  const defs = useD2Definitions();
  if (!itemDef) {
    errorLog('temp-deficon', new Error('DefItemIcon was called with a missing def'));
    return null;
  }
  const itemCategoryHashes = itemDef.itemCategoryHashes || [];
  borderless ||=
    itemCategoryHashes.includes(ItemCategoryHashes.Packages) ||
    itemCategoryHashes.includes(ItemCategoryHashes.Engrams);
  const solarFix = solarSubclassDefsToColorFilter.includes(itemDef.hash);
  const arcFix = arcSubclassDefsToColorFilter.includes(itemDef.hash);
  const itemImageStyles = clsx(
    'item-img',
    className,
    {
      [styles.borderless]: borderless,
      [styles.solarColorFilter]: solarFix,
      [styles.arcColorFilter]: arcFix,
      [styles.transparencyFix]: arcFix || solarFix,
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
      {iconOverlay && <BungieImage src={iconOverlay} className={styles.iconOverlay} alt="" />}
      {modInfo?.energyCostElementOverlay && (
        <>
          <div
            style={{ backgroundImage: `url("${bungieNetPath(modInfo.energyCostElementOverlay)}")` }}
            className={styles.energyCostOverlay}
          />
          <svg viewBox="0 0 100 100" className={styles.energyCost}>
            <text x="87" y="26" fontSize="18px" textAnchor="end">
              {modInfo.energyCost}
            </text>
          </svg>
        </>
      )}
    </>
  );
}

/**
 * given a mod definition or hash, returns destructurable energy cost information
 */
function getModCostInfo(mod: DestinyInventoryItemDefinition | number, defs: D2ManifestDefinitions) {
  const modCostInfo: {
    energyCost?: number;
    energyCostElement?: DestinyEnergyTypeDefinition;
    energyCostElementOverlay?: string;
  } = {};

  if (typeof mod === 'number') {
    mod = defs.InventoryItem.get(mod);
  }

  if (mod?.plug && isModCostVisible(defs, mod.plug)) {
    modCostInfo.energyCost = mod.plug.energyCost.energyCost;

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
