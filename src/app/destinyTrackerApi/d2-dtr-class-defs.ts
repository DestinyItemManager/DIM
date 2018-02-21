export interface DtrVote {
  upvotes: number;
  downvotes: number;
  total: number;
  score: number;
}

export interface DtrItem {
  referenceId: number;
  instanceId?: string;
  attachedMods?: any[];
  selectedPerks?: any[];
}

export interface DtrItemWithVotes extends DtrItem {
  votes?: DtrVote;
}

export interface DtrReviewRequest extends DtrItem {
  selectedPerks?: number[];
}

export interface DtrReviewer {
  membershipType: number;
  membershipId: number;
  displayName: string;
}

export interface DtrUserReviewRequest extends DtrItem {
  reviewer: DtrReviewer;
  voted: number;
  pros: string;
  cons: string;
  text: string;
}

export interface DtrUserReviewResponse extends DtrUserReviewRequest {
  id: string;
  timestamp: Date;
  isReviewer: boolean;
  isHighlighted: boolean;
  instanceId?: string;
}

export interface DtrReviewResponse extends DtrItem {
  votes?: DtrVote;
  totalReviews: number;
  reviews: DtrUserReviewResponse[];
}
export interface DtrReviewReport {
  reviewId: string;
  reporter: DtrReviewer;
  text: string;
}
