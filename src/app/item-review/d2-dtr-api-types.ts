import { DtrReviewer } from "./dtr-api-types";
import { DestinyActivityModeType } from "bungie-api-ts/destiny2";

export interface DtrBasicItem {
  referenceId: number;
  instanceId?: string;
  attachedMods?: number[];
  selectedPerks?: number[];
}

export interface DtrVote {
  upvotes: number;
  downvotes: number;
  total: number;
  score: number;
}

export interface DtrItemFetchRequest {
  referenceId: number;
}

export interface DtrItemFetchResponse extends DtrBasicItem {
  votes: DtrVote;
}

export interface WorkingD2Rating {
  voted: number;
  pros: string;
  cons: string;
  text: string;
  mode: number;

  treatAsSubmitted: boolean;
}

export interface DimUserReview extends DtrItemFetchResponse {
  reviewer: DtrReviewer;
  voted: number;
  pros: string;
  cons: string;
  text: string;
}

export interface DtrUserReview extends DimUserReview {
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
  isIgnored?: boolean;
  selectedPerks: number[];
  attachedMods: number[];
  mode: DtrActivityModes;
  sandbox: number; // sandbox season (1 was the first, 2 is the March 2018 "go fast" update)
}

export interface DtrItemReviewsResponse extends DtrItemFetchResponse {
  totalReviews: number;
  reviews: DtrUserReview[];
}

export interface D2CachedItem {
  referenceId: number;
  fetchResponse: DtrItemFetchResponse;
  reviewsResponse?: DtrItemReviewsResponse;
  userReview?: WorkingD2Rating;

  dimScore: number;
  lastUpdated: Date;
}

export enum DtrActivityModes {
  notSpecified = DestinyActivityModeType.None,
  playerVersusEnemy = DestinyActivityModeType.AllPvE,
  playerVersusPlayer = DestinyActivityModeType.AllPvP,
  raid = DestinyActivityModeType.Raid,
  trials = DestinyActivityModeType.TrialsOfTheNine
}
