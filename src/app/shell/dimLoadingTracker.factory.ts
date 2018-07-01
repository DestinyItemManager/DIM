import { BehaviorSubject } from "rxjs/BehaviorSubject";
import '../rx-operators';
import { IPromise, IDeferred } from "angular";

const subject = new BehaviorSubject(false);

export const loadingTrackerStream = subject.distinctUntilChanged().shareReplay(1);

export default function loadingTracker(promiseTracker) {
  'ngInject';

  const tracker = promiseTracker();

  return {
    addPromise(promise: IPromise<any>) {
      const fullPromise: IDeferred<any> = tracker.addPromise(promise);
      subject.next(true);
      fullPromise.promise.finally(() => {
        setTimeout(() => subject.next(this.active()), 0);
      });
    },

    active() {
      return tracker.active();
    }
  };
}
