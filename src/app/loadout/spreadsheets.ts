import { defaultLoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { D2Categories } from 'app/destiny2/d2-bucket-categories';
import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  allItemsSelector,
  artifactUnlocksSelector,
  bucketsSelector,
  createItemContextSelector,
  storesSelector,
  unlockedPlugSetItemsSelector,
} from 'app/inventory/selectors';
import { getLockedExotic } from 'app/loadout-builder/filter/ExoticArmorChoice';
import { inGameArmorEnergyRules } from 'app/loadout-builder/types';
import {
  getLoadoutStats,
  newLoadoutFromEquipped,
  pickBackingStore,
} from 'app/loadout-drawer/loadout-utils';
import { ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { loadoutsSelector } from 'app/loadout/loadouts-selector';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { ThunkResult } from 'app/store/types';
import { filterMap, mapValues } from 'app/utils/collections';
import { compareByIndex } from 'app/utils/comparators';
import { CsvRow, downloadCsv } from 'app/utils/csv';
import {
  aspectSocketCategoryHashes,
  fragmentSocketCategoryHashes,
  subclassAbilitySocketCategoryHashes,
} from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { fullyResolveLoadout } from './ingame/selectors';
import { getSubclassPlugs } from './loadout-item-utils';
import { includesRuntimeStatMods } from './stats';

export function downloadLoadoutsCsv(): ThunkResult {
  return async (_dispatch, getState) => {
    const defs = d2ManifestSelector(getState());
    const stores = storesSelector(getState());
    const itemCreationContext = createItemContextSelector(getState());
    const allItems = allItemsSelector(getState());
    const allLoadouts = loadoutsSelector(getState());
    const buckets = bucketsSelector(getState());

    // perhaps we're loading
    if (!stores.length || !defs || !buckets) {
      return;
    }

    const equippedLoadouts = stores
      .filter((s) => !s.isVault)
      .map((s) =>
        newLoadoutFromEquipped(
          `Equipped ${s.className}`,
          s,
          artifactUnlocksSelector(s.id)(getState()),
        ),
      );

    const data = filterMap(equippedLoadouts.concat(allLoadouts), (loadout) => {
      const storeId = pickBackingStore(stores, undefined, loadout.classType)?.id;
      if (!storeId) {
        return undefined;
      }
      const unlockedPlugs = unlockedPlugSetItemsSelector(storeId)(getState());
      const resolvedLoadout = fullyResolveLoadout(
        storeId,
        loadout,
        defs,
        unlockedPlugs,
        itemCreationContext,
        allItems,
      );
      const includesFontStats =
        loadout.parameters?.includeRuntimeStatBenefits ??
        defaultLoadoutParameters.includeRuntimeStatBenefits!;
      const subclass = resolvedLoadout.resolvedLoadoutItems.find(
        (item) => item.item.bucket.hash === BucketHashes.Subclass,
      );
      const subclassPlugs = getSubclassPlugs(defs, subclass);
      const abilities = subclassPlugs.filter((p) =>
        subclassAbilitySocketCategoryHashes.includes(p.socketCategoryHash),
      );
      const aspects = subclassPlugs.filter((p) =>
        aspectSocketCategoryHashes.includes(p.socketCategoryHash),
      );
      const fragments = subclassPlugs.filter((p) =>
        fragmentSocketCategoryHashes.includes(p.socketCategoryHash),
      );
      const stats: CsvRow = {};
      const equippedArmor = resolvedLoadout.resolvedLoadoutItems.filter(
        (i) => i.loadoutItem.equip && i.item.bucket.inArmor,
      );
      if (equippedArmor.length === 5) {
        const calculatedStats = getLoadoutStats(
          defs,
          loadout.classType,
          subclass,
          equippedArmor.map((i) => i.item),
          resolvedLoadout.resolvedMods.map((mod) => mod.resolvedMod),
          includesFontStats,
          inGameArmorEnergyRules,
        );
        for (const [statHash_, val] of Object.entries(calculatedStats)) {
          const def = defs.Stat.get(parseInt(statHash_, 10));
          if (def) {
            stats[def.displayProperties.name] = val.value;
          }
        }
      }

      const className =
        loadout.classType === DestinyClass.Unknown
          ? t('Loadouts.Any')
          : Object.values(defs.Class.getAll()).find((c) => c.classType === loadout.classType)!
              .displayProperties.name;

      const localizeResolvedPlugs = (list: { plug: PluggableInventoryItemDefinition }[]) =>
        list.map((mod) => mod.plug.displayProperties.name);

      const bucketOrder = Object.values(D2Categories).flat();

      const sortItems = compareByIndex(
        bucketOrder,
        (item: ResolvedLoadoutItem) => item.item.bucket.hash,
      );

      const equippedItems = resolvedLoadout.resolvedLoadoutItems
        .filter((i) => i.loadoutItem.equip && i.item.bucket.hash !== BucketHashes.Subclass)
        .sort(sortItems);

      const equippedItemValues = Object.fromEntries(
        equippedItems.map((item) => [`Equipped ${item.item.bucket.name}`, item.item.name]),
      );

      const unequippedItems = resolvedLoadout.resolvedLoadoutItems
        .filter((i) => !i.loadoutItem.equip)
        .sort(sortItems);

      const unequippedItemValues = mapValues(
        Object.groupBy(unequippedItems, (item) => `Unequipped ${item.item.bucket.name}`),
        (items) => items.map((item) => item.item.name),
      );

      const mods = resolvedLoadout.resolvedMods.map((mod) => mod.resolvedMod);

      return {
        Id: loadout.id,
        'Class Type': className,
        Name: loadout.name,
        Notes: loadout.notes,
        'Last Edited': loadout.lastUpdatedAt
          ? new Date(loadout.lastUpdatedAt).toDateString()
          : undefined,
        'Exotic Armor':
          loadout.parameters?.exoticArmorHash !== undefined
            ? getLockedExotic(defs, loadout.parameters?.exoticArmorHash)?.[1]
            : undefined,
        'Includes Font Mod Stats': includesRuntimeStatMods(mods.map((mod) => mod.hash))
          ? includesFontStats
          : undefined,
        ...stats,
        ...equippedItemValues,
        ...unequippedItemValues,
        Subclass: subclass?.item.name,
        Abilities: localizeResolvedPlugs(abilities),
        Aspects: localizeResolvedPlugs(aspects),
        Fragments: localizeResolvedPlugs(fragments),
        Mods: mods.map((mod) => mod.displayProperties.name),
        'Artifact Season': loadout.parameters?.artifactUnlocks?.seasonNumber,
        'Artifact Unlocks': loadout.parameters?.artifactUnlocks?.unlockedItemHashes.map(
          (modHash) => defs.InventoryItem.get(modHash)?.displayProperties.name,
        ),
      };
    });

    downloadCsv(`destinyLoadouts`, data, {
      unpackArrays: [
        'Abilities',
        'Aspects',
        'Fragments',
        'Equipped Items',
        'Unequipped Items',
        'Mods',
        'Artifact Unlocks',
      ],
    });
  };
}
