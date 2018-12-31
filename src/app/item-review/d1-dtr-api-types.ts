import { DimWorkingUserReview, DtrRating, DimUserReview } from './dtr-api-types';

/**
 * A fetch request for a single weapon. Expected to be part of a bulk (array) fetch request.
 */
export interface D1ItemFetchRequest {
  /** Reference ID for the weapon. */
  referenceId: string;
  /**
   * The roll (available perks).
   * Note that we only send random perks, so exotics, some raid weapons and other weapons don't pass this.
   */
  roll: string | null;
}

/** Bulk fetch response for a single weapon. */
export interface D1ItemFetchResponse {
  /** Reference ID for the weapon. */
  referenceId: string;
  /**
   * The roll (available perks).
   * Note that we only send random perks, so exotics, some raid weapons and other weapons don't pass this.
   */
  roll: string | null;
  /** The rating from DTR. We use this. */
  rating?: number;
  /** The number of ratings that DTR has for the weapon (roll). */
  ratingCount: number;
  /** The number of highlighted ratings that DTR has for the weapon (roll). */
  highlightedRatingCount: number;
}

/** A request for reviews for a single weapon. */
export interface D1ItemReviewRequest {
  /** Reference ID for the weapon. */
  referenceId: string;
  /**
   * The roll (available perks).
   * Note that we only send random perks, so exotics, some raid weapons and other weapons don't pass this.
   */
  roll: string | null;
  /** What perks does the user have selected on it? */
  selectedPerks: string | null;
  /** What's the particular instance ID of the weapon? */
  instanceId: string;
}

/** The local user's working rating. */
export interface WorkingD1Rating extends DimWorkingUserReview {
  /**
   * What's the weapon's rating?
   * In D1, ratings are on a scale of 1-5.
   */
  rating: number;
  /** Text for the review.
   * Optional.
   */
  review: string;
}

/** A single user's review for a D1 weapon. */
export interface D1ItemUserReview extends DimUserReview {
  /** What perks did the user have selected when they made the review? */
  selectedPerks?: string;
  /** What rating did they give it (1-5)? */
  rating: number;
  /** Text (optionally) associated with the review. */
  review?: string;
  /** The roll that the user had on their review. */
  roll: string | null;
}

/**
 * The DTR item reviews response.
 * For our purposes, we mostly care that it's a collection of user reviews.
 */
export interface D1ItemReviewResponse {
  // TODO: does it have an ID?

  /** Reference ID for the weapon. */
  referenceId: string;
  /**
   * The roll (available perks).
   * Note that we only send random perks, so exotics, some raid weapons and other weapons don't pass this.
   */
  roll: string | null;
  /** The rating from DTR. We use this. */
  rating?: number;
  /** The number of ratings that DTR has for the weapon (roll). */
  ratingCount: number;
  /** The number of highlighted ratings that DTR has for the weapon (roll). */
  highlightedRatingCount: number;
  reviews: D1ItemUserReview[];
}

/**
 * Rating + review + working user data.
 * Contains keys for lookups, response data from the API and user's local working review data (if they make any changes).
 */
export interface D1RatingData extends DtrRating {
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
