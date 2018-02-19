export default function config(
  $compileProvider,
  $httpProvider,
  hotkeysProvider,
  ngHttpRateLimiterConfigProvider,
  ngDialogProvider) {
  'ngInject';

  // TODO: remove this dependency by fixing component bindings https://github.com/angular/angular.js/blob/master/docs/CHANGELOG.md#breaking-changes-1
  $compileProvider.preAssignBindingsEnabled(true);
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?:|data:image\/)/);

  $httpProvider.interceptors.push('ngHttpRateLimiterInterceptor');
  $httpProvider.interceptors.push('http-refresh-token');
  $httpProvider.useApplyAsync(true);

  hotkeysProvider.includeCheatSheet = true;

  // bugbug: if we get feedback from https://github.com/DestinyItemManager/DIM/issues/2601 then this is the property to set.
  // It defaults to '?' the way that angular-hotkeys ships.
  // hotkeysProvider.cheatSheetHotkey = '?';

  // Bungie's API will start throttling an API if it's called more than once per second. It does this
  // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
  // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
  // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/D1\/Platform\/Destiny\/TransferItem/, 1, 1100);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/D1\/Platform\/Destiny\/EquipItem/, 1, 1100);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/TransferItem/, 1, 100);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/EquipItem/, 1, 100);

  // https://github.com/likeastore/ngDialog/issues/327
  ngDialogProvider.setDefaults({
    appendTo: '.app',
    disableAnimation: true,
    plain: true
  });
}
