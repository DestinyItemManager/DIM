import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { getBucketSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import { d2MissingIcon, ItemRarityMap, ItemRarityName } from 'app/search/d2-known-values';
import { braveShiny, riteShiny } from 'app/utils/item-utils';
import { errorLog } from 'app/utils/log';
import { isModCostVisible } from 'app/utils/socket-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import pursuitComplete from 'images/pursuitComplete.svg';
import { DimItem } from './item-types';
import styles from './ItemIcon.m.scss';
import { isPluggableItem } from './store/sockets';

const itemTierStyles: Record<ItemRarityName, string> = {
  Legendary: styles.legendary,
  Exotic: styles.exotic,
  Common: styles.basic,
  Rare: styles.rare,
  Uncommon: styles.common,
  Unknown: styles.common,
  Currency: styles.common,
};

const strandWrongColorPlugCategoryHashes = [
  PlugCategoryHashes.TitanStrandClassAbilities,
  PlugCategoryHashes.HunterStrandClassAbilities,
  PlugCategoryHashes.WarlockStrandClassAbilities,
  PlugCategoryHashes.TitanStrandMovement,
  PlugCategoryHashes.HunterStrandMovement,
  PlugCategoryHashes.WarlockStrandMovement,
];

export function getItemImageStyles(item: DimItem, className?: string) {
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
    [styles.deepsight]: item.deepsightInfo,
    [itemTierStyles[item.rarity]]: !borderless && !item.plug,
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
  const classifiedPlaceholder =
    item.icon === d2MissingIcon && item.classified && getBucketSvgIcon(item.bucket.hash);
  const itemImageStyles = getItemImageStyles(item, className);
  const itemIsShiny = braveShiny(item) || riteShiny(item);
  return (
    <>
      {classifiedPlaceholder ? (
        <BucketIcon
          icon={classifiedPlaceholder}
          className={clsx(itemImageStyles, {
            [styles.inverted]: !classifiedPlaceholder.colorized,
          })}
        />
      ) : (
        <div style={bungieBackgroundStyle(item.icon)} className={itemImageStyles} />
      )}
      {item.iconOverlay && (
        <div className={styles.iconOverlay} style={bungieBackgroundStyle(item.iconOverlay)} />
      )}
      {(itemIsShiny || item.masterwork || item.deepsightInfo) && (
        <div
          className={clsx(styles.backgroundOverlay, {
            [styles.legendaryMasterwork]: item.masterwork && !item.isExotic && !itemIsShiny,
            [styles.shinyMasterwork]: itemIsShiny,
            [styles.exoticMasterwork]: item.masterwork && item.isExotic,
            [styles.deepsightBorder]: item.deepsightInfo,
          })}
        />
      )}
      {item.tier > 1 ? (
        <div className={styles.tierPipContainer}>
          {Array(item.tier)
            .fill(0)
            .map((_, i) => (
              <div key={i} className={styles.tierPip} />
            ))}
        </div>
      ) : null}
      {item.plug?.energyCost !== undefined && item.plug.energyCost > 0 && (
        <>
          <div className={styles.energyCostOverlay} />
          <svg viewBox="0 0 100 100" className={styles.energyCost}>
            <text x="87" y="26" fontSize="18px" textAnchor="end">
              {item.plug.energyCost}
            </text>
          </svg>
        </>
      )}
      {item.highlightedObjective && !item.deepsightInfo && (
        <img className={styles.highlightedObjective} src={pursuitComplete} />
      )}
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
  if (!itemDef) {
    errorLog('temp-deficon', new Error('DefItemIcon was called with a missing def'));
    return null;
  }
  const itemCategoryHashes = itemDef.itemCategoryHashes || [];
  borderless ||=
    itemDef.plug?.plugCategoryHash === PlugCategoryHashes.Intrinsics ||
    itemDef.plug?.plugCategoryHash === PlugCategoryHashes.ArmorArchetypes ||
    itemCategoryHashes.includes(ItemCategoryHashes.Packages) ||
    itemCategoryHashes.includes(ItemCategoryHashes.Engrams);

  const needsStrandColorFix =
    itemDef.plug && strandWrongColorPlugCategoryHashes.includes(itemDef.plug.plugCategoryHash);

  const itemImageStyles = clsx(
    'item-img',
    className,
    {
      [styles.borderless]: borderless,
      [styles.strandColorFix]: needsStrandColorFix,
    },
    !borderless &&
      !itemDef.plug &&
      itemDef.inventory && [itemTierStyles[ItemRarityMap[itemDef.inventory.tierType]]],
  );
  const energyCost = getModCostInfo(itemDef);

  const iconOverlay = itemDef.iconWatermark || itemDef.iconWatermarkShelved || undefined;

  return (
    <>
      <BungieImage src={itemDef.displayProperties.icon} className={itemImageStyles} alt="" />
      {iconOverlay && <BungieImage src={iconOverlay} className={styles.iconOverlay} alt="" />}
      {energyCost !== undefined && energyCost > 0 && (
        <>
          <div className={styles.energyCostOverlay} />
          <svg viewBox="0 0 100 100" className={styles.energyCost}>
            <text x="87" y="26" fontSize="18px" textAnchor="end">
              {energyCost}
            </text>
          </svg>
        </>
      )}
    </>
  );
}

/**
 * given a mod definition or hash, returns its energy cost if it should be shown
 */
function getModCostInfo(mod: DestinyInventoryItemDefinition) {
  if (isPluggableItem(mod) && isModCostVisible(mod)) {
    return mod.plug.energyCost!.energyCost;
  }

  return undefined;
}
