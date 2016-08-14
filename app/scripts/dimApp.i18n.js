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
          Days: "Days",
          Vanguard: "Vanguard",
          Reputation: "Reputation",
          About: "About",
          Support: "Support",
          Settings: "Settings"
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
          Days: "Giorni",
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
          Progress: "Fortschritt",
          Vendors: "Händler",
          Days: "Tage",
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
          Progress: "Progression",
          Vendors: "Marchands",
          Days: "Journées",
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
          Progress: "Progreso",
          Vendors: "Comerciantes",
          Days: "Días",
          Vanguard: "Vanguardia",
          Reputation: "Reputación",
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
          Progress: "進行状況",
          Vendors: "ベンダー",
          Days: "日々",
          Vanguard: "バンガード",
          Reputation: "評価",
          About: "紹介",
          Support: "サポート"
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
          Progress: "Progresso",
          Vendors: "Vendedores",
          Days: "Dias",
          Vanguard: "Vanguarda",
          Reputation: "Reputação",
          About: "Sobre",
          Support: "Apoio",
          Settings: "Configurações"
        })
        .fallbackLanguage('en');
    }]);
})();
