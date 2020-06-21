import { Subject } from 'rxjs';

export interface GearPowerStore {
  selectedStoreId: string;
}

export const showGearPower$ = new Subject<GearPowerStore>();

/**
 * Show the infusion fuel finder.
 */
export function showGearPower(selectedStoreId: string) {
  showGearPower$.next({ selectedStoreId });
}
