import { IScope } from 'angular';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

/**
 * An AngularJS helper for subscribing to RxJS Observables. When the
 * provided scope is destroyed, the subscription will be automatically
 * unsubscribed.
 */
export function subscribeOnScope<T>(
  $scope: IScope,
  observable: Observable<T>,
  subscribeFn: (T) => void
): Subscription {
  const subscription = observable.subscribe(subscribeFn);
  $scope.$on('$destroy', () => subscription.unsubscribe());
  return subscription;
}

/** A helper for managing multiple subscriptions. */
export class Subscriptions {
  private subscriptions: Subscription[] = [];

  add(...subscriptions: Subscription[]) {
    this.subscriptions.push(...subscriptions);
  }

  unsubscribe() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }
}
