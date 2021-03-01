import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { showNotification } from 'app/notifications/notifications';
import { getItemDamageShortName } from 'app/utils/item-utils';
import { ActionType, getType, Reducer } from 'typesafe-actions';
import * as actions from './actions';

export interface CompareSession {
  /**
   * An itemCategoryHash must be provided in order to limit the type of items which can be compared.
   */
  readonly itemCategoryHash: number;
  /**
   * The query further filters the items to be shown.
   */
  readonly query: string;

  /**
   * The instance ID of the first item added to compare, so we can highlight it.
   */
  readonly initialItemId?: string;

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
  action: CompareAction
) => {
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
          query: action.payload,
        },
      };
    }

    case getType(actions.compareFilteredItems):
      return compareFilteredItems(state, action.payload.query, action.payload.filteredItems);

    default:
      return state;
  }
};

// TODO: this may need to be a thunk
// TODO: better query editing tools
// TODO: extract some of this into shared functions w/ the compare screen?
// TODO: some way to just compare that one item? shift-click? highlight the original item?
function addCompareItem(state: CompareState, item: DimItem): CompareState {
  if (state.session) {
    // Add to an existing session

    // Validate that item category matches what we have open
    if (!item.itemCategoryHashes.includes(state.session.itemCategoryHash)) {
      // TODO: throw error instead?
      showNotification({
        type: 'warning',
        title: item.name,
        // TODO: better warning, use item category!
        body: t('Compare.Error.Archetype', { type: item.typeName }),
      });
      return state;
    }

    const itemQuery = `or id:${item.id}`;
    const query = state.session?.query || '';

    // Don't just keep adding them
    if (query.includes(itemQuery)) {
      return state;
    }
    const removeQuery = `-id:${item.id}`;

    const newQuery = (query.includes(removeQuery)
      ? query.replace(removeQuery, '')
      : `${query} ${itemQuery}`.replace(/\s+/, ' ')
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
    // TODO: OK we might need a thunk so we can make decisions based on manifest state
    //       For now just assume the last category is the most specific?
    const itemCategoryHash = item.itemCategoryHashes[item.itemCategoryHashes.length - 1];

    const itemNameQuery = item.bucket.inWeapons
      ? `name:"${item.name}"`
      : item.bucket.inArmor
      ? // TODO: bring back the much more complicated armor dupes logic?
        item.element
        ? `(name:"${item.name}" is:${getItemDamageShortName(item)})`
        : `name:"${item.name}"`
      : undefined;
    if (!itemNameQuery) {
      throw new Error('Programmer error: Compare only supports weapons and armor');
    }

    return {
      ...state,
      session: {
        query: itemNameQuery,
        itemCategoryHash,
        initialItemId: item.id,
      },
    };
  }
}

function removeCompareItem(state: CompareState, item: DimItem): CompareState {
  if (!state.session) {
    throw new Error("Programmer error: Can't remove item with no session");
  }

  const addedQuery = `or id:${item.id}`;
  const newQuery = (state.session.query.includes(addedQuery)
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
  filteredItems: DimItem[]
): CompareState {
  // TODO: what if it's already open?

  // TODO: OK we might need a thunk so we can make decisions based on manifest state
  //       For now just assume the last category is the most specific?
  const itemCategoryHash =
    filteredItems[0].itemCategoryHashes[filteredItems[0].itemCategoryHashes.length - 1];

  return {
    ...state,
    session: {
      query: query,
      itemCategoryHash,
    },
  };
}

// TODO: observe state and reflect in URL params?
