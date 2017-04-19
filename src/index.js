require('babel-polyfill');

require('./scripts/google');

// Drag and drop
var iosDragDropShim = require('drag-drop-webkit-mobile');
iosDragDropShim({
  enableEnterLeave: true,
  holdToDrag: 300
});
// https://github.com/timruffles/ios-html5-drag-drop-shim/issues/77
window.addEventListener('touchmove', function() {});

// Shim IndexedDB using WebSQL for iOS 9
require('indexeddbshim');

// TODO: remove this globals and instead require where needed
window.$ = window.jQuery = require('jquery');
require('jquery-textcomplete');
require('jquery-ui/ui/position');
window.MessageFormat = require('messageformat');

require('./scripts/oauth/oauth.module');
require('./scripts/oauth/http-refresh-token.service');
require('./scripts/oauth/oauth.service');
require('./scripts/oauth/oauth-token.service');

// Initialize the main DIM app
require('./scripts/app.module');

require('./scripts/services/dimActionQueue.factory');
require('./scripts/services/dimBungieService.factory');
require('./scripts/services/dimDefinitions.factory');
require('./scripts/services/dimManifestService.factory');
require('./scripts/services/dimBucketService.factory');
require('./scripts/services/dimInfoService.factory');
require('./scripts/services/dimPlatformService.factory');
require('./scripts/services/dimLoadoutService.factory');
require('./scripts/services/dimSettingsService.factory');
require('./scripts/services/dimStoreService.factory');
require('./scripts/services/dimCsvService.factory');
require('./scripts/services/dimItemService.factory');
require('./scripts/services/dimItemMoveService.factory');
require('./scripts/services/dimItemInfoService.factory');
require('./scripts/services/dimFarmingService.factory');
require('./scripts/services/dimSyncService.factory');

require('./scripts/loadout/dimLoadout.directive');
require('./scripts/loadout/dimLoadoutPopup.directive');
require('./scripts/loadout/random/dimRandom.controller');
require('./scripts/compare/dimCompare.directive');
require('./scripts/compare/dimCompareService.factory');
require('./scripts/shell/dimAngularFilters.filter');
require('./scripts/shell/dimMaterialsExchangeCtrl.controller');
require('./scripts/shell/dimSettingsCtrl.controller');
require('./scripts/shell/dimSearchFilter.directive');
require('./scripts/shell/dimClickAnywhereButHere.directive');
require('./scripts/shell/dimFilterLink.directive');
require('./scripts/shell/dimManifestProgress.directive');
require('./scripts/store/dimPercentWidth.directive');
require('./scripts/store/dimStores.directive');
require('./scripts/store/dimStoreBucket.directive');
require('./scripts/store/dimStoreReputation.directive');
require('./scripts/store/dimStoreItem.directive');
require('./scripts/store/dimStoreHeading.directive');
require('./scripts/store/dimSimpleItem.directive');
require('./scripts/store/dimStats.directive');
require('./scripts/store/dimFarming.directive');
require('./scripts/store/dimClearNewItems.directive');
require('./scripts/move-popup/dimMoveAmount.directive');
require('./scripts/move-popup/dimMovePopup.directive');
require('./scripts/move-popup/dimTalentGrid.directive');
require('./scripts/move-popup/dimMoveItemProperties.directive');
require('./scripts/move-popup/dimItemTag.directive');
require('./scripts/infuse/dimInfuse.controller');
require('./scripts/minmax/dimMinMax.controller');
require('./scripts/minmax/dimMinMaxItem.directive');
require('./scripts/minmax/dimMinMaxLocks.directive');
require('./scripts/minmax/dimMinMaxCharSelect.directive');
require('./scripts/debug/dimDebugItem.controller');
require('./scripts/developer/dimDeveloper.controller');
require('./scripts/materials-exchange/dimCollapsible.directive');
require('./scripts/login/dimLogin.controller');

require('./scss/main.scss');
