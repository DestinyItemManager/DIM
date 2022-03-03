import { getCurrentHub, startTransaction } from '@sentry/browser';
import { Transaction } from '@sentry/types';
import { handleAuthErrors } from 'app/accounts/actions';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { getPlatforms } from 'app/accounts/platforms';
import { currentAccountSelector } from 'app/accounts/selectors';
import { getCharacters as d1GetCharacters } from 'app/bungie-api/destiny1-api';
import { getCharacters, getStores } from 'app/bungie-api/destiny2-api';
import { bungieErrorToaster } from 'app/bungie-api/error-toaster';
import { D2ManifestDefinitions, getDefinitions } from 'app/destiny2/d2-definitions';
import { bungieNetPath } from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { maxLightItemSet } from 'app/loadout/auto-loadouts';
import { getLight } from 'app/loadout/loadout-utils';
import { d2ManifestSelector, manifestSelector } from 'app/manifest/selectors';
import { showNotification } from 'app/notifications/notifications';
import { getCharacterProgressions } from 'app/progress/selectors';
import { loadingTracker } from 'app/shell/loading-tracker';
import { ThunkResult } from 'app/store/types';
import { DimError } from 'app/utils/dim-error';
import { reportException } from 'app/utils/exceptions';
import { errorLog, timer } from 'app/utils/log';
import {
  DestinyCharacterComponent,
  DestinyCharacterProgressionComponent,
  DestinyCollectibleComponent,
  DestinyCollectiblesComponent,
  DestinyComponentType,
  DestinyItemComponent,
  DestinyProfileCollectiblesComponent,
  DestinyProfileResponse,
  DictionaryComponentResponse,
  SingleComponentResponse,
} from 'bungie-api-ts/destiny2';
import { BucketHashes, StatHashes } from 'data/d2/generated-enums';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import xpIcon from 'images/xpIcon.svg';
import _ from 'lodash';
import { CharacterInfo, charactersUpdated, error, loadNewItems, update } from './actions';
import { ArtifactXP } from './ArtifactXP';
import { cleanInfos } from './dim-item-info';
import { InventoryBuckets } from './inventory-buckets';
import { DimItem } from './item-types';
import { ItemPowerSet } from './ItemPowerSet';
import { d2BucketsSelector, storesSelector } from './selectors';
import { DimStore } from './store-types';
import { getCharacterStatsData as getD1CharacterStatsData } from './store/character-utils';
import { processItems } from './store/d2-item-factory';
import { getCharacterStatsData, makeCharacter, makeVault } from './store/d2-store-factory';
import { resetItemIndexGenerator } from './store/item-index';
import { getArtifactBonus } from './stores-helpers';

let isFirstLoad = true;

/**
 * Update the high level character information for all the stores
 * (level, power, stats, etc.). This does not update the
 * items in the stores.
 *
 * This works on both D1 and D2.
 *
 * TODO: Instead of this, update per-character after equip/dequip
 */
export function updateCharacters(): ThunkResult {
  return async (dispatch, getState) => {
    const account = currentAccountSelector(getState());
    if (!account) {
      return;
    }

    const defs = manifestSelector(getState());
    if (!defs) {
      return;
    }

    let characters: CharacterInfo[] = [];
    if (account.destinyVersion === 2) {
      const profileInfo = await getCharacters(account);
      characters = profileInfo.characters.data
        ? Object.values(profileInfo.characters.data).map((character) => ({
            characterId: character.characterId,
            level: character.levelProgression.level,
            powerLevel: character.light,
            background: bungieNetPath(character.emblemBackgroundPath),
            icon: bungieNetPath(character.emblemPath),
            stats: getCharacterStatsData(d2ManifestSelector(getState())!, character.stats),
            color: character.emblemColor,
          }))
        : [];
    } else {
      const profileInfo = await d1GetCharacters(account);
      characters = profileInfo.map((character) => ({
        characterId: character.id,
        level: character.base.characterLevel,
        powerLevel: character.base.characterBase.powerLevel,
        percentToNextLevel: character.base.percentToNextLevel / 100,
        background: bungieNetPath(character.base.backgroundPath),
        icon: bungieNetPath(character.base.emblemPath),
        stats: getD1CharacterStatsData(
          getState().manifest.d1Manifest!,
          character.base.characterBase
        ),
      }));
    }

    // If we switched account since starting this, give up
    if (account !== currentAccountSelector(getState())) {
      return;
    }

    dispatch(charactersUpdated(characters));
  };
}

export function mergeCollectibles(
  profileCollectibles: SingleComponentResponse<DestinyProfileCollectiblesComponent>,
  characterCollectibles: DictionaryComponentResponse<DestinyCollectiblesComponent>
) {
  const allCollectibles = {
    ...profileCollectibles?.data?.collectibles,
  };

  _.forIn(characterCollectibles?.data || {}, ({ collectibles }) => {
    Object.assign(allCollectibles, collectibles);
  });

  return allCollectibles;
}

/**
 * Returns a promise for a fresh view of the stores and their items.
 */

export function loadStores(
  components?: DestinyComponentType[]
): ThunkResult<DimStore[] | undefined> {
  return async (dispatch, getState) => {
    let account = currentAccountSelector(getState());
    if (!account) {
      // TODO: throw here?
      await dispatch(getPlatforms());
      account = currentAccountSelector(getState());
      if (!account || account.destinyVersion !== 2) {
        return;
      }
    }

    const stores = await dispatch(loadStoresData(account, isFirstLoad ? components : undefined));

    if (isFirstLoad) {
      isFirstLoad = false;
      if (components) {
        // async load the rest (no await)
        dispatch(loadStoresData(account));
      }
    }

    return stores;
  };
}

function loadStoresData(
  account: DestinyAccount,
  components?: DestinyComponentType[]
): ThunkResult<DimStore[] | undefined> {
  return async (dispatch, getState) => {
    const promise = (async () => {
      // If we switched account since starting this, give up
      if (account !== currentAccountSelector(getState())) {
        return;
      }

      const transaction = startTransaction({ name: 'loadStoresD2' });
      // set the transaction on the scope so it picks up any errors
      getCurrentHub()?.configureScope((scope) => scope.setSpan(transaction));

      resetItemIndexGenerator();

      // TODO: if we've already loaded profile recently, don't load it again

      try {
        const { mockProfileData, readOnly } = getState().inventory;

        const [defs, , profileInfo] = await Promise.all([
          dispatch(getDefinitions())!,
          dispatch(loadNewItems(account)),
          mockProfileData
            ? (JSON.parse(mockProfileData) as DestinyProfileResponse)
            : getStores(account, components),
        ]);

        // If we switched account since starting this, give up
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        const stopTimer = timer('Process inventory');

        if (!defs || !profileInfo) {
          return;
        }

        const buckets = d2BucketsSelector(getState())!;
        const stores = buildStores(defs, buckets, profileInfo, transaction);

        if (readOnly) {
          for (const store of stores) {
            store.hadErrors = true;
            for (const item of store.items) {
              item.lockable = false;
              item.trackable = false;
              item.notransfer = true;
              item.taggable = false;
            }
          }
        }

        const currencies = processCurrencies(profileInfo, defs);

        stopTimer();

        const stateSpan = transaction?.startChild({
          op: 'updateInventoryState',
        });
        const stopStateTimer = timer('Inventory state update');

        // If we switched account since starting this, give up before saving
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        dispatch(cleanInfos(stores));
        dispatch(update({ stores, profileResponse: profileInfo, currencies }));

        stopStateTimer();
        stateSpan?.finish();

        return stores;
      } catch (e) {
        errorLog('d2-stores', 'Error loading stores', e);
        reportException('d2stores', e);

        // If we switched account since starting this, give up
        if (account !== currentAccountSelector(getState())) {
          return;
        }

        dispatch(handleAuthErrors(e));

        if (storesSelector(getState()).length > 0) {
          // don't replace their inventory with the error, just notify
          showNotification(bungieErrorToaster(e));
        } else {
          dispatch(error(e));
        }
        // It's important that we swallow all errors here - otherwise
        // our observable will fail on the first error. We could work
        // around that with some rxjs operators, but it's easier to
        // just make this never fail.
        return undefined;
      } finally {
        transaction?.finish();
      }
    })();
    loadingTracker.addPromise(promise);
    return promise;
  };
}

export function buildStores(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileInfo: DestinyProfileResponse,
  transaction?: Transaction
): DimStore[] {
  // TODO: components may be hidden (privacy)

  if (
    !profileInfo.profileInventory.data ||
    !profileInfo.characterInventories.data ||
    !profileInfo.characters.data
  ) {
    errorLog(
      'd2-stores',
      'Vault or character inventory was missing - bailing in order to avoid corruption'
    );
    throw new DimError('BungieService.MissingInventory');
  }

  const lastPlayedDate = findLastPlayedDate(profileInfo);

  const mergedCollectibles = mergeCollectibles(
    profileInfo.profileCollectibles,
    profileInfo.characterCollectibles
  );

  const processSpan = transaction?.startChild({
    op: 'processItems',
  });
  const vault = processVault(defs, buckets, profileInfo, mergedCollectibles);

  const characters = Object.keys(profileInfo.characters.data).map((characterId) =>
    processCharacter(defs, buckets, characterId, profileInfo, mergedCollectibles, lastPlayedDate)
  );
  processSpan?.finish();

  const stores = [...characters, vault];

  const allItems = stores.flatMap((s) => s.items);

  const characterProgress = getCharacterProgressions(profileInfo);

  const hasClassified = allItems.some(
    (i) =>
      i.classified &&
      (i.location.inWeapons || i.location.inArmor || i.bucket.hash === BucketHashes.Ghost)
  );

  for (const s of stores) {
    updateBasePower(
      allItems,
      s,
      defs,
      hasClassified,
      characterProgress,
      profileInfo.profileProgression?.data?.seasonalArtifact.powerBonusProgression.progressionHash
    );
  }

  return stores;
}

function processCurrencies(profileInfo: DestinyProfileResponse, defs: D2ManifestDefinitions) {
  const profileCurrencies = profileInfo.profileCurrencies.data
    ? profileInfo.profileCurrencies.data.items
    : [];
  const currencies = profileCurrencies.map((c) => ({
    itemHash: c.itemHash,
    quantity: c.quantity,
    displayProperties: defs.InventoryItem.get(c.itemHash).displayProperties,
  }));
  return currencies;
}

/**
 * Process a single character from its raw form to a DIM store, with all the items.
 */
function processCharacter(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  characterId: string,
  profileInfo: DestinyProfileResponse,
  mergedCollectibles: {
    [hash: number]: DestinyCollectibleComponent;
  },
  lastPlayedDate: Date
): DimStore {
  const character = profileInfo.characters.data![characterId];
  const characterInventory = profileInfo.characterInventories.data?.[characterId]?.items || [];
  const profileInventory = profileInfo.profileInventory.data?.items || [];
  const characterEquipment = profileInfo.characterEquipment.data?.[characterId]?.items || [];
  const itemComponents = profileInfo.itemComponents;
  const uninstancedItemObjectives =
    getCharacterProgressions(profileInfo, characterId)?.uninstancedItemObjectives || [];

  const store = makeCharacter(defs, character, lastPlayedDate);

  // We work around the weird account-wide buckets by assigning them to the current character
  const items = characterInventory.slice();
  for (const k in characterEquipment) {
    items.push(characterEquipment[k]);
  }

  if (store.current) {
    for (const i of profileInventory) {
      const bucket = buckets.byHash[i.bucketHash];
      // items that can be stored in a vault
      if (bucket && (bucket.vaultBucket || bucket.hash === BucketHashes.SpecialOrders)) {
        items.push(i);
      }
    }
  }

  const processedItems = processItems(
    defs,
    buckets,
    store,
    items,
    itemComponents,
    mergedCollectibles,
    uninstancedItemObjectives
  );
  store.items = processedItems;
  return store;
}

function processVault(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileInfo: DestinyProfileResponse,
  mergedCollectibles: {
    [hash: number]: DestinyCollectibleComponent;
  }
): DimStore {
  const profileInventory = profileInfo.profileInventory.data
    ? profileInfo.profileInventory.data.items
    : [];
  const itemComponents = profileInfo.itemComponents;

  const store = makeVault();

  const items: DestinyItemComponent[] = [];
  for (const i of profileInventory) {
    const bucket = buckets.byHash[i.bucketHash];
    // items that cannot be stored in the vault, and are therefore *in* a vault
    if (bucket && !bucket.vaultBucket && bucket.hash !== BucketHashes.SpecialOrders) {
      items.push(i);
    }
  }

  const processedItems = processItems(
    defs,
    buckets,
    store,
    items,
    itemComponents,
    mergedCollectibles
  );
  store.items = processedItems;

  return store;
}

/**
 * Find the date of the most recently played character.
 */
function findLastPlayedDate(profileInfo: DestinyProfileResponse) {
  return Object.values(profileInfo.characters.data!).reduce(
    (memo: Date, character: DestinyCharacterComponent) => {
      const d1 = new Date(character.dateLastPlayed);
      return memo ? (d1 >= memo ? d1 : memo) : d1;
    },
    new Date(0)
  );
}

// Add a fake stat for "max base power"
function updateBasePower(
  allItems: DimItem[],
  store: DimStore,
  defs: D2ManifestDefinitions,
  hasClassified: boolean,
  characterProgress: DestinyCharacterProgressionComponent | undefined,
  bonusPowerProgressionHash: number | undefined
) {
  if (!store.isVault) {
    const def = defs.Stat.get(StatHashes.Power);
    const { equippable, unrestricted } = maxLightItemSet(allItems, store);
    const unrestrictedMaxGearPower = getLight(store, unrestricted);
    const unrestrictedPowerFloor = Math.floor(unrestrictedMaxGearPower);
    const equippableMaxGearPower = getLight(store, equippable);

    const differentEquippableMaxGearPower =
      (unrestrictedMaxGearPower !== equippableMaxGearPower && equippableMaxGearPower) || undefined;

    store.stats.maxGearPower = {
      hash: -3,
      name: t('Stats.MaxGearPowerAll'),
      // used to be t('Stats.MaxGearPower'), a translation i don't want to lose yet
      hasClassified,
      description: '',
      differentEquippableMaxGearPower,
      richTooltip: ItemPowerSet(unrestricted, unrestrictedPowerFloor),
      value: unrestrictedMaxGearPower,
      icon: helmetIcon,
    };

    const artifactPower = getArtifactBonus(store);
    store.stats.powerModifier = {
      hash: -2,
      name: t('Stats.PowerModifier'),
      hasClassified: false,
      description: '',
      richTooltip: ArtifactXP(characterProgress, bonusPowerProgressionHash),
      value: artifactPower,
      icon: xpIcon,
    };

    store.stats.maxTotalPower = {
      hash: -1,
      name: t('Stats.MaxTotalPower'),
      hasClassified,
      description: '',
      value: unrestrictedMaxGearPower + artifactPower,
      icon: bungieNetPath(def.displayProperties.icon),
    };
  }
}
