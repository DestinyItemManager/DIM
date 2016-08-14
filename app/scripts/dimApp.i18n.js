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
          Progress: "Progress",
          Vendors: "Vendors",
          Vanguard: "Vanguard",
          Reputation: "Reputation",
        })
        .translations('it', {
          Level: "Livello",
          Weapons: "Armi",
          Armor: "Armatura",
          General: "Generale",
          Postmaster: "Amministratrice",
          Equip: "Equipaggia",
          Vault: "Depositi",
          Progress: "Progresso",
          Vendors: "Mercanti",
          Vanguard: "Avanguardia",
          Reputation: "Reputazione",
        })
        .translations('de', {
          Weapons: "Waffen",
          Armor: "Rüstung",
          General: "Allgemein",
          Postmaster: "Poststelle",
          Equip: "Ausrüsten",
          Vault: "Tresor",
          Progress: "Fortschritt",
          Vendors: "Händler",
          Vanguard: "Vorhut",
          Reputation: "Ruf",
        })
        .translations('fr', {
          Level: "Niveau",
          Weapons: "Armes",
          Armor: "Armure",
          General: "Général",
          Postmaster: "Commis des postes",
          Equip: "Équiper",
          Vault: "Coffres",
          Progress: "Progression",
          Vendors: "Marchands",
          Vanguard: "Avant-garde",
          Reputation: "Estime",
        })
        .translations('es', {
          Level: "Nivel",
          Weapons: "Armas",
          Armor: "Armadura",
          Postmaster: "Administración",
          Equip: "Equipar",
          Vault: "Depósito",
          Progress: "Progreso",
          Vendors: "Comerciantes",
          Vanguard: "Vanguardia",
          Reputation: "Reputación",
        })
        .translations('ja', {
          Level: "レベル",
          Weapons: "武器",
          Armor: "よろい",
          General: "全般",
          Postmaster: "ポストマスター",
          Equip: "装備する",
          Vault: "装備",
          Progress: "進行状況",
          Vendors: "ベンダー",
          Vanguard: "バンガード",
          Reputation: "評価",
        })
        .translations('pt-br', {
          Level: "Nível",
          Weapons: "Armas",
          Armor: "Armadura",
          Equip: "Equipar",
          General: "Geral",
          Postmaster: "Chefe do Correio",
          Vault: "Cofres",
          Progress: "Progresso",
          Vendors: "Vendedores",
          Vanguard: "Vanguarda",
          Reputation: "Reputação",
        })
        .fallbackLanguage('en');
    }]);
})();
