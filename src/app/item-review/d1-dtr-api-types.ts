import { DtrReviewer, DimWorkingUserReview, DimDtrCachedItem } from "./dtr-api-types";

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

export interface WorkingD1Rating extends DimWorkingUserReview {
  rating: number;
  pros: string;
  cons: string;
  review: string;
}

export interface D1ItemUserReview {
  reviewId: string; // string or number?
  reviewer: DtrReviewer;
  timestamp: string;
  selectedPerks?: string;
  isHighlighted: boolean;
  isReviewer: boolean;
  rating: number;
  pros: string;
  cons: string;
  review: string;
}

export interface D1ItemReviewResponse extends D1ItemFetchResponse {
  reviews: D1ItemUserReview[];
}

export interface D1CachedItem extends DimDtrCachedItem {
  referenceId: string;
  fetchResponse?: D1ItemFetchResponse;
  reviewsResponse?: D1ItemReviewResponse;
  userReview: WorkingD1Rating;
  roll: string | null;

  lastUpdated: Date;
}
