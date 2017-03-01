import en from '../i18n/dim_en.json';
import it from '../i18n/dim_it.json';
import de from '../i18n/dim_de.json';
import fr from '../i18n/dim_fr.json';
import es from '../i18n/dim_es.json';
import ja from '../i18n/dim_ja.json';
import ptBr from '../i18n/dim_pt_BR.json';

function config($compileProvider, $httpProvider, $translateProvider, $translateMessageFormatInterpolationProvider,
                hotkeysProvider, localStorageServiceProvider, ngHttpRateLimiterConfigProvider, ngDialogProvider) {
  'ngInject';

  // TODO: remove this depenency by fixing component bindings https://github.com/angular/angular.js/blob/master/CHANGELOG.md#breaking-changes-1
  $compileProvider.preAssignBindingsEnabled(true);
  // Allow chrome-extension: URLs in ng-src
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);

  $httpProvider.interceptors.push('ngHttpRateLimiterInterceptor');
  if (!window.chrome || !window.chrome.extension) {
    $httpProvider.interceptors.push('http-refresh-token');
  }

  // See https://angular-translate.github.io/docs/#/guide
  $translateProvider.useSanitizeValueStrategy('escape');
  $translateProvider.useMessageFormatInterpolation();
  $translateProvider.preferredLanguage('en');

  $translateMessageFormatInterpolationProvider.messageFormatConfigurer(function(mf) {
    mf.setIntlSupport(true);
  });

  $translateProvider
    .translations('en', en)
    .translations('it', it)
    .translations('de', de)
    .translations('fr', fr)
    .translations('es', es)
    .translations('ja', ja)
    .translations('pt-br', ptBr)
    .fallbackLanguage('en');

  hotkeysProvider.includeCheatSheet = true;

  localStorageServiceProvider.setPrefix('');

  // Bungie's API will start throttling an API if it's called more than once per second. It does this
  // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
  // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
  // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/TransferItem/, 1, 1100);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny\/EquipItem/, 1, 1100);

  // https://github.com/likeastore/ngDialog/issues/327
  ngDialogProvider.setDefaults({
    appendTo: '.app',
    disableAnimation: true
  });
}

export default config;
