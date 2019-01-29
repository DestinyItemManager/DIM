export interface DtrPlatformOption {
  platform: number;
  description: string;
}

export const reviewPlatformOptions: DtrPlatformOption[] = [
  {
    platform: 0,
    description: 'DtrReview.Platforms.All' // t('DtrReview.Platforms.All')
  },
  {
    platform: 1,
    description: 'DtrReview.Platforms.Xbox' // t('DtrReview.Platforms.Xbox')
  },
  {
    platform: 2,
    description: 'DtrReview.Platforms.Playstation' // t('DtrReview.Platforms.Playstation')
  },
  {
    platform: 3,
    description: 'DtrReview.Platforms.AllConsoles' // t('DtrReview.Platforms.AllConsoles')
  },
  {
    platform: 4,
    description: 'DtrReview.Platforms.Pc' // t('DtrReview.Platforms.Pc')
  }
];
