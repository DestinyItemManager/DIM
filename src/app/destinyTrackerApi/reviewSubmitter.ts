import { DestinyAccount } from '../accounts/destiny-account';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2SubmitErrors } from './d2-trackerErrorHandler';
import { DimItem } from '../inventory/item-types';
import { dtrFetch, dtrD2ReviewsEndpoint } from './dtr-service-helper';
import { WorkingD2Rating } from '../item-review/d2-dtr-api-types';
import { getRollAndPerks as getRollAndPerksD2 } from './d2-itemTransformer';
import { getItemReviewsKey } from '../item-review/reducer';
import { markReviewSubmitted, purgeCachedReview } from '../item-review/actions';
import { ThunkResult } from 'app/store/types';
import { handleSubmitErrors } from './trackerErrorHandler';
import { WorkingD1Rating } from '../item-review/d1-dtr-api-types';
import { getRollAndPerks as getRollAndPerksD1 } from './itemTransformer';
import { delay } from 'app/utils/util';

/** Submit a user review for an item. This should be dispatched as a Redux action. */
export function submitReview(
  item: DimItem,
  membershipInfo?: DestinyAccount,
  userReview?: WorkingD2Rating | WorkingD1Rating
): ThunkResult<WorkingD2Rating | WorkingD1Rating | undefined> {
  return async (dispatch) => {
    if (!userReview) {
      return;
    }

    await submitReviewPromise(item, membershipInfo, userReview);

    dispatch(
      markReviewSubmitted({
        key: getItemReviewsKey(item),
      })
    );

    dispatch(eventuallyPurgeCachedData(item));
    return userReview;
  };
}

function submitReviewPromise(
  item: DimItem,
  membershipInfo: DestinyAccount | undefined,
  userReview: WorkingD2Rating | WorkingD1Rating
) {
  if (!membershipInfo) {
    return;
  }

  const rollAndPerks = item.isDestiny2()
    ? getRollAndPerksD2(item)
    : item.isDestiny1()
    ? getRollAndPerksD1(item)
    : {};

  const reviewer = {
    membershipId: membershipInfo.membershipId,
    membershipType: membershipInfo.originalPlatformType,
    displayName: membershipInfo.displayName,
  };

  const review = isD2UserReview(item, userReview)
    ? {
        voted: userReview.voted,
        text: userReview.text,
        pros: userReview.pros,
        cons: userReview.cons,
        mode: userReview.mode,
      }
    : {
        rating: userReview.rating,
        review: userReview.review,
        pros: userReview.pros,
        cons: userReview.cons,
      };

  const rating = { ...rollAndPerks, ...review, reviewer };

  const promise = item.isDestiny2()
    ? dtrFetch(`${dtrD2ReviewsEndpoint}/submit`, rating).then(
        handleD2SubmitErrors,
        handleD2SubmitErrors
      )
    : dtrFetch(
        'https://reviews-api.destinytracker.net/api/weaponChecker/reviews/submit',
        rating
      ).then(handleSubmitErrors, handleSubmitErrors);

  loadingTracker.addPromise(promise);

  return promise;
}

/**
 * There's a 10 minute delay between posting an item review to the DTR API
 * and being able to fetch that review from it.
 * To prevent angry bug reports, we'll continue to hang on to local user review data for
 * 10 minutes, then we'll purge it (so that it can be re-pulled).
 *
 * Item is just an item from DIM's stores.
 */
function eventuallyPurgeCachedData(item: DimItem): ThunkResult {
  const tenMinutes = 1000 * 60 * 10;
  return async (dispatch) => {
    await delay(tenMinutes);
    dispatch(purgeCachedReview({ key: getItemReviewsKey(item) }));
  };
}

export function isD1UserReview(
  item: DimItem,
  _review: WorkingD2Rating | WorkingD1Rating
): _review is WorkingD1Rating {
  return item.isDestiny1();
}

export function isD2UserReview(
  item: DimItem,
  _review: WorkingD2Rating | WorkingD1Rating
): _review is WorkingD2Rating {
  return item.isDestiny2();
}
