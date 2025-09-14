import { itemConstants } from 'app/destiny2/d2-definitions';
import BungieImage, { bungieBackgroundStyle, bungieBackgroundStyles } from 'app/dim-ui/BungieImage';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import { getBucketSvgIcon } from 'app/dim-ui/svgs/itemCategory';
import { d2MissingIcon, ItemRarityMap, ItemRarityName } from 'app/search/d2-known-values';
import { compact } from 'app/utils/collections';
import { errorLog } from 'app/utils/log';
import { isArmorArchetypePlug, isModCostVisible } from 'app/utils/socket-utils';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import {
  BucketHashes,
  ItemCategoryHashes,
  PlugCategoryHashes,
  TraitHashes,
} from 'data/d2/generated-enums';
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
    [itemTierStyles[item.rarity]]: !borderless,
  });
  return itemImageStyles;
}

/**
 * This is just the icon part of the inventory tile - without the bottom stats bar, tag icons, etc.
 * This exists because we have to do a fair bit of work to make the icon look like it does in game
 * with respect to masterwork, season icons, mod overlays, etc.
 *
 * This renders just a fragment - it always needs to be rendered inside another div with class "item".
 *
 * Since this is used a *lot*, it should not use any hooks, subscriptions, etc.
 */
export default function ItemIcon({ item, className }: { item: DimItem; className?: string }) {
  const classifiedPlaceholder =
    item.icon === d2MissingIcon && item.classified && getBucketSvgIcon(item.bucket.hash);
  const itemImageStyles = getItemImageStyles(item, className);
  if (!itemConstants) {
    return null; // this won't happen, it just lets us avoid a bunch of ! in the rest of the code
  }

  // Sadly we can't just layer all the backgrounds into a single div because:
  // 1) Some of them need to be offset a bit because we display the whole image
  //    while in-game they display a border over the icon.
  // 2) Some of the backgrounds like the masterwork glow and season stripe need
  //    to be lower opacity to match the in-game look.
  // 3) We want to show the animated holofoil effect only on hover (and even
  //    then only if the user allows animation).
  // Keep in mind that CSS multiple backgrounds go from front to back, so that's
  // how these arrays are.

  const backgrounds = compact([
    // Holofoil background (two types for some reason, BRAVE weapons have one with stripes)
    item.holofoil
      ? item.traitHashes?.includes(TraitHashes.ReleasesV730Season)
        ? itemConstants.holofoilBackgroundOverlayPath
        : itemConstants.holofoil900BackgroundOverlayPath
      : undefined,
    item.iconDef?.specialBackground, // I don't think any icon defines this
    // So far this is only a solid color, which we already handle. Can
    // uncomment if it ever becomes interesting.
    // item.iconDef?.background,
  ]);

  if (backgrounds[0] === itemConstants.holofoilBackgroundOverlayPath) {
    console.warn('Using deprecated holofoil background overlay', item);
  }

  // The ornament knot background
  const ornamentBackground =
    item.ornamentIconDef && itemConstants.universalOrnamentBackgroundOverlayPath;

  const animatedBackground =
    item.holofoil && !item.traitHashes?.includes(TraitHashes.ReleasesV730Season)
      ? itemConstants.holofoil900AnimatedBackgroundOverlayPath
      : undefined;

  // The actual item icon. Use the ornamented version where available.
  const foreground = (item.ornamentIconDef ?? item.iconDef)?.foreground;

  // This needs to be shown at half opacity to match the in-game look
  const masterworkGlow = item.masterwork && itemConstants.masterworkOverlayPath;

  //  Backdrop for season/featured icon is also shown at much lower opacity in game than the images Bungie
  // gave us. These are aligned with the border, not the image.
  const halfOpacitySeasonOverlay =
    item.iconDef?.secondaryBackground && itemConstants.watermarkDropShadowPath;

  const craftedOverlays = compact([
    // The crafted/enhanced icon
    item.crafted === 'crafted'
      ? itemConstants.craftedOverlayPath
      : item.crafted === 'enhanced'
        ? itemConstants.enhancedItemOverlayPath
        : undefined,
    // Crafted item background
    item.crafted ? itemConstants.craftedBackgroundPath : undefined,
  ]);
  // These are aligned with the border, not the image
  const fullOpacitySeasonOverlays = compact([
    // Featured flags
    item.featured ? itemConstants.featuredItemFlagPath : undefined,
    // Tier pips
    item.tier > 0 && itemConstants.gearTierOverlayImagePaths[item.tier - 1],
  ]);

  const seasonIcon = item.iconDef?.secondaryBackground;

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
        <div style={bungieBackgroundStyles(backgrounds)} className={itemImageStyles}>
          {animatedBackground && (
            <div
              style={bungieBackgroundStyle(animatedBackground)}
              className={styles.animatedBackground}
            />
          )}
          {ornamentBackground && (
            <div
              style={bungieBackgroundStyle(ornamentBackground)}
              className={styles.adjustOpacity}
            />
          )}
          {foreground && <div style={bungieBackgroundStyle(foreground)} />}
          {masterworkGlow && (
            <div style={bungieBackgroundStyle(masterworkGlow)} className={styles.adjustOpacity} />
          )}
          {halfOpacitySeasonOverlay && (
            <div
              style={bungieBackgroundStyle(halfOpacitySeasonOverlay)}
              className={clsx(styles.shiftedLayer, styles.adjustOpacity)}
            />
          )}
          {craftedOverlays.length > 0 && (
            <div style={bungieBackgroundStyles(craftedOverlays)} className={styles.craftedLayer} />
          )}
          {fullOpacitySeasonOverlays.length > 0 && (
            <div
              style={bungieBackgroundStyles(fullOpacitySeasonOverlays)}
              className={styles.shiftedLayer}
            />
          )}
          {seasonIcon && (
            <div style={bungieBackgroundStyle(seasonIcon)} className={clsx(styles.seasonIcon)} />
          )}
        </div>
      )}

      {item.plug?.energyCost !== undefined && item.plug.energyCost > 0 && (
        <svg viewBox="0 0 100 100" className={styles.energyCost}>
          <text x="87" y="26" fontSize="18px" textAnchor="end">
            {item.plug.energyCost}
          </text>
        </svg>
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
    isArmorArchetypePlug(itemDef) ||
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
      {iconOverlay && (
        <BungieImage
          src={iconOverlay}
          className={clsx(styles.iconOverlay, { [styles.plugOverlay]: itemDef.plug })}
          alt=""
        />
      )}
      {energyCost !== undefined && energyCost > 0 && (
        <svg viewBox="0 0 100 100" className={styles.energyCost}>
          <text x="87" y="26" fontSize="18px" textAnchor="end">
            {energyCost}
          </text>
        </svg>
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
