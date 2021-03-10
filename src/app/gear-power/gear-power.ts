import { Observable } from 'app/utils/observable';

/**
 * The currently selected store for showing gear power.
 */
export const showGearPower$ = new Observable<string | undefined>(undefined);

/**
 * Show the gear power sheet
 */
export function showGearPower(selectedStoreId: string) {
  showGearPower$.next(selectedStoreId);
}
