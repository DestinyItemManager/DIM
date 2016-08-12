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
          Vault: "Depositi",
          Vanguard: "Avanguardia"
        })
        .translations('de', {
          Weapons: "Waffen",
          Armor: "Rüstung",
          Equip: "Ausrüsten",
          Vault: "Tresor",
          Vanguard: "Vorhut"
        })
        .translations('fr', {
          Level: "Niveau",
          Weapons: "Armes",
          Armor: "Armure",
          Equip: "Équiper",
          Vault: "Coffres",
          Vanguard: "Avant-garde"
        })
        .translations('es', {
          Level: "Nivel",
          Weapons: "Armas",
          Armor: "Armadura",
          Equip: "Equipar",
          Vault: "Depósito",
          Vanguard: "Vanguardia"
        })
        .translations('ja', {
          Level: "レベル",
          Weapons: "武器",
          Armor: "装甲",
          Equip: "装備し",
          Vault: "保管",
          Vanguard: "前衛"
        })
        .translations('pt-br', {
          Level: "Nível",
          Weapons: "Armas",
          Armor: "Armadura",
          Equip: "Equipar",
          Vault: "Cofres",
          Vanguard: "Vanguarda"
        })
        .fallbackLanguage('en');
    }]);
})();
