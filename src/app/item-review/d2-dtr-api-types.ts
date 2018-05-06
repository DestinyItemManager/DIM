import { DtrReviewer, DimWorkingUserReview, DimDtrCachedItem, DimUserReview } from "./dtr-api-types";
import { DestinyActivityModeType } from "bungie-api-ts/destiny2";

export interface DtrD2BasicItem {
  referenceId: number;
  instanceId?: string;
  attachedMods?: number[];
  selectedPerks?: number[];
}

export interface DtrD2Vote {
  upvotes: number;
  downvotes: number;
  total: number;
  score: number;
}

export interface D2ItemFetchRequest {
  referenceId: number;
}

export interface D2ItemFetchResponse extends DtrD2BasicItem {
  votes: DtrD2Vote;
}

export interface WorkingD2Rating extends DimWorkingUserReview {
  voted: number;
  pros: string;
  cons: string;
  text: string;
  mode: number;
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

export enum DtrD2ActivityModes {
  notSpecified = DestinyActivityModeType.None,
  playerVersusEnemy = DestinyActivityModeType.AllPvE,
  playerVersusPlayer = DestinyActivityModeType.AllPvP,
  raid = DestinyActivityModeType.Raid,
  trials = DestinyActivityModeType.TrialsOfTheNine
}

export interface D2CachedItem extends DimDtrCachedItem {
  referenceId: number;
  fetchResponse?: D2ItemFetchResponse;
  reviewsResponse?: D2ItemReviewResponse;
  userReview: WorkingD2Rating;

  lastUpdated: Date;
}
