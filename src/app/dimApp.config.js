import en from 'file-loader?name=[name]-[hash:6].[ext]!../locale/dim.json';
import it from 'file-loader?name=[name]-[hash:6].[ext]!../locale/it/dim.json';
import de from 'file-loader?name=[name]-[hash:6].[ext]!../locale/de/dim.json';
import fr from 'file-loader?name=[name]-[hash:6].[ext]!../locale/fr/dim.json';
import es from 'file-loader?name=[name]-[hash:6].[ext]!../locale/es-ES/dim.json';
import esMX from 'file-loader?name=[name]-[hash:6].[ext]!../locale/es-MX/dim.json';
import ja from 'file-loader?name=[name]-[hash:6].[ext]!../locale/ja/dim.json';
import pl from 'file-loader?name=[name]-[hash:6].[ext]!../locale/pl/dim.json';
import ptBR from 'file-loader?name=[name]-[hash:6].[ext]!../locale/pt-BR/dim.json';
import ru from 'file-loader?name=[name]-[hash:6].[ext]!../locale/ru/dim.json';
import zhCHT from 'file-loader?name=[name]-[hash:6].[ext]!../locale/zh-CN/dim.json';

import { init as i18init, use as i18use } from 'i18next';
import XHR from 'i18next-xhr-backend';

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
  i18use(XHR);
  i18init({
    debug: $DIM_FLAVOR === 'dev',
    fallbackLng: 'en',
    lowerCaseLng: true,
    load: 'currentOnly',
    interpolation: {
      escapeValue: false,
      format: function(val, format) {
        if (format === 'pct') {
          return `${Math.min(100.0, Math.floor(100.0 * val))}%`;
        }
        return val;
      }
    },
    /*
    whitelist: [
      'en',
      'it',
      'de',
      'fr',
      'es',
      'es-mx',
      'ja',
      'pt-br',
      'pl',
      'ru',
      'zh-cht'
    ],
    */
    backend: {
      loadPath(lng) {
        const path = {
          en,
          it,
          de,
          fr,
          es,
          'es-mx': esMX,
          ja,
          'pt-br': ptBR,
          pl,
          ru,
          'zh-cht': zhCHT
        }[lng];
        console.log('load', lng, path);
        if (!path) {
          throw new Error("unsupported language " + lng);
        }
        return path;
      },
      //parse: (data) => console.log(data) && data,
      //ajax: loadLocales
    }, /*
    resources: {
      en: { translation: en },
      it: { translation: it },
      de: { translation: de },
      fr: { translation: fr },
      es: { translation: es },
      'es-mx': { translation: esMX },
      ja: { translation: ja },
      'pt-br': { translation: ptBR },
      pl: { translation: pl },
      ru: { translation: ru },
      'zh-cht': { translation: zhCHT }
    },*/
    returnObjects: true
  });

  // Bungie's API will start throttling an API if it's called more than once per second. It does this
  // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
  // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
  // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/D1\/Platform\/Destiny\/TransferItem/, 1, 110);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/D1\/Platform\/Destiny\/EquipItem/, 1, 110);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/TransferItem/, 1, 100);
  ngHttpRateLimiterConfigProvider.addLimiter(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/EquipItem/, 1, 100);

  // https://github.com/likeastore/ngDialog/issues/327
  ngDialogProvider.setDefaults({
    appendTo: '.app',
    disableAnimation: true,
    plain: true
  });
}

export default config;
