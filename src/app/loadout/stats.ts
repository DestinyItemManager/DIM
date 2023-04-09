import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimCharacterStatSource } from 'app/inventory/store-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import { ArmorStatHashes, ModStatChanges } from 'app/loadout-builder/types';
import { ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { modsWithConditionalStats } from 'app/search/d2-known-values';
import { emptyArray } from 'app/utils/empty';
import { DestinyClass, DestinyItemInvestmentStatDefinition } from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';

export function isModStatActive(
  characterClass: DestinyClass,
  plugHash: number,
  stat: DestinyItemInvestmentStatDefinition
): boolean {
  if (!stat.isConditionallyActive) {
    return true;
  } else if (
    plugHash === modsWithConditionalStats.echoOfPersistence ||
    plugHash === modsWithConditionalStats.sparkOfFocus
  ) {
    // "-10 to the stat that governs your class ability recharge"
    return (
      (characterClass === DestinyClass.Hunter && stat.statTypeHash === StatHashes.Mobility) ||
      (characterClass === DestinyClass.Titan && stat.statTypeHash === StatHashes.Resilience) ||
      (characterClass === DestinyClass.Warlock && stat.statTypeHash === StatHashes.Recovery)
    );
  } else {
    return true;
  }
}

/**
 * This sums up the total stat contributions across mods passed in. These are then applied
 * to the loadouts after all the items base values have been summed. This mimics how mods
 * effect stat values in game and allows us to do some preprocessing.
 */
export function getTotalModStatChanges(
  defs: D2ManifestDefinitions,
  lockedMods: PluggableInventoryItemDefinition[],
  subclass: ResolvedLoadoutItem | undefined,
  characterClass: DestinyClass
) {
  const subclassPlugs = subclass?.loadoutItem.socketOverrides
    ? Object.values(subclass.loadoutItem.socketOverrides)
        .map((hash) => defs.InventoryItem.get(hash))
        .filter(isPluggableItem)
    : emptyArray<PluggableInventoryItemDefinition>();

  const totals: ModStatChanges = {
    [StatHashes.Mobility]: { value: 0, breakdown: [] },
    [StatHashes.Resilience]: { value: 0, breakdown: [] },
    [StatHashes.Recovery]: { value: 0, breakdown: [] },
    [StatHashes.Discipline]: { value: 0, breakdown: [] },
    [StatHashes.Intellect]: { value: 0, breakdown: [] },
    [StatHashes.Strength]: { value: 0, breakdown: [] },
  };

  const processPlugs = (
    plugs: PluggableInventoryItemDefinition[],
    source: DimCharacterStatSource
  ) => {
    const grouped = _.groupBy(plugs, (plug) => plug.hash);
    for (const plugCopies of Object.values(grouped)) {
      const mod = plugCopies[0];
      const modCount = plugCopies.length;
      for (const stat of mod.investmentStats) {
        if (stat.statTypeHash in totals && isModStatActive(characterClass, mod.hash, stat)) {
          const value = stat.value * modCount;
          totals[stat.statTypeHash as ArmorStatHashes].value += value;
          totals[stat.statTypeHash as ArmorStatHashes].breakdown!.push({
            name: mod.displayProperties.name,
            icon: bungieNetPath(mod.displayProperties.icon),
            hash: mod.hash,
            count: modCount,
            source,
            value,
          });
        }
      }
    }
  };

  processPlugs(subclassPlugs, 'subclassPlug');
  processPlugs(lockedMods, 'armorPlug');

  return totals;
}
