var fs = require('fs');
var uglify = require("uglify-js");

var uglified = uglify.minify([
  'app/vendor/jquery/dist/jquery.min.js',
  'app/vendor/angular/angular.min.js',
  'app/vendor/angular-ui-router/release/angular-ui-router.min.js',
  'app/vendor/angular-animate/angular-animate.min.js',
  'app/scripts/toaster.js',
  'app/vendor/angular-native-dragdrop/draganddrop.js',
  'app/vendor/ngDialog/js/ngDialog.min.js',
  'app/vendor/Angular.uuid2/dist/angular-uuid2.min.js',
  'app/vendor/underscore/underscore-min.js',
  'app/vendor/lz-string/libs/lz-string.min.js',
  'app/vendor/angular-messages/angular-messages.min.js',
  'app/vendor/angular-promise-tracker/promise-tracker.js',
  'app/vendor/verge/verge.js'
]);


fs.writeFile('app/scripts/vendor.min.js', uglified.code, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log("Script generated and saved:", 'vendor.min.js');
  }
});



//
// uglified = uglify.minify([
// 'app/scripts/dimApp.module.js',
// 'app/scripts/dimApp.config.js',
// 'app/scripts/services/dimRateLimit.factory.js',
// 'app/scripts/services/dimBungieService.factory.js',
// 'app/scripts/services/dimItemDefinitions.factory.js',
// 'app/scripts/services/dimPlatformService.factory.js',
// 'app/scripts/services/dimLoadoutService.factory.js',
// 'app/scripts/services/dimStoreService.factory.js',
// 'app/scripts/services/dimItemService.factory.js',
// 'app/scripts/loadout/dimLoadout.directive.js',
// 'app/scripts/loadout/dimLoadoutPopup.directive.js',
// 'app/scripts/shell/dimAppCtrl.controller.js',
// 'app/scripts/shell/dimPlatformChoice.directive.js',
// 'app/scripts/shell/dimSearchFilter.directive.js',
// 'app/scripts/shell/dimClickAnywhereButHere.directive.js',
// 'app/scripts/store/dimStores.directive.js',
// 'app/scripts/store/dimStoreItems.directive.js',
// 'app/scripts/store/dimStoreItem.directive.js',
// 'app/scripts/store/dimStoreHeading.directive.js',
// 'app/scripts/move-popup/dimMovePopup.directive.js',
// 'app/scripts/move-popup/dimMoveItemProperties.directive.js'
// ]);
//
//
// fs.writeFile('app/scripts/scripts.min.js', uglified.code, function(err) {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("Script generated and saved:", 'scripts.min.js');
//   }
// });
