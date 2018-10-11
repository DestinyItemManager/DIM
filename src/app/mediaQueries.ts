import { Observable } from 'rxjs/Observable';
import { asap } from 'rxjs/scheduler/asap';
import './rx-operators';
import store from './store/store';
import { setPhonePortrait } from './shell/actions';

// This seems like a good breakpoint for portrait based on https://material.io/devices/
// We can't use orientation:portrait because Android Chrome messes up when the keyboard is shown: https://www.chromestatus.com/feature/5656077370654720
const phoneWidthQuery = window.matchMedia('(max-width: 540px)');

/**
 * Return whether we're in phone-portrait mode right now.
 */
export function isPhonePortrait() {
  return phoneWidthQuery.matches;
}

/**
 * Return an observable sequence of phone-portrait statuses.
 */
export function isPhonePortraitStream(): Observable<boolean> {
  return Observable.defer(() => {
    return Observable.fromEventPattern(
      (h: (this: MediaQueryList, ev: MediaQueryListEvent) => any) => phoneWidthQuery.addListener(h),
      (h: (this: MediaQueryList, ev: MediaQueryListEvent) => any) =>
        phoneWidthQuery.removeListener(h)
    )
      .map((e: MediaQueryList) => e.matches)
      .startWith(phoneWidthQuery.matches)
      .subscribeOn(asap);
  });
}

isPhonePortraitStream().subscribe((isPhonePortrait) =>
  store.dispatch(setPhonePortrait(isPhonePortrait))
);
