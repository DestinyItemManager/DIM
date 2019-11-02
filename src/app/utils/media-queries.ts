import store from '../store/store';
import { setPhonePortrait } from '../shell/actions';
import { Observable, defer, fromEventPattern, asapScheduler } from 'rxjs';
import { map, startWith, subscribeOn } from 'rxjs/operators';

// This seems like a good breakpoint for portrait based on https://material.io/devices/
// We can't use orientation:portrait because Android Chrome messes up when the keyboard is shown: https://www.chromestatus.com/feature/5656077370654720
const phoneWidthQuery = window.matchMedia('(max-width: 540px)');

/**
 * Return whether we're in phone-portrait mode right now.
 */
export function isPhonePortraitFromMediaQuery() {
  return phoneWidthQuery.matches;
}

/**
 * Return an observable sequence of phone-portrait statuses.
 */
function isPhonePortraitStream(): Observable<boolean> {
  return defer(() =>
    fromEventPattern<MediaQueryList>(
      (h: (this: MediaQueryList, ev: MediaQueryListEvent) => any) => phoneWidthQuery.addListener(h),
      (h: (this: MediaQueryList, ev: MediaQueryListEvent) => any) =>
        phoneWidthQuery.removeListener(h)
    ).pipe(
      map((e: MediaQueryList) => e.matches),
      startWith(phoneWidthQuery.matches),
      subscribeOn(asapScheduler)
    )
  );
}

isPhonePortraitStream().subscribe((isPhonePortrait) =>
  store.dispatch(setPhonePortrait(isPhonePortrait))
);
