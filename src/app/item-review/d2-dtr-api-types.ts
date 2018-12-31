import { DimWorkingUserReview, DtrRating, DimUserReview } from './dtr-api-types';
import { DestinyActivityModeType } from 'bungie-api-ts/destiny2';

/**
 * A "basic" item.
 * Used as the building block for submitting item reviews to the DTR API.
 * Also used for internal calculations (perk rating).
 */
export interface DtrD2BasicItem {
  /** Reference ID (item hash). */
  referenceId: number;
  /** Instance ID (vaguely personally identifying). */
  instanceId?: string;
  /** What mods does the user have attached? */
  attachedMods?: number[];
  /** What perks does the user have selected? */
  selectedPerks?: number[];
  /** If it's a random roll, what's the complete list of (random) perks on it? */
  availablePerks?: number[];
}

/** The form that votes come back to us in for items in D2. */
export interface DtrD2Vote {
  /** Reference ID (hash ID). */
  referenceId: number;
  /** How many upvotes were there? */
  upvotes: number;
  /** How many downvotes were there? */
  downvotes: number;
  /** How many total votes did this item have? */
  total: number;
  /** Upvotes - downvotes. We don't use this locally. */
  score: number;
}

/**
 * The fetch request for a single item.
 * Expected to be sent as part of an array of requests in a bulk fetch.
 */
export interface D2ItemFetchRequest {
  /** Reference ID (hash ID). */
  referenceId: number;
  /** If it's a random roll, what's the complete list of (random) perks on it? */
  availablePerks?: number[];
}

/** The fetch response for a single item. */
export interface D2ItemFetchResponse {
  /** Reference ID (hash ID). */
  referenceId: number;
  /** The votes for a single item. Includes ratings with and without review text. */
  votes: DtrD2Vote;
  /** The votes that have review text along with them. */
  reviewVotes: DtrD2Vote;
  /** If it's a random roll, what's the complete list of (random) perks on it (that we sent)? */
  availablePerks?: number[];
}

/** If the user chooses to make any review moves on an item, they're stored here. */
export interface WorkingD2Rating extends DimWorkingUserReview {
  /**
   * The vote. Can be...
   * -1 (thumbs down)
   * 0 (no vote)
   * 1 (thumbs up)
   */
  voted: number;
  /**
   * Text of the review.
   * Optional.
   */
  text: string;
  /** What play mode was this review for? */
  mode: DtrD2ActivityModes;
}

/** A single user's review, contained in an item review response. */
export interface D2ItemUserReview extends DimUserReview {
  /** The instance ID for the item reviewed. */
  instanceId?: string;
  /** What was their vote? Should be -1 or 1. */
  voted: number;
  /**
   * Review text.
   * Optional to send, optional to receive.
   */
  text?: string;
  /** What perks did the user have selected on this item? */
  selectedPerks: number[];
  /** If it's a random roll, what's the complete list of (random) perks on it? */
  availablePerks?: number[];
  /** What power mods did the user have attached to this item? */
  attachedMods: number[];
  /** What play mode is this for? */
  mode: DtrD2ActivityModes;
  /**
   * Sandbox season (1 was the first, 2 is the March 2018 "go fast" update).
   * Not enumerating these values here because we're not using this and who wants to update this with a new sandbox?
   */
  sandbox: number;
}

/** A response from DTR for detailed reviews on a particular item. */
export interface D2ItemReviewResponse {
  /** Reference ID (hash ID). */
  referenceId: number;
  /** The votes for a single item. */
  votes: DtrD2Vote;
  /** The total number of reviews. */
  totalReviews: number;
  /**
   * Reviews for the item.
   * More particulars - they return a maximum of 25 text reviews per item, newest first, and we can page through them.
   * Don't tell anyone I haven't bothered building pagination out yet.
   */
  reviews: D2ItemUserReview[];
}

/** The subset of DestinyActivityModeType that we use for game modes. */
export enum DtrD2ActivityModes {
  notSpecified = DestinyActivityModeType.None,
  playerVersusEnemy = DestinyActivityModeType.AllPvE,
  playerVersusPlayer = DestinyActivityModeType.AllPvP,
  raid = DestinyActivityModeType.Raid,
  // trials = DestinyActivityModeType.TrialsOfTheNine
  gambit = DestinyActivityModeType.Gambit
}

/**
 * Rating + review + working user data.
 * Contains keys for lookups, response data from the API and user's local working review data (if they make any changes).
 */
export interface D2RatingData extends DtrRating {
  /** Reference ID (hash ID). This is all we need to look up an item for D2 (currently). */
  referenceId: number;
  /** The bulk rating fetch response (if there was one). */
  fetchResponse?: D2ItemFetchResponse;
  /** The item reviews response (if there was one). */
  reviewsResponse?: D2ItemReviewResponse;
  /** The user's local review. */
  userReview: WorkingD2Rating;
}
