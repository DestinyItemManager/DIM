import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import '../rx-operators';

/**
 * An object that can keep track of multiple running promises in order to drive a loading spinner.
 */
class PromiseTracker {
  numTracked = 0;
  subject = new BehaviorSubject(false);
  active$ = this.subject.distinctUntilChanged().shareReplay(1);

  addPromise<T>(promise: Promise<T>): Promise<T> {
    this.numTracked++;
    this.subject.next(true);
    promise.then(this.countDown);
    return promise;
  }

  active() {
    return this.numTracked > 0;
  }

  /** Convert a function that returns a promise into a function that tracks that promise then returns it. */
  trackPromise = <T extends any[], K>(
    promiseFn: (...args: T) => Promise<K>
  ): ((...args: T) => Promise<K>) => {
    return (...args: T) => {
      const promise = promiseFn.apply(null, args);
      this.addPromise(promise);
      return promise;
    };
  };

  private countDown = () => {
    this.numTracked--;
    this.subject.next(this.active());
  };
}

export const loadingTracker = new PromiseTracker();
