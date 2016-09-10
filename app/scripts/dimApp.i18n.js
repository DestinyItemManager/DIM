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
          Support: "Support",
          Settings: "Settings",
          filter_help: "Search item/perk or is:arc",
          'Tag Item': "Tag Item",
          Favorite: "Favorite",
          Keep: "Keep",
          Delete: "Delete"
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
          Reputation: "Reputazione",
          About: "Chi siamo",
          Support: "Aiutare",
          Settings: "Impostazioni"
        })
        .translations('de', {
          Weapons: "Waffen",
          Armor: "Rüstung",
          General: "Allgemein",
          Postmaster: "Poststelle",
          Equip: "Ausrüsten",
          Vault: "Tresor",
          Vanguard: "Vorhut",
          Reputation: "Ruf",
          About: "Über",
          Support: "Unterstützen",
          Settings: "Einstellungen"
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
          Reputation: "Estime",
          About: "À propos",
          Support: "Soutien",
          Settings: "Paramètres"
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
          tier_progress: "{{progress}} por {{tier}}",
          About: "Sobre",
          Support: "Apoyo",
          Settings: "Configuración"
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
          Reputation: "評価",
          About: "紹介",
          Support: "サポート",
          Settings: "設定"
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
          Reputation: "Reputação",
          About: "Sobre",
          Support: "Apoio",
          Settings: "Configurações"
        })
        .fallbackLanguage('en');
    }]);
})();
