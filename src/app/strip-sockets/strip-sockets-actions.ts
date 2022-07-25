import { Observable } from 'app/utils/observable';

/**
 * The currently active search query that the Strip Sockets dialog (sheet)
 * is working with in its "selecting sockets" state.
 */
export const stripSocketsQuery$ = new Observable<string | undefined>(undefined);

/**
 * Show the "Strip Sockets" dialog (sheet).
 */
export function stripSockets(query: string) {
  stripSocketsQuery$.next(query);
}
