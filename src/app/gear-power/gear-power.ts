import { Subject } from 'rxjs';

export interface GearPowerStore {
  selectedStoreId: string;
}

export const showGearPower$ = new Subject<GearPowerStore>();

/**
 * Show the gear power sheet
 */
export function showGearPower(selectedStoreId: string) {
  showGearPower$.next({ selectedStoreId });
}
