import { Observable } from 'app/utils/observable';

/**
 * The currently active search query
 */
export const stripSocketsQuery$ = new Observable<string | undefined>(undefined);

/**
 * Show the gear power sheet
 */
export function stripSockets(query: string) {
  stripSocketsQuery$.next(query);
}
