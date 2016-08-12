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
          General: "General",
          Postmaster: "Postmaster",
          Equip: "Equip",
          Vault: "Vault",
          Vanguard: "Vanguard"
        })
        .translations('it', {
          Level: "Livello",
          Weapons: "Armi",
          Armor: "Armatura",
          General: "Generale",
          Postmaster: "Amministratrice",
          Equip: "Equipaggia",
          Vault: "Depositi",
          Vanguard: "Avanguardia"
        })
        .translations('de', {
          Weapons: "Waffen",
          Armor: "Rüstung",
          General: "Allgemein",
          Postmaster: "Poststelle",
          Equip: "Ausrüsten",
          Vault: "Tresor",
          Vanguard: "Vorhut"
        })
        .translations('fr', {
          Level: "Niveau",
          Weapons: "Armes",
          Armor: "Armure",
          General: "Général",
          Postmaster: "Commis des postes",
          Equip: "Équiper",
          Vault: "Coffres",
          Vanguard: "Avant-garde"
        })
        .translations('es', {
          Level: "Nivel",
          Weapons: "Armas",
          Armor: "Armadura",
          Postmaster: "Administración",
          Equip: "Equipar",
          Vault: "Depósito",
          Vanguard: "Vanguardia"
        })
        .translations('ja', {
          Level: "レベル",
          Weapons: "武器",
          Armor: "装甲",
          General: "一般的な",
          Postmaster: "郵便局",
          Equip: "装備し",
          Vault: "保管",
          Vanguard: "前衛"
        })
        .translations('pt-br', {
          Level: "Nível",
          Weapons: "Armas",
          Armor: "Armadura",
          Equip: "Equipar",
          General: "Geral",
          Postmaster: "Chefe do Correio",
          Vault: "Cofres",
          Vanguard: "Vanguarda"
        })
        .fallbackLanguage('en');
    }]);
})();
