import { DtrReviewPlatform } from '@destinyitemmanager/dim-api-types';

export interface DtrPlatformOption {
  platform: DtrReviewPlatform;
  description: string;
}

export const reviewPlatformOptions: DtrPlatformOption[] = [
  {
    platform: DtrReviewPlatform.All,
    description: 'DtrReview.Platforms.All' // t('DtrReview.Platforms.All')
  },
  {
    platform: DtrReviewPlatform.Xbox,
    description: 'DtrReview.Platforms.Xbox' // t('DtrReview.Platforms.Xbox')
  },
  {
    platform: DtrReviewPlatform.Playstation,
    description: 'DtrReview.Platforms.Playstation' // t('DtrReview.Platforms.Playstation')
  },
  {
    platform: DtrReviewPlatform.AllConsoles,
    description: 'DtrReview.Platforms.AllConsoles' // t('DtrReview.Platforms.AllConsoles')
  },
  {
    platform: DtrReviewPlatform.Pc,
    description: 'DtrReview.Platforms.Pc' // t('DtrReview.Platforms.Pc')
  }
];
