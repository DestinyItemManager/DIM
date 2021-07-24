import { Observable } from 'app/utils/observable';

/**
 * An object that can keep track of multiple running promises in order to drive a loading spinner.
 */
class PromiseTracker {
  numTracked = 0;
  active$ = new Observable(false);

  addPromise<T>(promise: Promise<T>): Promise<T> {
    this.numTracked++;
    this.active$.next(true);
    promise.then(this.countDown, this.countDown);
    return promise;
  }

  active() {
    return this.numTracked > 0;
  }

  /** Convert a function that returns a promise into a function that tracks that promise then returns it. */
  trackPromise =
    <T extends unknown[], K>(promiseFn: (...args: T) => Promise<K>): ((...args: T) => Promise<K>) =>
    (...args: T) => {
      const promise = promiseFn(...args);
      this.addPromise(promise);
      return promise;
    };

  private countDown = () => {
    this.numTracked--;
    this.active$.next(this.active());
  };
}

export const loadingTracker = new PromiseTracker();
