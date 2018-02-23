export interface DtrVote {
  upvotes: number;
  downvotes: number;
  total: number;
  score: number;
}

export interface DtrItem {
  referenceId: number;
  instanceId?: string;
  attachedMods?: any[] | null;
  selectedPerks?: any[] | null;
}

export interface DtrBulkItem extends DtrItem {
  votes: DtrVote;
}

export interface Reviewer {
  membershipType: number;
  membershipId: string;
  displayName: string;
}

export interface DimUserReview extends DtrBulkItem {
  reviewer: Reviewer;
  voted: number;
  pros: string;
  cons: string;
  text: string;
}

export interface DtrUserReview {
  id: string;
  timestamp: Date;
  isReviewer: boolean;
  isHighlighted: boolean;
  instanceId?: string;
  reviewer: Reviewer;
  voted: number;
  pros: string;
  cons: string;
  text: string;
  isIgnored?: boolean;
  selectedPerks: number[];
  attachedMods: number[];
}

export interface DtrReviewContainer extends DtrBulkItem {
  totalReviews: number;
  reviews: DtrUserReview[];
}

export interface DimWorkingUserReview extends DtrReviewContainer {
  userVote: number;
  rating: number;
  userRating: number;
  reviewsDataFetched: boolean;
  highlightedRatingCount: number;
  review: string;
  pros: string;
  cons: string;
  votes: DtrVote;
  voted: number;
  text: string;
}

export interface DimReviewReport {
  reviewId: string;
  reporter: Reviewer;
  text: string;
}
