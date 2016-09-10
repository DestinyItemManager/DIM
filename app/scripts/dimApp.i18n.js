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
          Store: "Store",
          Vault: "Vault",
          Vanguard: "Vanguard",
          Reputation: "Reputation",
          Intellect: "Intellect",
          Discipline: "Discipline",
          Strength: "Strength",
          Super_cooldown: "Super cooldown",
          Grenade_cooldown: "Grenade cooldown",
          Melee_cooldown: "Melee cooldown",
          tier_progress: "{{progress}} for {{tier}}",
          About: "About",
          'Support DIM': "Support DIM",
          Vendors: "Vendors",
          Support: "Support",
          Settings: "Settings",
          filter_help: "Search item/perk or is:arc"
        })
        .translations('it', {
          Level: "Livello",
          Weapons: "Armi",
          Armor: "Armatura",
          General: "Generale",
          Postmaster: "Amministratrice",
          Equip: "Equipaggia",
          Store: "Memorizzare",
          Vault: "Depositi",
          Vanguard: "Avanguardia",
          Reputation: "Reputazione",
          Intellect: "Intelletto",
          Discipline: "Disciplina",
          Strength: "Forza",
          Super_cooldown: "Super tempo di recupero",
          Grenade_cooldown: "Granate tempo di recupero",
          Melee_cooldown: "Corpo a corpo tempo di recupero",
          tier_progress: "{{progress}} per {{tier}}",
          About: "Chi siamo",
          'Support DIM': "Aiutare DIM",
          Vendors: "Mercanti",
          Support: "Aiutare",
          Settings: "Impostazioni"
        })
        .translations('de', {
          Weapons: "Waffen",
          Armor: "Rüstung",
          General: "Allgemein",
          Postmaster: "Poststelle",
          Equip: "Ausrüsten",
          Store: "Speichern",
          Vault: "Tresor",
          Vanguard: "Vorhut",
          Reputation: "Ruf",
          Intellect: "Intellekt",
          Discipline: "Disziplin",
          Strength: "Stärke",
          Super_cooldown: "Super abklingzeit",
          Grenade_cooldown: "Granaten abklingzeit",
          Melee_cooldown: "Nahkampf abklingzeit",
          tier_progress: "{{progress}} für {{tier}}",
          About: "Über",
          'Support DIM': "Unterstützen DIM",
          Vendors: "Händler"
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
          Store: "Stocker",
          Vault: "Coffres",
          Vanguard: "Avant-garde",
          Reputation: "Estime",
          Intellect: "Intelligence",
          Discipline: "Discipline",
          Strength: "Force",
          Super_cooldown: "Super délai",
          Grenade_cooldown: "Grenade délai",
          Melee_cooldown: "Mêlée délai",
          tier_progress: "{{progress}} pour {{tier}}",
          About: "À propos",
          'Support DIM': "Soutien DIM",
          Vendors: "Marchands",
          Support: "Soutien",
          Settings: "Paramètres"
        })
        .translations('es', {
          Level: "Nivel",
          Weapons: "Armas",
          Armor: "Armadura",
          Postmaster: "Administración",
          Equip: "Equipar",
          Store: "Almacenar",
          Vault: "Depósito",
          Vanguard: "Vanguardia",
          Reputation: "Reputación",
          Intellect: "Intelecto",
          Discipline: "Disciplina",
          Strength: "Fuerza",
          Super_cooldown: "Super tiempo",
          Grenade_cooldown: "Granade tiempo",
          Melee_cooldown: "Cuerpo a cuerpo tiempo",
          tier_progress: "{{progress}} por {{tier}}",
          About: "Sobre",
          'Support DIM': "Apoyo DIM",
          Vendors: "Comerciantes",
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
          Intellect: "知性",
          Discipline: "鍛錬",
          Strength: "腕力",
          About: "紹介",
          'Support DIM': "サポート DIM",
          Vendors: "ベンダー",
          Support: "サポート",
          Settings: "設定"
        })
        .translations('pt-br', {
          Level: "Nível",
          Weapons: "Armas",
          Armor: "Armadura",
          General: "Geral",
          Postmaster: "Chefe do Correio",
          Equip: "Equipar",
          Store: "Armazenar",
          Vault: "Cofres",
          Vanguard: "Vanguarda",
          Reputation: "Reputação",
          Intellect: "Intelecto",
          Discipline: "Disciplina",
          Strength: "Força",
          Super_cooldown: "Super tempo",
          Grenade_cooldown: "Granadas tempo",
          Melee_cooldown: "Corpo a corpo tempo",
          tier_progress: "{{progress}} por {{tier}}",
          About: "Sobre",
          'Support DIM': "Apoio DIM",
          Vendors: "Vendedores",
          Support: "Apoio",
          Settings: "Configurações"
        })
        .fallbackLanguage('en');
    }]);
})();
