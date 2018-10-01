export interface DtrPlatformOption {
  platform: number;
  description: string;
}

export const reviewPlatformOptions: DtrPlatformOption[] = [
  {
    platform: 0,
    description: 'DtrReview.Platforms.All'
  },
  {
    platform: 1,
    description: 'DtrReview.Platforms.Xbox'
  },
  {
    platform: 2,
    description: 'DtrReview.Platforms.Playstation'
  },
  {
    platform: 3,
    description: 'DtrReview.Platforms.AllConsoles'
  },
  {
    platform: 4,
    description: 'DtrReview.Platforms.Pc'
  }
];
