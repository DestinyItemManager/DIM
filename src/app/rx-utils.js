export function subscribeOnScope($scope, observable, subscribeFn) {
  const subscription = observable.subscribe((...args) => {
    subscribeFn(...args);
  });
  $scope.$on('$destroy', () => subscription.unsubscribe());
  return subscription;
}