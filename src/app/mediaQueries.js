import { Observable, Scheduler } from 'rxjs/';

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
export function isPhonePortraitStream() {
  return Observable.defer(() => {
    return Observable.fromEventPattern(
      (h) => phoneWidthQuery.addListener(h),
      (h) => phoneWidthQuery.removeListener(h)
    )
    .map((e) => e.matches)
    .startWith(phoneWidthQuery.matches)
    .subscribeOn(Scheduler.asap);
  });
}
