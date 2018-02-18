export default function run(SyncService, $trace, $uiRouter) {
  'ngInject';

  SyncService.init();

  if ($featureFlags.debugRouter) {
    $trace.enable('TRANSITION');
    // tslint:disable-next-line:no-require-imports
    $uiRouter.plugin(require('@uirouter/visualizer').Visualizer);
  }

  console.log(`DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`);
}
