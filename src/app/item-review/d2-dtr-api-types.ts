import { DtrReviewer, DimWorkingUserReview, RatingData, DimUserReview } from "./dtr-api-types";
import { DestinyActivityModeType } from "bungie-api-ts/destiny2";

/** A "basic" item.
 * Used as the building block for submitting item reviews to the DTR API.
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
}

/** The form that votes come back to us in for items in D2. */
export interface DtrD2Vote extends D2ItemFetchRequest {
  /** How many upvotes were there? */
  upvotes: number;
  /** How many downvotes were there? */
  downvotes: number;
  /** How many total votes did this item have? */
  total: number;
  /** Upvotes - downvotes. We don't use this locally. */
  score: number;
}

/** The fetch request for a single item.
 * Expected to be sent as part of an array of requests in a bulk fetch.
 */
export interface D2ItemFetchRequest {
  /** Reference ID (hash ID). */
  referenceId: number;
}

/** The fetch response for a single item. */
export interface D2ItemFetchResponse extends D2ItemFetchRequest {
  /** The votes for a single item. */
  votes: DtrD2Vote;
}

/** If the user chooses to make any review moves on an item, they're stored here. */
export interface WorkingD2Rating extends DimWorkingUserReview {
  /** The vote. Can be...
   * -1 (thumbs down)
   * 0 (no vote)
   * 1 (thumbs up)
   */
  voted: number;
  /** Pros - reserved for future use. */
  pros: string;
  /** Cons - reserved for future use. */
  cons: string;
  /** Text of the review.
   * Optional.
   */
  text: string;
  /** What play mode was this review for?
   */
  mode: DtrD2ActivityModes;
}

export interface D2ItemUserReview extends DimUserReview {
  id: string;
  timestamp: Date;
  isReviewer: boolean;
  isHighlighted: boolean;
  instanceId?: string;
  reviewer: DtrReviewer;
  voted: number;
  pros: string;
  cons: string;
  text: string;
  selectedPerks: number[];
  attachedMods: number[];
  mode: DtrD2ActivityModes;
  sandbox: number; // sandbox season (1 was the first, 2 is the March 2018 "go fast" update)
}

export interface D2ItemReviewResponse extends D2ItemFetchResponse {
  totalReviews: number;
  reviews: D2ItemUserReview[];
}

/** The subset of DestinyActivityModeType that we use for game modes. */
export enum DtrD2ActivityModes {
  notSpecified = DestinyActivityModeType.None,
  playerVersusEnemy = DestinyActivityModeType.AllPvE,
  playerVersusPlayer = DestinyActivityModeType.AllPvP,
  raid = DestinyActivityModeType.Raid,
  trials = DestinyActivityModeType.TrialsOfTheNine
}

export interface D2RatingData extends RatingData {
  referenceId: number;
  fetchResponse?: D2ItemFetchResponse;
  reviewsResponse?: D2ItemReviewResponse;
  userReview: WorkingD2Rating;
}
