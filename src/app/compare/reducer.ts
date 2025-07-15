import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { showNotification } from 'app/notifications/notifications';
import { getSelectionTree } from 'app/organizer/ItemTypeSelector';
import { quoteFilterString } from 'app/search/query-parser';
import { getInterestingSocketMetadatas, isD1Item } from 'app/utils/item-utils';
import { ItemCategoryHashes, PlugCategoryHashes } from 'data/d2/generated-enums';
import { ActionType, Reducer, getType } from 'typesafe-actions';
import * as actions from './actions';
import { compareNameQuery } from './compare-utils';

export interface CompareSession {
  /**
   * A list of itemCategoryHashes must be provided in order to limit the type of items which can be compared.
   * This list should match the item category drill-down from Organizer's ItemTypeSelector.
   */
  readonly itemCategoryHashes: ItemCategoryHashes[];
  /**
   * The query further filters the items to be shown. Since this query is modified
   * when adding or removing items, external queries must be parenthesized first
   * to avoid modifications binding to single filters within the original query.
   */
  readonly query: string;

  /**
   * The instance ID of the first item added to compare, so we can highlight it.
   */
  readonly initialItemId?: string;

  /**
   * The ID of the character (if any) whose vendor response we should intermingle with owned items
   */
  readonly vendorCharacterId?: string;

  // TODO: Query history to offer back/forward navigation within compare sessions?
}

export interface CompareState {
  /**
   * This is set if the compare screen is shown. It contains the minimal state required to show the compare screen.
   * This is in Redux because it can be manipulated from all over the app.
   */
  readonly session?: CompareSession;
}

export type CompareAction = ActionType<typeof actions>;

const initialState: CompareState = {};

// TODO: how to determine the itemCategory? reverse index of organizer leaves?
export const compare: Reducer<CompareState, CompareAction> = (
  state: CompareState = initialState,
  action: CompareAction,
): CompareState => {
  switch (action.type) {
    case getType(actions.addCompareItem):
      return addCompareItem(state, action.payload);

    case getType(actions.removeCompareItem):
      return removeCompareItem(state, action.payload);

    case getType(actions.endCompareSession):
      return {
        ...state,
        session: undefined,
      };

    case getType(actions.updateCompareQuery): {
      if (!state.session) {
        throw new Error("Programmer error: Can't update query with no session");
      }
      return {
        ...state,
        session: {
          ...state.session,
          query: action.payload ? `(${action.payload})` : '',
        },
      };
    }

    case getType(actions.compareFilteredItems):
      return compareFilteredItems(
        state,
        action.payload.query,
        action.payload.filteredItems,
        action.payload.initialItem,
      );

    case getType(actions.compareSelectedItems):
      return compareSelectedItems(state, action.payload);

    default:
      return state;
  }
};

// TODO: better query editing tools
// TODO: extract some of this into shared functions w/ the compare screen?
// TODO: some way to just compare that one item? shift-click? highlight the original item?
function addCompareItem(state: CompareState, item: DimItem): CompareState {
  if (state.session) {
    // Add to an existing session

    // Validate that item category matches what we have open
    if (!state.session.itemCategoryHashes.every((h) => item.itemCategoryHashes.includes(h))) {
      // TODO: throw error instead?
      showNotification({
        type: 'warning',
        title: item.name,
        body: t('Compare.Error.Unmatched'),
      });
      return state;
    }

    const itemQuery = `id:${item.id} or`;
    const query = state.session?.query || '';

    // Don't just keep adding them
    if (query.includes(itemQuery)) {
      return state;
    }
    const removeQuery = `-id:${item.id}`;

    // Add `or` item filter to the left to avoid mixing it with
    // `implicit_and` filters from item removal (see `removeCompareItem`).
    const newQuery = (
      query.includes(removeQuery)
        ? query.replace(removeQuery, '')
        : `${itemQuery} ${query}`.replace(/\s+/, ' ')
    ).trim();

    return {
      ...state,
      session: {
        ...state.session,
        query: newQuery,
      },
    };
  } else {
    // Start a new session
    const itemCategoryHashes = getItemCategoryHashesFromExampleItem(item);

    const itemNameQuery = initialCompareQuery(item);

    const vendorCharacterId = item.vendor?.characterId;

    return {
      ...state,
      session: {
        query: `(${itemNameQuery})`,
        itemCategoryHashes,
        initialItemId: item.id,
        vendorCharacterId,
      },
    };
  }
}

function initialCompareQuery(item: DimItem) {
  if (isD1Item(item) || !item.bucket.inArmor || item.isExotic) {
    // D1 items, weapons, and exotic armor match by name
    return compareNameQuery(item);
  } else {
    // For D2 armor, we match by rarity, intrinsic and interesting mod sockets
    const factors = [`is:${item.rarity.toLowerCase()}`];
    const intrinsicSocket = item.sockets?.allSockets.find(
      (socket) =>
        socket.plugged?.plugDef.plug.plugCategoryHash === PlugCategoryHashes.Intrinsics &&
        socket.plugged.plugDef.displayProperties.name,
    );
    if (intrinsicSocket) {
      const intrinsicName = intrinsicSocket.plugged!.plugDef.displayProperties.name;
      factors.push(`exactperk:${quoteFilterString(intrinsicName)}`);
    }
    const modSlotMetadata = getInterestingSocketMetadatas(item);
    if (modSlotMetadata) {
      for (const m of modSlotMetadata) {
        factors.push(`modslot:${m.slotTag}`);
      }
    }
    return factors.join(' ');
  }
}

function removeCompareItem(state: CompareState, item: DimItem): CompareState {
  if (!state.session) {
    throw new Error("Programmer error: Can't remove item with no session");
  }

  // Add `-id` filter to the right to avoid mixing it with
  // `or` filters from item addition (see `addCompareItem`).
  const addedQuery = `id:${item.id} or`;
  const newQuery = (
    state.session.query.includes(addedQuery)
      ? state.session.query.replace(addedQuery, '')
      : `${state.session.query} -id:${item.id}`
  )
    .replace(/\s+/, ' ')
    .trim();

  return {
    ...state,
    session: {
      ...state.session,
      query: newQuery,
    },
  };
}

function compareFilteredItems(
  state: CompareState,
  query: string,
  filteredItems: DimItem[],
  /** The first item added to compare, so we can highlight it. */
  initialItem: DimItem | undefined,
): CompareState {
  if (state.session) {
    return state;
  }

  const itemCategoryHashes = getItemCategoryHashesFromExampleItem(filteredItems[0]);

  return {
    ...state,
    session: {
      query: query,
      itemCategoryHashes,
      initialItemId: initialItem?.id,
      vendorCharacterId: initialItem?.vendor?.characterId,
    },
  };
}

function compareSelectedItems(state: CompareState, items: DimItem[]) {
  if (state.session || !items.length) {
    return state;
  }

  const itemCategoryHashes = getItemCategoryHashesFromExampleItem(items[0]);
  const itemIds = items.map((i) => `id:${i.id}`);
  return {
    ...state,
    session: {
      query: `(${itemIds.join(' or ')})`,
      itemCategoryHashes,
    },
  };
}

function getItemCategoryHashesFromExampleItem(item: DimItem) {
  // This isn't right for armor
  // TODO: OK we might need a thunk so we can make decisions based on manifest state
  //       For now just assume the last category is the most specific?

  const itemSelectionTree = getSelectionTree(item.destinyVersion);

  const hashes: number[] = [];

  // Dive two layers down (weapons/armor => type)
  for (const node of itemSelectionTree.subCategories!) {
    if (node.itemCategoryHash && item.itemCategoryHashes.includes(node.itemCategoryHash)) {
      hashes.push(node.itemCategoryHash);
      if (node.subCategories) {
        for (const subNode of node.subCategories) {
          if (
            subNode.itemCategoryHash &&
            item.itemCategoryHashes.includes(subNode.itemCategoryHash)
          ) {
            hashes.push(subNode.itemCategoryHash);
            break;
          }
        }
      }
      break;
    }
  }

  if (hashes.length === 0) {
    hashes.push(item.itemCategoryHashes[0]);
  }

  return hashes;
}

// TODO: observe state and reflect in URL params?
