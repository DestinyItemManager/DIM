import { RootState } from 'app/store/types';

export const clarityDescriptionsSelector = (state: RootState) => state.clarity.descriptions;

export const clarityCharacterStatsSelector = (state: RootState) => state.clarity.characterStats;
