function config($compileProvider, $httpProvider, $translateProvider, hotkeysProvider,
  localStorageServiceProvider, ngHttpRateLimiterConfigProvider) {
  "ngInject";

  // TODO: remove this depenency by fixing component bindings https://github.com/angular/angular.js/blob/master/CHANGELOG.md#breaking-changes-1
  $compileProvider.preAssignBindingsEnabled(true);
  // Allow chrome-extension: URLs in ng-src
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);

  $httpProvider.interceptors.push("ngHttpRateLimiterInterceptor");

  if (!window.chrome || !window.chrome.extension) {
    $httpProvider.interceptors.push('http-refresh-token');
  }

  // See https://angular-translate.github.io/docs/#/guide
  $translateProvider.useSanitizeValueStrategy('escape');
  $translateProvider.useMessageFormatInterpolation();
  $translateProvider.preferredLanguage('en');

  $translateProvider
    .translations('en', require('../i18n/dim_en.json'))
    .translations('it', require('../i18n/dim_it.json'))
    .translations('de', require('../i18n/dim_de.json'))
    .translations('fr', require('../i18n/dim_fr.json'))
    .translations('es', require('../i18n/dim_es.json'))
    .translations('ja', require('../i18n/dim_ja.json'))
    .translations('pt-br', require('../i18n/dim_pt_BR.json'))
    .fallbackLanguage('en');

  hotkeysProvider.includeCheatSheet = true;

  localStorageServiceProvider.setPrefix('');

  // Bungie's API will start throttling an API if it's called more than once per second. It does this
  // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
  // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
  // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/TransferItem/, 1, 1100);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/EquipItem/, 1, 1100);
}

export default config;
