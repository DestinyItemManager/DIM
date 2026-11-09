import { itemConstants } from 'app/destiny2/d2-definitions';
import { DimItem } from 'app/inventory/item-types';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { getArmor3StatFocus, isArmor3 } from 'app/utils/item-utils';
import { getWeaponArchetype } from 'app/utils/socket-utils';
import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';

/** Display data shared by item selection and the Stream Deck picker. */
export function streamDeckItemAppearance(
  item: DimItem,
  defs: ReturnType<typeof d2ManifestSelector>,
) {
  const statFocus =
    item.bucket.inArmor && isArmor3(item) ? getArmor3StatFocus(item)?.[0] : undefined;
  const isErgoSum =
    item.ammoType === DestinyAmmunitionType.Special &&
    item.itemCategoryHashes.includes(ItemCategoryHashes.Sword);
  const frame =
    item.bucket.inWeapons && (!item.isExotic || isErgoSum) ? getWeaponArchetype(item) : undefined;
  return {
    tier: item.tier,
    overlay: item.iconOverlay,
    isExotic: item.isExotic,
    isSubClass: item.bucket.hash === BucketHashes.Subclass,
    isCrafted: Boolean(item.crafted),
    craftedOverlay:
      item.crafted === 'crafted'
        ? itemConstants?.craftedOverlayPath
        : item.crafted === 'enhanced'
          ? itemConstants?.enhancedItemOverlayPath
          : undefined,
    craftedBackground: item.crafted ? itemConstants?.craftedBackgroundPath : undefined,
    element: item.element?.displayProperties.icon,
    power: item.power || undefined,
    breaker: item.breakerType?.displayProperties.icon,
    badge:
      statFocus !== undefined
        ? defs?.Stat.get(statFocus)?.displayProperties.icon
        : frame?.displayProperties.icon,
    seasonIcon: item.iconDef?.secondaryBackground,
    masterwork: item.masterwork,
    locked: item.locked,
  };
}
