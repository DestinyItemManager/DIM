import { DtrReviewPlatform } from '@destinyitemmanager/dim-api-types';
import { tl } from 'app/i18next-t';

export interface DtrPlatformOption {
  platform: DtrReviewPlatform;
  description: string;
}

export const reviewPlatformOptions: DtrPlatformOption[] = [
  {
    platform: DtrReviewPlatform.All,
    description: tl('DtrReview.Platforms.All'),
  },
  {
    platform: DtrReviewPlatform.Xbox,
    description: tl('DtrReview.Platforms.Xbox'),
  },
  {
    platform: DtrReviewPlatform.Playstation,
    description: tl('DtrReview.Platforms.Playstation'),
  },
  {
    platform: DtrReviewPlatform.AllConsoles,
    description: tl('DtrReview.Platforms.AllConsoles'),
  },
  {
    platform: DtrReviewPlatform.Pc,
    description: tl('DtrReview.Platforms.Pc'),
  },
];
