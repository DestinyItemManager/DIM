import { DtrReviewer } from "./dtr-api-types";

export interface D1ItemFetchRequest {
  referenceId: string;
  roll: string | null;
}

export interface D1ItemFetchResponse extends D1ItemFetchRequest {
  rating?: number;
  ratingCount: number;
  highlightedRatingCount: number;
}

export interface D1ItemReviewRequest extends D1ItemFetchRequest {
  selectedPerks: string | null;
  instanceId: string;
}

export interface D1ItemWorkingUserReview {
  rating?: number;
  pros: string;
  cons: string;
  review: string;
}

export interface D1ItemUserReview extends D1ItemWorkingUserReview {
  reviewId: string; // string or number?
  reviewer: DtrReviewer;
  timestamp: string;
  selectedPerks?: string;
  isHighlighted: boolean;
  isReviewer: boolean;
}

export interface D1ItemReviewResponse extends D1ItemFetchResponse {
  reviews: D1ItemUserReview[];
}
