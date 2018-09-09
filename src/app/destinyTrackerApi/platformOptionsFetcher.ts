import { t } from 'i18next';

export interface DtrPlatformOption {
  platform: number;
  description: string;
}

export function getPlatformOptions(): DtrPlatformOption[] {
  return [
    { platform: 0,
      description: t('DtrReview.Platforms.All'),
    },
    {
      platform: 1,
      description: t('DtrReview.Platforms.Xbox')
    },
    {
      platform: 2,
      description: t('DtrReview.Platforms.Playstation')
    },
    {
      platform: 3,
      description: t('DtrReview.Platforms.AllConsoles')
    },
    {
      platform: 4,
      description: t('DtrReview.Platforms.Pc')
    }
  ];
}
