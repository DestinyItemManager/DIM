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
          Weapons: "Waffen",
          Armor: "Schutz",
          Equip: "Ausstatten",
          Vault: "Ausrüstungstresor"
        })
        .translations('fr', {
          Level: "Niveau",
          Weapons: "Armes",
          Armor: "Armure",
          Equip: "Équiper",
          Vault: "Coffres"
        })
        .translations('es', {
          Level: "Nivel",
          Weapons: "Armas",
          Armor: "Armadura",
          Equip: "Equipar",
          Vault: "Bóveda",
          Vanguard: "Vanguardia"
        })
        .translations('ja', {
        })
        .translations('pt-br', {
          Level: "Nivel",
          Weapons: "Armas",
          Armor: "Armadura",
          Equip: "Equipar",
          Vault: "Cofres"
        })
        .fallbackLanguage('en');
    }]);
})();
