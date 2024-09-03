import { DestinyAccount } from 'app/accounts/destiny-account';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { settingsSelector } from 'app/dim-api/selectors';
import { manifestSelector } from 'app/manifest/selectors';
import { ThunkResult } from 'app/store/types';
import { filterMap } from 'app/utils/collections';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { convertToError } from 'app/utils/errors';
import { infoLog } from 'app/utils/log';
import { DestinyItemType, DestinyVendorResponse, TierType } from 'bungie-api-ts/destiny2';
import { createAction } from 'typesafe-actions';
import {
  LimitedDestinyVendorsResponse,
  getVendorSaleComponents,
  getVendors,
} from '../bungie-api/destiny2-api';

export const loadedAll = createAction('vendors/LOADED_ALL')<{
  characterId: string;
  vendorsResponse: LimitedDestinyVendorsResponse;
}>();

export const loadedVendorComponents = createAction('vendors/LOADED_COMPONENT')<{
  characterId: string;
  vendorResponses: [vendorHash: number, DestinyVendorResponse][];
}>();

export const loadedError = createAction('vendors/LOADED_ERROR')<{
  characterId: string;
  error: Error;
}>();

export const setShowUnacquiredOnly = createAction('vendors/SHOW_UNCOLLECTED_ONLY')<boolean>();

export function loadAllVendors(
  account: DestinyAccount,
  characterId: string,
  force = false,
): ThunkResult {
  return async (dispatch, getState) => {
    const timeSinceLastLoad =
      Date.now() - (getState().vendors.vendorsByCharacter[characterId]?.lastLoaded || 0);

    // Only load "all vendors" at most once per minute. it takes a little while to load all data.
    if (!force && timeSinceLastLoad < 60 * 1000) {
      return;
    }

    const timings = { salesTime: 0, componentsNeeded: 0, componentsFetched: 0, componentsTime: 0 };
    let start = Date.now();
    try {
      // https://github.com/Bungie-net/api/issues/1887 MAY 2024-ish: for perf reasons,
      // bungie has decided not to send back item components for the "all vendors" endpoint.
      // this request still lets us know which items are sold, by all available vendors.
      // enough to make a reasonable-looking vendors page full of shiny icons.
      const vendorsResponse = await getVendors(account, characterId);
      timings.salesTime = Date.now() - start;
      dispatch(loadedAll({ vendorsResponse, characterId }));

      const defs = manifestSelector(getState());
      // we're done if this is d1
      if (!defs?.isDestiny2) {
        return;
      }

      // we'll trickle in responses if this is initiated from the vendors page.
      // otherwise, we'll collect all the itemComponents and inject them as one,
      // preventing optimization recalc spam
      const isVendorsPage = window.location.pathname.includes('/vendors');

      // hashes of vendors bungie explicitly recommends displaying
      const topLevelVendors =
        vendorsResponse.vendorGroups.data?.groups.flatMap((g) => g.vendorHashes) ?? [];
      // vendors bungie recommends, plus their supporting subscreen vendors.
      const displayVendors = getSubvendorHashes(topLevelVendors, defs);

      // after getting all items for sale above, we'll do subsequent API fetches to
      // fill in item details. but only some vendors, filtered here, need this.
      // many vendors can be built from just their definition and live item list
      const vendorsNeedingComponents = filterMap(
        Object.entries(vendorsResponse.sales.data!),
        ([vendorHashKey, sales]) => {
          const vendorHash = Number(vendorHashKey);
          // if it's not one of the vendors the api says to include on the vendors page,
          // we don't need its stats. right now this mainly serves to exclude yuna
          if (!displayVendors.includes(vendorHash)) {
            return;
          }
          // if we find an item that needs components, include this vendor
          for (const { itemHash } of Object.values(sales.saleItems)) {
            if (itemNeedsComponents(defs, itemHash)) {
              return vendorHash;
            }
          }
        },
      );
      timings.componentsNeeded = vendorsNeedingComponents.length;

      const { collapsedSections } = settingsSelector(getState());

      // decide the order of the single-vendor requests (false is earlier in sort than true)
      vendorsNeedingComponents.sort(
        chainComparator(
          // prioritize vendors in groups (meaning top-level, not click-in sub-vendors)
          compareBy((h) => !defs.Vendor.getOptional(h)?.groups.length),
          // deprioritize vendors whose sections are collapsed on the vendors page
          compareBy((h) => Boolean(collapsedSections[`d2vendor-${h}`])),
          // sort by their position on the page
          compareBy((h) => displayVendors.indexOf(h)),
        ),
      );

      const vendorResponses: [vendorHash: number, DestinyVendorResponse][] = [];
      const promises: Promise<void>[] = [];
      for (const vendorHash of vendorsNeedingComponents) {
        promises.push(
          (async () => {
            try {
              start = Date.now();
              const vendorResponse = await getVendorSaleComponents(
                account,
                characterId,
                vendorHash,
              );
              timings.componentsTime += Date.now() - start;
              timings.componentsFetched++;
              if (isVendorsPage) {
                dispatch(
                  loadedVendorComponents({
                    vendorResponses: [[vendorHash, vendorResponse]],
                    characterId,
                  }),
                );
              } else {
                vendorResponses.push([vendorHash, vendorResponse]);
              }
            } catch {
              // TO-DO: what to do here if a single vendor component call fails?
              // not necessarily knock the overall vendors state into error mode.
              // maybe retry failed single-vendors later? add them to a new list in vendors state?
            }
          })(),
        );
      }
      await Promise.all(promises);
      if (!isVendorsPage) {
        dispatch(loadedVendorComponents({ vendorResponses, characterId }));
      }
    } catch (e) {
      // this would catch a failure of getVendors. the single-vendors are caught above
      const error = convertToError(e);
      dispatch(loadedError({ characterId, error }));
    } finally {
      infoLog(
        'Vendors',
        [
          `sales data loaded: ${timings.salesTime / 1000}s`,
          `component data for ${timings.componentsFetched} vendors loaded: ${timings.componentsTime / 1000}s`,
          timings.componentsFetched === timings.componentsNeeded
            ? 0
            : `${timings.componentsNeeded - timings.componentsFetched} components not loaded?`,
        ]
          .filter(Boolean)
          .join(' / '),
      );
    }
  };
}

function itemNeedsComponents(defs: D2ManifestDefinitions, itemHash: number) {
  const item = defs.InventoryItem.getOptional(itemHash);
  return (
    item &&
    // probably just need this for weapon perks and armor stats?
    (item.itemType === DestinyItemType.Armor ||
      // exotic weapons can be built from defs
      (item.itemType === DestinyItemType.Weapon && item.inventory!.tierType !== TierType.Exotic))
  );
}

// a subvendor is a secondary screen with its own "sales", including
// - menus for purchasing subclass abilites/fragments
// - engram content previews
// - engram focusing options
// structurally, a subvendor looks like a saleitem of the main vendor,
// but the item def refers to a previewVendorHash, a vendor def in its own right
/** given vendor hashes, recursively accumulates those plus any subvendor hashes */
function getSubvendorHashes(
  vendorHashes: number[],
  defs: D2ManifestDefinitions,
  accumulator: number[] = Array.from(vendorHashes),
) {
  for (const vendorHash of vendorHashes) {
    const newEntries: number[] = [];

    const itemList = defs.Vendor.getOptional(vendorHash)?.itemList ?? [];
    for (const i of itemList) {
      // premature overoptimization: obviously it's not a subvendor if you can buy it
      if (!i.currencies?.length) {
        const subvendorHash = defs.InventoryItem.getOptional(i.itemHash)?.preview
          ?.previewVendorHash;
        if (
          subvendorHash &&
          !newEntries.includes(subvendorHash) &&
          !accumulator.includes(subvendorHash)
        ) {
          newEntries.push(subvendorHash);
        }
      }
    }
    accumulator.push(...newEntries);
    if (newEntries.length) {
      getSubvendorHashes(newEntries, defs, accumulator);
    }
  }

  return accumulator;
}
