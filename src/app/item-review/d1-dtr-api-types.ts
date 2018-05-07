import { DtrReviewer, DimWorkingUserReview, RatingData, DimUserReview } from "./dtr-api-types";

/** A fetch request for a single weapon. Expected to be part of a bulk (array) fetch request.
 */
export interface D1ItemFetchRequest {
  /** Reference ID for the weapon. */
  referenceId: string;
  /** The roll (available perks).
   * Note that we only send random perks, so exotics, some raid weapons and other weapons don't pass this.
   */
  roll: string | null;
}

/** Bulk fetch response for a single weapon. */
export interface D1ItemFetchResponse extends D1ItemFetchRequest {
  /** The rating from DTR. We use this. */
  rating?: number;
  /** The number of ratings that DTR has for the weapon (roll). */
  ratingCount: number;
  /** The number of highlighted ratings that DTR has for the weapon (roll). */
  highlightedRatingCount: number;
}

/** A request for reviews for a single weapon. */
export interface D1ItemReviewRequest extends D1ItemFetchRequest {
  /** What perks does the user have selected on it? */
  selectedPerks: string | null;
  /** What's the particular instance ID of the weapon? */
  instanceId: string;
}

/** The local user's working rating. */
export interface WorkingD1Rating extends DimWorkingUserReview {
  /** What's the weapon's rating?
   * In D1, ratings are on a scale of 1-5.
   */
  rating: number;
  /** Pros - set aside for future use. */
  pros: string;
  /** Cons - set aside for future use. */
  cons: string;
  /** Text for the review.
   * Optional.
   */
  review: string;
}

/** A single user's review for a D1 weapon. */
export interface D1ItemUserReview extends DimUserReview {
  /** The DTR review ID. */
  reviewId: string;
  /** Who reviewed it? */
  reviewer: DtrReviewer;
  /** Timestamp associated with the review. */
  timestamp: string;
  /** What perks did the user have selected when they made the review? */
  selectedPerks?: string;
  /** Is this reviewer a featured reviewer? */
  isHighlighted: boolean;
  /** Was this review written by the DIM user that requested the reviews? */
  isReviewer: boolean;
  /** What rating did they give it (1-5)? */
  rating: number;
  /** Pros - shouldn't be present. */
  pros: string;
  /** Cons - shouldn't be present. */
  cons: string;
  /** Text (optionally) associated with the review. */
  review: string;
}

/** The DTR item reviews response.
 * For our purposes, we mostly care that it's a collection of user reviews.
 */
export interface D1ItemReviewResponse extends D1ItemFetchResponse {
  reviews: D1ItemUserReview[];
}

/** Cached rating/review data.
 * Contains keys for lookups, response data from the API and user's local working review data (if they make any changes).
 */
export interface D1RatingData extends RatingData {
  /** Reference ID (weapon hash ID). */
  referenceId: string;
  /** The roll (perk hashes in the form that DTR expects). */
  roll: string | null;
  /** The bulk rating fetch response (if there was one). */
  fetchResponse?: D1ItemFetchResponse;
  /** The item reviews response (if there was one). */
  reviewsResponse?: D1ItemReviewResponse;
  /** The user's local review. */
  userReview: WorkingD1Rating;
}
