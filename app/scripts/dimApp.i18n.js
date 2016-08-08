(function() {
  "use strict";

  // See https://angular-translate.github.io/docs/#/guide
  angular.module('dimApp')
    .config(['$translateProvider', function($translateProvider) {
      $translateProvider.useSanitizeValueStrategy('escape');

      $translateProvider
        .translations('en', {
          Level: "Level",
          Weapons: "Weapons",
          Armor: "Armor",
          Equip: "Equip",
          Vault: "Vault",
          Vanguard: "Vanguard"
        })
        .translations('it', {
          Level: "Livello",
          Weapons: "Armi",
          Armor: "Armatura",
          Equip: "Equipaggia",
          Vault: "Deposito"
        })
        .translations('de', {
          Equip: "Ausstatten",
          Vault: "Ausrüstungstresor"
        })
        .translations('fr', {
        })
        .translations('es', {
          Level: "Nivel",
          Weapons: "Arma",
          Armor: "Armadura",
          Vault: "Bóveda",
          Vanguard: "Vanguardia"
        })
        .translations('ja', {
        })
        .translations('pt-br', {
        })
        .fallbackLanguage('en');
    }]);
})();
