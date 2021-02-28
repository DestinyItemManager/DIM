import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { showNotification } from 'app/notifications/notifications';
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

// TODO: how to determine the category?
export const compare: Reducer<CompareState, CompareAction> = (
  state: CompareState = initialState,
  action: CompareAction
) => {
  switch (action.type) {
    case getType(actions.addCompareItem): {
      const newState = addCompareItem(state, action.payload);
      console.log('addCompareItem', newState);
      return newState;
    }

    default:
      return state;
  }
};

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
        // TODO: better warning
        body: t('Compare.Error.Archetype', { type: item.typeName }),
      });
      return state;
    }

    const itemQuery = `or id:${item.id}`;
    const query = state.session?.query || '';
    const newQuery = `${query} ${itemQuery}`.replace(/\s+/, ' ').trim();

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
      ? `name:${item.name}`
      : item.bucket.inArmor
      ? // TODO: bring back the much more complicated armor dupes logic?
        `name:${item.name}`
      : undefined;
    if (!itemNameQuery) {
      throw new Error('Programmer error: Compare only supports weapons and armor');
    }

    return {
      ...state,
      session: {
        query: itemNameQuery,
        itemCategoryHash,
      },
    };
  }
}
// TODO: observe state and reflect in URL params?
