import en from '../i18n/dim_en.po';
import it from '../i18n/dim_it.po';
import de from '../i18n/dim_de.po';
import fr from '../i18n/dim_fr.po';
import es from '../i18n/dim_es.po';
import ja from '../i18n/dim_ja.po';
import ptBr from '../i18n/dim_pt_BR.po';

function config($compileProvider, $httpProvider, $i18next, hotkeysProvider,
                ngHttpRateLimiterConfigProvider, ngDialogProvider) {
  'ngInject';

  // TODO: remove this depenency by fixing component bindings https://github.com/angular/angular.js/blob/master/CHANGELOG.md#breaking-changes-1
  $compileProvider.preAssignBindingsEnabled(true);
  // Allow chrome-extension: URLs in ng-src
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|chrome-extension):|data:image\/)/);

  $httpProvider.interceptors.push('ngHttpRateLimiterInterceptor');
  $httpProvider.interceptors.push('http-refresh-token');
  $httpProvider.useApplyAsync(true);

  // See https://angular-translate.github.io/docs/#/guide
  window.i18next.init({
    debug: true,
    lng: 'en', // If not given, i18n will detect the browser language.
    fallbackLng: 'en',
    interpolation: {
      format: function(val, format) {
        if (format === 'pct') {
          return `${Math.min(100.0, Math.floor(100.0 * val))}%`;
        }
        if (format === 'pct2') {
          return `${Math.min(100.00, Math.floor(100.00 * val))}%`;
        }
        return val;
      }
    },
    resources: {
      en: { translation: en },
      it: { translation: it },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      ja: { translation: ja },
      "pt-br": { translation: ptBr }
    },
    useCookie: false,
    useLocalStorage: false
  });

  hotkeysProvider.includeCheatSheet = true;

  // Bungie's API will start throttling an API if it's called more than once per second. It does this
  // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
  // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
  // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/D1\/Platform\/Destiny\/TransferItem/, 1, 1100);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/D1\/Platform\/Destiny\/EquipItem/, 1, 1100);

  // https://github.com/likeastore/ngDialog/issues/327
  ngDialogProvider.setDefaults({
    appendTo: '.app',
    disableAnimation: true,
    plain: true
  });
}

export default config;
