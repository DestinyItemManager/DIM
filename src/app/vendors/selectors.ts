import { RootState } from 'app/store/types';

export const vendorsByCharacterSelector = (state: RootState) => state.vendors.vendorsByCharacter;
