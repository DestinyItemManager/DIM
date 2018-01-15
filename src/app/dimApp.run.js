function run($rootScope, SyncService, $transitions, $location, $trace, $uiRouter) {
  'ngInject';

  SyncService.init();

  if ($featureFlags.debugRouter) {
    $trace.enable('TRANSITION');
    $uiRouter.plugin(require('@uirouter/visualizer').Visualizer);
  }

  console.log(`DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`);
}

export default run;
