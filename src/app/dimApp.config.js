import en from '../locale/dim.json';
import it from '../locale/it/dim.json';
import de from '../locale/de/dim.json';
import fr from '../locale/fr/dim.json';
import es from '../locale/es-ES/dim.json';
import ja from '../locale/ja/dim.json';
import ptBR from '../locale/pt-BR/dim.json';

import { init as i18init } from 'i18next';

function config($compileProvider, $httpProvider, hotkeysProvider,
                ngHttpRateLimiterConfigProvider, ngDialogProvider) {
  'ngInject';

  // TODO: remove this depenency by fixing component bindings https://github.com/angular/angular.js/blob/master/docs/CHANGELOG.md#breaking-changes-1
  $compileProvider.preAssignBindingsEnabled(true);
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?:|data:image\/)/);

  $httpProvider.interceptors.push('ngHttpRateLimiterInterceptor');
  $httpProvider.interceptors.push('http-refresh-token');
  $httpProvider.useApplyAsync(true);

  hotkeysProvider.includeCheatSheet = true;

  // See https://github.com/i18next/ng-i18next
  i18init({
    debug: $DIM_FLAVOR === 'dev',
    fallbackLng: 'en',
    lowerCaseLng: true,
    interpolation: {
      escapeValue: false,
      format: function(val, format) {
        if (format === 'pct') {
          return `${Math.min(100.0, Math.floor(100.0 * val))}%`;
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
      'pt-br': { translation: ptBR }
    },
    returnObjects: true
  });

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
