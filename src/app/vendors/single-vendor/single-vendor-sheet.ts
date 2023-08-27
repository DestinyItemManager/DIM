import { EventBus } from 'app/utils/observable';

export interface SingleVendorState {
  characterId?: string;
  vendorHash?: number;
}

export const hideVendorSheet$ = new EventBus<undefined>();

export function hideVendorSheet() {
  hideVendorSheet$.next(undefined);
}
