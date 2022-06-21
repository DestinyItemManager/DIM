import {
  allItemsSelector,
  currenciesSelector,
  profileResponseSelector,
  vaultSelector,
} from 'app/inventory/selectors';
import { AccountCurrency, DimStore } from 'app/inventory/store-types';
import { getArtifactBonus } from 'app/inventory/stores-helpers';
import { maxLightItemSet } from 'app/loadout-drawer/auto-loadouts';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { totalPostmasterItems } from 'app/loadout-drawer/postmaster';
import { d2ManifestSelector } from 'app/manifest/selectors';
import { getCharacterProgressions } from 'app/progress/selectors';
import { RootState } from 'app/store/types';
import { DestinyProfileResponse } from 'bungie-api-ts/destiny2';

function getPostMasterItem(store: DimStore, hash: number) {
  return store.items.find((it) => it.location.inPostmaster && it.hash === hash)?.amount || 0;
}

function getCurrency(currencies: AccountCurrency[], hash: number) {
  return currencies.find((curr: AccountCurrency) => curr.itemHash === hash)?.quantity;
}

// create the postmaster update data
function streamDeckPostMasterUpdate(store: DimStore) {
  return {
    total: totalPostmasterItems(store),
    ascendantShards: getPostMasterItem(store, 4257549985),
    enhancementPrisms: getPostMasterItem(store, 4257549984),
    spoils: getPostMasterItem(store, 3702027555),
  };
}

// create the max power update data
function streamDeckMaxPowerUpdate(store: DimStore, state: RootState) {
  const allItems = allItemsSelector(state);
  const maxLight = getLight(store, maxLightItemSet(allItems, store).equippable);
  const artifact = getArtifactBonus(store);

  return {
    total: (maxLight + artifact).toFixed(2),
    base: maxLight.toFixed(2),
    artifact,
  };
}

// create the vault update data
function streamDeckVaultUpdate(state: RootState) {
  const vault = vaultSelector(state);
  const currencies = currenciesSelector(state);
  return {
    vault: vault?.items.length,
    shards: getCurrency(currencies, 1022552290),
    glimmer: getCurrency(currencies, 3159615086),
    brightDust: getCurrency(currencies, 2817410917),
  };
}

// seasonal hash from src/app/progress/Milestones.tsx
function getCurrentSeason(state: RootState, profile: DestinyProfileResponse | undefined) {
  const defs = d2ManifestSelector(state);
  const season = profile?.profile?.data?.currentSeasonHash
    ? defs?.Season.get(profile.profile.data.currentSeasonHash)
    : undefined;
  const seasonPass = season?.seasonPassHash
    ? defs?.SeasonPass.get(season.seasonPassHash)
    : undefined;
  if (!season) {
    return [];
  }
  return [
    seasonPass?.rewardProgressionHash,
    seasonPass?.prestigeProgressionHash,
    defs?.InventoryItem.get(season.artifactItemHash!).displayProperties.icon,
  ];
}

// create the metrics update data
function streamDeckMetricsUpdate(state: RootState) {
  const profile = profileResponseSelector(state);
  const progression = getCharacterProgressions(profile)?.progressions ?? {};
  const [battlePassHash, prestigeLevel, artifactIcon] = getCurrentSeason(state, profile);

  // battle pass level calc from src/app/progress/SeasonalRank.tsx
  const seasonProgress = progression[battlePassHash!];
  const prestigeProgress = progression[prestigeLevel!];
  const prestigeMode = seasonProgress.level === seasonProgress.levelCap;

  const seasonalRank = prestigeMode
    ? prestigeProgress?.level + seasonProgress.levelCap
    : seasonProgress.level;

  return {
    gambit: progression[3008065600].currentProgress,
    vanguard: progression[457612306].currentProgress,
    crucible: progression[2083746873].currentProgress,
    trials: progression[2755675426].currentProgress,
    gunsmith: progression[1471185389].currentProgress,
    ironBanner: progression[599071390].currentProgress,
    battlePass: battlePassHash ? seasonalRank : 0,
    artifactIcon,
  };
}

export default {
  metrics: streamDeckMetricsUpdate,
  vault: streamDeckVaultUpdate,
  maxPower: streamDeckMaxPowerUpdate,
  postmaster: streamDeckPostMasterUpdate,
};
