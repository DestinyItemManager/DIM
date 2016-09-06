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
          Vanguard: "Vanguard",
          Reputation: "Reputation",
          Super_cooldown: "Super cooldown",
          Melee_cooldown: "Melee cooldown",
          Grenade_cooldown: "Grenade cooldown",
          tier_progress: "{{progress}} for {{tier}}",
          About: "About",
          'Support DIM': "Support DIM",
          Vendors: "Vendors",
          filter_help: "Search item/perk or is:arc"
        })
        .translations('it', {
          Level: "Livello",
          Weapons: "Armi",
          Armor: "Armatura",
          General: "Generale",
          Postmaster: "Amministratrice",
          Equip: "Equipaggia",
          Vault: "Depositi",
          Vanguard: "Avanguardia",
          Reputation: "Reputazione"
        })
        .translations('de', {
          Weapons: "Waffen",
          Armor: "Rüstung",
          General: "Allgemein",
          Postmaster: "Poststelle",
          Equip: "Ausrüsten",
          Vault: "Tresor",
          Vanguard: "Vorhut",
          Reputation: "Ruf"
        })
        .translations('fr', {
          Level: "Niveau",
          Weapons: "Armes",
          Armor: "Armure",
          General: "Général",
          Postmaster: "Commis des postes",
          Equip: "Équiper",
          Vault: "Coffres",
          Vanguard: "Avant-garde",
          Reputation: "Estime"
        })
        .translations('es', {
          Level: "Nivel",
          Weapons: "Armas",
          Armor: "Armadura",
          Postmaster: "Administración",
          Equip: "Equipar",
          Vault: "Depósito",
          Vanguard: "Vanguardia",
          Reputation: "Reputación",
          tier_progress: "{{progress}} por {{tier}}"
        })
        .translations('ja', {
          Level: "レベル",
          Weapons: "武器",
          Armor: "よろい",
          General: "全般",
          Postmaster: "ポストマスター",
          Equip: "装備する",
          Vault: "装備",
          Vanguard: "バンガード",
          Reputation: "評価"
        })
        .translations('pt-br', {
          Level: "Nível",
          Weapons: "Armas",
          Armor: "Armadura",
          Equip: "Equipar",
          General: "Geral",
          Postmaster: "Chefe do Correio",
          Vault: "Cofres",
          Vanguard: "Vanguarda",
          Reputation: "Reputação"
        })
        .fallbackLanguage('en');
    }]);
})();
