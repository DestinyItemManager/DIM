import { observeStore } from 'app/utils/redux-utils';
import _ from 'lodash';
import { ReviewsState } from './reducer';
import { ITEM_RATING_EXPIRATION } from 'app/destinyTrackerApi/d2-itemListBuilder';
import { set } from 'idb-keyval';

export function saveReviewsToIndexedDB() {
  return observeStore(
    (state) => state.reviews,
    _.debounce((currentState: ReviewsState, nextState: ReviewsState) => {
      if (nextState.loadedFromIDB) {
        const cutoff = new Date(Date.now() - ITEM_RATING_EXPIRATION);

        if (!_.isEmpty(nextState.reviews) && nextState.reviews !== currentState.reviews) {
          set(
            'reviews',
            _.pickBy(nextState.reviews, (r) => r.lastUpdated > cutoff)
          );
        }
        if (!_.isEmpty(nextState.ratings) && nextState.ratings !== currentState.ratings) {
          set(
            'ratings-v2',
            _.pickBy(nextState.ratings, (r) => r.lastUpdated > cutoff)
          );
        }
      }
    }, 1000)
  );
}
