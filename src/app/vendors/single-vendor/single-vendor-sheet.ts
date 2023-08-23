import { EventBus } from 'app/utils/observable';

export interface SingleVendorState {
  characterId?: string;
  vendorHash?: number;
}

export const showSingleVendor$ = new EventBus<Partial<SingleVendorState>>();

export function showSingleVendor(options: Partial<SingleVendorState>) {
  showSingleVendor$.next(options);
}
