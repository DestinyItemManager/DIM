(function() {
  "use strict";

  // See https://angular-translate.github.io/docs/#/guide
  angular.module('dimApp')
    .config(['$translateProvider', function($translateProvider) {
      $translateProvider.useSanitizeValueStrategy('escape');

      $translateProvider
        .translations('en', {
          LEVEL: "Level",
          WEAPONS: "Weapons",
          ARMOR: "Armor",
          EQUIP: "Equip",
          VAULT: "Vault"
        })
        .translations('it', {
          LEVEL: "Livello",
          WEAPONS: "Armi",
          ARMOR: "Armatura",
          EQUIP: "Equipaggia",
          VAULT: "Deposito"
        })
        .translations('de', {
          EQUIP: "Ausstatten",
          VAULT: "Ausrüstungstresor"
        })
        .translations('fr', {
        })
        .translations('es', {
          VAULT: "Bóveda",
          LEVEL: "Nivel"
        })
        .translations('ja', {
        })
        .translations('pt-br', {
        })
        .fallbackLanguage('en');
    }]);
})();
