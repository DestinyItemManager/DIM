import { getPlatforms } from 'app/accounts/platforms';
import { currentAccountSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { maxLightItemSet } from 'app/loadout/auto-loadouts';
import { ThunkResult } from 'app/store/types';
import {
  DestinyCharacterComponent,
  DestinyCollectibleComponent,
  DestinyCollectiblesComponent,
  DestinyItemComponent,
  DestinyProfileCollectiblesComponent,
  DestinyProfileResponse,
  DictionaryComponentResponse,
  SingleComponentResponse,
} from 'bungie-api-ts/destiny2';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import helmetIcon from '../../../destiny-icons/armor_types/helmet.svg';
import xpIcon from '../../images/xpIcon.svg';
import { getCharacters as d1GetCharacters } from '../bungie-api/destiny1-api';
import { getCharacters, getStores } from '../bungie-api/destiny2-api';
import { bungieErrorToaster } from '../bungie-api/error-toaster';
import { D2ManifestDefinitions, getDefinitions } from '../destiny2/d2-definitions';
import { bungieNetPath } from '../dim-ui/BungieImage';
import { getLight } from '../loadout/loadout-utils';
import { showNotification } from '../notifications/notifications';
import { loadingTracker } from '../shell/loading-tracker';
import { reportException } from '../utils/exceptions';
import { CharacterInfo, charactersUpdated, error, loadNewItems, update } from './actions';
import { cleanInfos } from './dim-item-info';
import { InventoryBuckets } from './inventory-buckets';
import { ItemPowerSet } from './ItemPowerSet';
import { bucketsSelector, storesSelector } from './selectors';
import { DimStore, DimVault } from './store-types';
import { getCharacterStatsData as getD1CharacterStatsData } from './store/character-utils';
import { processItems } from './store/d2-item-factory';
import { getCharacterStatsData, makeCharacter, makeVault } from './store/d2-store-factory';
import { resetItemIndexGenerator } from './store/item-index';
import { getArtifactBonus } from './stores-helpers';

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

    const defs =
      account.destinyVersion === 2
        ? getState().manifest.d2Manifest
        : getState().manifest.d1Manifest;

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
            stats: getCharacterStatsData(getState().manifest.d2Manifest!, character.stats),
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

    dispatch(charactersUpdated(characters));
  };
}

export function mergeCollectibles(
  profileCollectibles: SingleComponentResponse<DestinyProfileCollectiblesComponent>,
  characterCollectibles: DictionaryComponentResponse<DestinyCollectiblesComponent>
) {
  const allCollectibles = {
    ...profileCollectibles.data?.collectibles,
  };

  _.forIn(characterCollectibles.data || {}, ({ collectibles }) => {
    Object.assign(allCollectibles, collectibles);
  });

  return allCollectibles;
}

/**
 * Returns a promise for a fresh view of the stores and their items.
 */
export function loadStores(): ThunkResult<DimStore[] | undefined> {
  return async (dispatch, getState) => {
    const promise = (async () => {
      let account = currentAccountSelector(getState());
      if (!account) {
        // TODO: throw here?
        await dispatch(getPlatforms());
        account = currentAccountSelector(getState());
        if (!account) {
          return;
        }
      }
      resetItemIndexGenerator();

      // TODO: if we've already loaded profile recently, don't load it again

      try {
        const [defs, , profileInfo] = await Promise.all([
          (dispatch(getDefinitions()) as any) as Promise<D2ManifestDefinitions>,
          dispatch(loadNewItems(account)),
          getStores(account),
        ]);
        if (!defs || !profileInfo) {
          return;
        }
        const buckets = bucketsSelector(getState())!;
        console.time('Process inventory');

        // TODO: components may be hidden (privacy)

        if (
          !profileInfo.profileInventory.data ||
          !profileInfo.characterInventories.data ||
          !profileInfo.characters.data
        ) {
          console.error(
            'Vault or character inventory was missing - bailing in order to avoid corruption'
          );
          throw new Error(t('BungieService.Difficulties'));
        }

        const lastPlayedDate = findLastPlayedDate(profileInfo);

        const mergedCollectibles = mergeCollectibles(
          profileInfo.profileCollectibles,
          profileInfo.characterCollectibles
        );

        const vault = processVault(defs, buckets, profileInfo, mergedCollectibles);

        const characters = Object.keys(profileInfo.characters.data).map((characterId) =>
          processCharacter(
            defs,
            buckets,
            characterId,
            profileInfo,
            mergedCollectibles,
            lastPlayedDate
          )
        );

        const stores = [...characters, vault];

        dispatch(cleanInfos(stores));

        for (const s of stores) {
          updateBasePower(stores, s, defs);
        }

        const currencies = processCurrencies(profileInfo, defs);

        // Let our styling know how many characters there are
        // TODO: this should be an effect on the stores component, except it's also
        // used on D1 activities page
        document
          .querySelector('html')!
          .style.setProperty('--num-characters', String(stores.length - 1));
        console.timeEnd('Process inventory');

        console.time('Inventory state update');
        dispatch(update({ stores, profileResponse: profileInfo, currencies }));
        console.timeEnd('Inventory state update');

        return stores;
      } catch (e) {
        console.error('Error loading stores', e);
        reportException('d2stores', e);
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
      }
    })();
    loadingTracker.addPromise(promise);
    return promise;
  };
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
  const progressions = profileInfo.characterProgressions.data?.[characterId]?.progressions || [];
  const uninstancedItemObjectives =
    profileInfo.characterProgressions.data?.[characterId]?.uninstancedItemObjectives || [];

  const store = makeCharacter(defs, character, lastPlayedDate);

  // This is pretty much just needed for the xp bar under the character header
  store.progression = progressions ? { progressions: Object.values(progressions) } : null;

  // We work around the weird account-wide buckets by assigning them to the current character
  const items = characterInventory.slice();
  for (const k in characterEquipment) {
    items.push(characterEquipment[k]);
  }

  if (store.current) {
    for (const i of profileInventory) {
      const bucket = buckets.byHash[i.bucketHash];
      // items that can be stored in a vault
      if (bucket && (bucket.vaultBucket || bucket.type === 'SpecialOrders')) {
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
): DimVault {
  const profileInventory = profileInfo.profileInventory.data
    ? profileInfo.profileInventory.data.items
    : [];
  const itemComponents = profileInfo.itemComponents;

  const store = makeVault();

  const items: DestinyItemComponent[] = [];
  for (const i of profileInventory) {
    const bucket = buckets.byHash[i.bucketHash];
    // items that cannot be stored in the vault, and are therefore *in* a vault
    if (bucket && !bucket.vaultBucket && bucket.type !== 'SpecialOrders') {
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
function updateBasePower(stores: DimStore[], store: DimStore, defs: D2ManifestDefinitions) {
  if (!store.isVault) {
    const def = defs.Stat.get(StatHashes.Power);
    const { equippable, unrestricted } = maxLightItemSet(stores, store);
    const unrestrictedMaxGearPower = getLight(store, unrestricted);
    const unrestrictedPowerFloor = Math.floor(unrestrictedMaxGearPower);
    const equippableMaxGearPower = getLight(store, equippable);

    const hasClassified = stores.some((s) =>
      s.items.some(
        (i) =>
          i.classified &&
          (i.location.sort === 'Weapons' || i.location.sort === 'Armor' || i.type === 'Ghost')
      )
    );

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
