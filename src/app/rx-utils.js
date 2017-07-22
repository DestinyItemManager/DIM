/**
 * An AngularJS helper for subscribing to RxJS Observables. When the
 * provided scope is destroyed, the subscription will be automatically
 * unsubscribed.
 */
export function subscribeOnScope($scope, observable, subscribeFn) {
  const subscription = observable.subscribe(subscribeFn);
  $scope.$on('$destroy', () => subscription.unsubscribe());
  return subscription;
}