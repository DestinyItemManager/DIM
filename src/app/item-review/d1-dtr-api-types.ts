import { DimWorkingUserReview, DimUserReview, DtrReviewer } from './dtr-api-types';

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

  lastUpdated: Date;
}

/** A single user's review for a D1 weapon. */
export interface ActualD1ItemUserReview {
  /**
   * Is this reviewer a featured reviewer?
   * Broken in D2.
   */
  isHighlighted: boolean;
  /**
   * Was this review written by the DIM user that requested the reviews?
   * Broken in D2.
   */
  isReviewer: boolean;
  /**
   * Pros.
   * Shouldn't be present (yet).
   */
  pros: string;
  /**
   * Cons.
   * shouldn't be present (yet).
   */
  cons: string;
  /** The DTR review ID. */
  reviewId: string;
  /** Who reviewed it? */
  reviewer: DtrReviewer;
  /** Timestamp associated with the review. */
  timestamp: string;
  /** What perks did the user have selected when they made the review? */
  selectedPerks?: string;
  /** What rating did they give it (1-5)? */
  rating: number;
  /** Text (optionally) associated with the review. */
  review: string;
  /** The roll that the user had on their weapon. */
  roll: string | null;
}

/**
 * The DTR item reviews response.
 * For our purposes, we mostly care that it's a collection of user reviews.
 */
export interface ActualD1ItemReviewResponse {
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
  reviews: ActualD1ItemUserReview[];
}
