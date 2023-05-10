import { RootState } from 'app/store/types';

export const clarityDescriptionsSelector = (state: RootState) => state.clarity.descriptions;
export const clarityActive = (state: RootState) => state.clarity.loadClarity;
