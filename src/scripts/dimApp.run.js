
function run($rootScope, SyncService, $transitions, $location, $trace) {
  'ngInject';

  $trace.enable('TRANSITION');

  SyncService.init();

  // Variables for templates that webpack does not automatically correct.
  $rootScope.$DIM_VERSION = $DIM_VERSION;
  $rootScope.$DIM_FLAVOR = $DIM_FLAVOR;
  $rootScope.$DIM_CHANGELOG = $DIM_CHANGELOG;
  $rootScope.$DIM_BUILD_DATE = new Date($DIM_BUILD_DATE).toLocaleString();

  console.log(`DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.reddit.com/r/destinyitemmanager`);

  if ($featureFlags.googleAnalyticsForRouter) {
    $transitions.onSuccess({ }, () => {
      ga('send', 'pageview', $location.path());
    });
  }
}

export default run;
