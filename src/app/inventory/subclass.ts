import { damageNamesByEnum } from 'app/search/search-filter-values';
import { getFirstSocketByCategoryHash } from 'app/utils/socket-utils';
import { LookupTable } from 'app/utils/util-types';
import { DamageType } from 'bungie-api-ts/destiny2';
import { emptyPlugHashes } from 'data/d2/empty-plug-hashes';
import { ItemCategoryHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import subclassArc from 'images/subclass-arc.png';
import subclassPrismatic from 'images/subclass-prismatic.png';
import subclassSolar from 'images/subclass-solar.png';
import subclassStasis from 'images/subclass-stasis.png';
import subclassStrand from 'images/subclass-strand.png';
import subclassVoid from 'images/subclass-void.png';
import _ from 'lodash';
import { DimItem, PluggableInventoryItemDefinition } from './item-types';

const baseImagesByDamageType: LookupTable<DamageType, string> = {
  [DamageType.Arc]: subclassArc,
  [DamageType.Thermal]: subclassSolar,
  [DamageType.Void]: subclassVoid,
  [DamageType.Stasis]: subclassStasis,
  [DamageType.Strand]: subclassStrand,
  [DamageType.Kinetic]: subclassPrismatic,
};

interface SubclassIconInfo {
  base: string | undefined;
  super: string;
}
export function getSubclassIconInfo(item: DimItem): SubclassIconInfo | undefined {
  if (item.sockets) {
    const superSocket = getFirstSocketByCategoryHash(item.sockets, SocketCategoryHashes.Super);
    const superPlug = superSocket?.plugged?.plugDef;
    const superIcon = superPlug?.displayProperties?.icon;
    if (superIcon) {
      const damageType = item.element?.enumValue;
      if (damageType && baseImagesByDamageType[damageType]) {
        const base = baseImagesByDamageType[damageType];
        return {
          base: base,
          super: superIcon,
        };
      }
    }
  }
}

const nameToDamageType = _.invert(damageNamesByEnum);

export function getDamageTypeForSubclassPlug(item: PluggableInventoryItemDefinition) {
  // ignore empty plugs because they'll be present across all subclasses
  if (emptyPlugHashes.has(item.hash)) {
    return null;
  }

  // early out to avoid building subclass plug categories
  if (!item.itemCategoryHashes?.includes(ItemCategoryHashes.SubclassMods)) {
    return null;
  }

  for (const name in nameToDamageType) {
    if (item.plug.plugCategoryIdentifier.includes(name)) {
      return parseInt(nameToDamageType[name], 10) as DamageType;
    }
  }
  return null;
}
