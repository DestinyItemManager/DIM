import angular from 'angular';

// See https://angular-translate.github.io/docs/#/guide
angular.module('dimApp')
  .config(function($translateProvider, $translateMessageFormatInterpolationProvider) {
    $translateProvider.useSanitizeValueStrategy('escape');
    $translateProvider.useMessageFormatInterpolation();
    $translateProvider.preferredLanguage('en');

    $translateMessageFormatInterpolationProvider.messageFormatConfigurer(function(mf) {
      mf.setIntlSupport(true);
    });

    $translateProvider
      .translations('en', require('../i18n/dim_en.json'))
      .translations('it', require('../i18n/dim_it.json'))
      .translations('de', require('../i18n/dim_de.json'))
      .translations('fr', require('../i18n/dim_fr.json'))
      .translations('es', require('../i18n/dim_es.json'))
      .translations('ja', require('../i18n/dim_ja.json'))
      .translations('pt-br', require('../i18n/dim_pt_BR.json'))
      .fallbackLanguage('en');
  });
