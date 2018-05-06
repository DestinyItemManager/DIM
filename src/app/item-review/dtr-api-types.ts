export interface DtrReviewer {
  membershipType: number;
  membershipId: string;
  displayName: string;
}

export interface DimUserReview {
  isIgnored?: boolean;
}

export interface DimWorkingUserReview {
  // dealing with the 10 minute lag time between submittal and remote cache invalidation
  treatAsSubmitted: boolean;
}

export interface DimDtrCachedItem {
  overallScore: number;
  ratingCount: number;
  highlightedRatingCount: number;

  userReview: DimWorkingUserReview;
}
