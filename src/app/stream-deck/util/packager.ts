import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, currenciesSelector, vaultSelector } from 'app/inventory/selectors';
import { AccountCurrency, DimStore } from 'app/inventory/store-types';
import { findItemsByBucket, getArtifactBonus } from 'app/inventory/stores-helpers';
import { maxLightItemSet } from 'app/loadout-drawer/auto-loadouts';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { totalPostmasterItems } from 'app/loadout-drawer/postmaster';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { getCharacterProgressions } from 'app/progress/selectors';
import { RootState } from 'app/store/types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';

// find and get the quantity of a specif item type
function getPostMasterItem(lostItems: DimItem[], hash: number) {
  return lostItems.find((it) => it.location.inPostmaster && it.hash === hash)?.amount || 0;
}

// find and get the quantity of a specif currency
function getCurrency(currencies: AccountCurrency[], hash: number) {
  return currencies.find((curr) => curr.itemHash === hash)?.quantity;
}

// create the postmaster update data
function postmaster(store: DimStore) {
  const items = findItemsByBucket(store, BucketHashes.LostItems);
  return {
    total: totalPostmasterItems(store),
    ascendantShards: getPostMasterItem(items, 4257549985),
    enhancementPrisms: getPostMasterItem(items, 4257549984),
    spoils: getPostMasterItem(items, 3702027555),
  };
}

// create the max power update data
function maxPower(store: DimStore, state: RootState) {
  const allItems = allItemsSelector(state);
  const maxLight = getLight(store, maxLightItemSet(allItems, store).equippable);
  const artifact = getArtifactBonus(store);

  return {
    total: (maxLight + artifact).toFixed(0),
    base: maxLight.toFixed(0),
    artifact,
  };
}

// create the vault update data
function vault(state: RootState) {
  const vault = vaultSelector(state);
  if (!vault) {
    return;
  }
  const currencies = currenciesSelector(state);
  return {
    vault: vault.items.length,
    shards: getCurrency(currencies, 1022552290),
    glimmer: getCurrency(currencies, 3159615086),
    brightDust: getCurrency(currencies, 2817410917),
  };
}

// seasonal hash from src/app/progress/Milestones.tsx
function getCurrentSeason(
  state: RootState,
  profile: DestinyProfileResponse | undefined,
): [number?, number?, string?] {
  const defs = d2ManifestSelector(state);
  const season = profile?.profile?.data?.currentSeasonHash
    ? defs?.Season.get(profile.profile.data.currentSeasonHash)
    : undefined;
  const seasonPass = season?.seasonPassList[0]?.seasonPassHash
    ? defs?.SeasonPass.get(season.seasonPassList[0].seasonPassHash)
    : undefined;
  if (!season) {
    return [];
  }
  return [
    seasonPass?.rewardProgressionHash,
    seasonPass?.prestigeProgressionHash,
    season.artifactItemHash
      ? defs?.InventoryItem.get(season.artifactItemHash).displayProperties.icon
      : undefined,
  ];
}

// create the metrics update data
function metrics(state: RootState) {
  const profile = state.inventory.profileResponse;
  const progression = getCharacterProgressions(profile)?.progressions ?? {};
  const { lifetimeScore, activeScore } = profile?.profileRecords?.data || {};
  const [battlePassHash, prestigeLevel, artifactIcon] = getCurrentSeason(state, profile);

  // battle pass level calc from src/app/progress/SeasonalRank.tsx
  const seasonProgress = progression[battlePassHash!];
  const prestigeProgress = progression[prestigeLevel!];

  const prestigeMode = seasonProgress?.level === seasonProgress?.levelCap;

  const seasonalRank = prestigeMode
    ? prestigeProgress?.level + seasonProgress?.levelCap
    : seasonProgress?.level;

  return {
    gunsmith: progression[1471185389].currentProgress,
    triumphs: lifetimeScore ?? 0,
    triumphsActive: activeScore ?? 0,
    battlePass: battlePassHash ? seasonalRank : 0,
    artifactIcon,
  };
}

export function streamDeckClearId(id: string) {
  return id.replace(/-.*/, '');
}

function equippedItems(store?: DimStore) {
  return store?.items.filter((it) => it.equipment).map((it) => streamDeckClearId(it.index)) ?? [];
}

function inventoryCounters(state?: RootState) {
  return state?.inventory.stores
    .flatMap((it) => it.items)
    .filter((it) => it.bucket.inInventory)
    .reduce(
      (acc, it) => {
        const key = streamDeckClearId(it.index);
        if (acc[key]) {
          acc[key] += it.amount;
        } else {
          acc[key] = it.amount;
        }
        return acc;
      },
      {} as Record<string, number>,
    );
}

function character(store: DimStore) {
  return {
    class: store.classType,
    icon: store.icon,
    background: store.background,
  };
}

const PerksCategory = [3708671066, 1052191496];

const WeaponsHashes = [
  BucketHashes.KineticWeapons,
  BucketHashes.EnergyWeapons,
  BucketHashes.PowerWeapons,
];

interface PerkDefinition {
  title: string;
  image: string;
}

function perks(state: RootState) {
  const perks = new Map<string, PerkDefinition>();
  const items = allItemsSelector(state);
  for (const item of items) {
    if (item.isExotic || WeaponsHashes.every((hash) => item.bucket.hash !== hash)) {
      continue;
    }

    const sockets = item.sockets?.allSockets;

    if (!sockets) {
      continue;
    }

    for (const socket of Object.values(sockets)) {
      if (
        socket.isMod ||
        !PerksCategory.some((hash) => socket.plugged?.plugDef?.itemCategoryHashes?.includes(hash))
      ) {
        continue;
      }

      const plug = socket.plugged?.plugDef.displayProperties;

      if (!plug) {
        continue;
      }

      const definition = {
        title: plug.name,
        image: plug.icon,
      };
      if (!perks.has(definition.title)) {
        perks.set(definition.title, definition);
      }
    }
  }

  return Array.from(perks.values());
}

export default {
  character,
  perks,
  metrics,
  vault,
  maxPower,
  postmaster,
  equippedItems,
  inventoryCounters,
};
