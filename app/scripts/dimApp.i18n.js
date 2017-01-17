(function() {
  "use strict";

  // See https://angular-translate.github.io/docs/#/guide
  angular.module('dimApp')
    .config(['$translateProvider', function($translateProvider) {
      $translateProvider.useSanitizeValueStrategy('escape');
      $translateProvider.useMessageFormatInterpolation();
      $translateProvider.preferredLanguage('en');

      $translateProvider
        .translations('en', {
          Level: "Level",
          Bucket: {
            Armor: "Armor",
            General: "General",
            Postmaster: "Postmaster",
            Progress: "Progress",
            Reputation: "Reputation",
            Show: "Show {bucket}",
            Unknown: "Unknown",
            Vault: "Vault",
            Weapons: "Weapons"
          },
          BungieService: {
            DevVersion: "Are you running a development version of DIM? You must register your chrome extension with bungie.net.",
            Down: "Bungie.net is down.",
            Difficulties: "The Bungie API is currently experiencing difficulties.",
            NetworkError: "Network error - {status} {statusText}",
            Throttled: "Bungie API throttling limit exceeded. Please wait a bit and then retry.",
            NotLoggedIn: "Please log into Bungie.net in order to use this extension.",
            Maintenance: "Bungie.net servers are down for maintenance.",
            NoAccount: "No Destiny account was found for this platform. Do you have the right platform selected?",
            NoAccountForPlatform: "Failed to find a Destiny account for you on {platform}.",
            NoCookies: "No cookies found.",
            NotConnected: "You may not be connected to the internet.",
            Twitter: "Get status updates on",
            ItemUniqueness: "Item Uniqueness",
            ItemUniquenessExplanation: "You tried to move the '{name}' {type} to your {character} but that destination already has that item and is only allowed one."
          },
          Compare: {
            All: "{type} comparisons ({quantity})",
            Archetype: "Archetype comparisons ({quantity})",
            ButtonHelp: "Compare Items",
            Compare: "Compare",
            Close: "Close",
            Error: {
              Class: "Cannot compare this item as it is not for a {class}.",
              Archetype: "Cannot compare this item as it is not a {type}."
            },
            Splits: "Compare similar splits ({quantity})"
          },
          Cooldown: {
            Grenade: "Grenade cooldown",
            Melee: "Melee cooldown",
            Super: "Super cooldown"
          },
          Debug: {
            Dump: "Dump info to console",
            View: "View Item Debug Info"
          },
          DidYouKnow: {
            DidYouKnow: "Did you know?",
            Collapse: "You just collapsed a section in DIM! This might be useful to hide parts of DIM that you don't need to normally use.",
            DontShowAgain: "Don't show this tip again",
            DoubleClick: "If you're moving an item to your currently active (last logged in) character, you can instead double click that item to instantly equip it.",
            DragAndDrop: "Items can be dragged and dropped between different characters/vault columns.",
            Expand: "To re-expand a section, simply click the plus sign icon on the far left of the category you collapsed.",
            TryNext: "Try it out next time!"
          },
          FarmingMode: {
            FarmingMode: "Farming Mode (move items)",
            Desc: "DIM is moving Engram and Glimmer items from {store} to the vault and leaving one space open per item type to prevent anything from going to the Postmaster.",
            Configuration: "Configuration",
            MakeRoom: {
              Desc: "DIM is moving only Engram and Glimmer items from {store} to the vault or other characters to prevent anything from going to the Postmaster.",
              MakeRoom: "Make room to pick up items by moving equipment",
              Tooltip: "If checked, DIM will move weapons and armor around to make space in the vault for engrams."
            },
            OutOfRoom: "You're out of space to move items off of {character}. Time to decrypt some engrams and clear out the trash!",
            Quickmove: "Quick Move",
            Stop: "Stop"
          },
          Filter: {
            EnterName: "Enter an item name:",
            EnterNote: "Enter notes text:"
          },
          Header: {
            About: "About",
            Filters: "Filters",
            FilterHelp: "Search item/perk or is:arc",
            MaterialsExchange: "Available faction ranks",
            Refresh: "Refresh Destiny Data",
            SupportDIM: "Support DIM"
          },
          Help: {
            BackToDIM: "Back to DIM",
            CannotMove: "Cannot move that item off this character.",
            Drag: "Hold shift or pause over drop zone to transfer a partial stack.",
            ChangingPerks: "Changing Perks Not Supported",
            ChangingPerksInfo: "Sorry, there's no way to change perks outside the game. We wish we could!",
            HidePopup: "Hide This Popup",
            NeverShow: "Never show me this again.",
            UpgradeChrome: "Please Upgrade Chrome",
            Version: {
              Beta: "Beta has been updated to v$DIM_VERSION",
              Stable: "DIM v$DIM_VERSION Released"
            },
            Xur: "Xûr is Here"
          },
          Hotkey: {
            StartSearch: "Start a search",
            RefreshInventory: "Refresh inventory",
            ToggleDetails: "Toggle showing full item details",
            MarkItemAs: "Mark item as '{tag}'",
            ClearNewItems: "Clear new items"
          },
          Infusion: {
            Infusion: "Infusion Fuel Finder",
            BringGear: "Will bring the gear to",
            Calc: "Infusion calculator",
            InfuseItems: "Select item to infuse with:",
            InfusionMaterials: "Infusion Materials",
            LockedItems: "Include 'locked' items",
            NoItems: "No infusable items available.",
            NoTransfer: "Transfer infusion material\n {target} cannot be moved.",
            ShowItems: "Show infusable items across all characters and vault",
            TransferItems: "Transfer items",
            Using3: "using 3"
          },
          ItemMove: {
            Consolidate: "Consolidated {name}",
            Distributed: "Distributed {name}\n {name} is now equally divided between characters.",
            ToVault: "All {name} are now in your vault.",
            ToStore: "All {name} are now on your {store}."
          },
          ItemService: {
            BucketFull: "There are too many '{itemtype}' items {isVault, select, true{in the} false{on your}} {store}.",
            Classified: "This item is classified and cannot be transferred at this time.",
            Classified2: "Classified item. Bungie does not yet provide information about this item. Item is not yet transferable.",
            Deequip: "Cannot find another item to equip in order to dequip {itemname}",
            ExoticError: "'{itemname}' cannot be equipped because the exotic in the {slot} slot cannot be unequipped. ({error})",
            NotEnoughRoom: "There's nothing we can move out of {store} to make room for {itemname}",
            OnlyEquippedLevel: "This can only be equipped on characters at or above level {level}.",
            OnlyEquippedClassLevel: "This can only be equipped on a {class} at or above level {level}.",
            PercentComplete: "({ percent | percent } Complete)",
            TooMuch: "Looks like you requested to move more of this item than exists in the source!",
            TwoExotics: "We don't know how you got more than 2 equipped exotics!",
          },
          LB: {
            LB: "Loadout Builder",
            Guardians: "Guardians",
            ShowGear: "Show {class} gear",
            HideGear: "Hide {class} gear",
            LockEquipped: "Lock Equipped",
            ClearLocked: "Clear Locked",
            Locked: "Locked Items",
            LockedHelp: "Drag and drop any item into its bucket to build set with that specific gear. Shift + click to exclude items.",
            FilterSets: "Filter sets",
            AdvancedOptions: "Advanced Options",
            ProcessingMode: {
              Fast: "Fast",
              Full: "Full",
              ProcessingMode: "Processing mode",
              HelpFast: "Only looks at your best gear.",
              HelpFull: "Looks at more gear, but takes longer."
            },
            Scaled: "Scaled",
            Current: "Current",
            LightMode: {
              LightMode: "Light mode",
              HelpScaled: "Calculates loadouts as if all items were 350 defense.",
              HelpCurrent: "Calculates loadouts at current defense levels."
            },
            IncludeRare: "Include rare (blue) items",
            Help: "Need help?",
            Equip: "Equip on Current Character",
            ShowAllConfigs: "Show all configurations",
            ShowConfigs: "Show configurations",
            HideAllConfigs: "Hide all configurations",
            HideConfigs: "Hide configurations",
            Loading: "Loading best sets",
            Vendor: "Include Vendor items",
            Exclude: "Excluded Items",
            ExcludeHelp: "Shift + click an item (or drag and drop into this bucket) to build sets without specific gear.",
            LockPerk: "Lock perk",
            Missing1: "Missing legendary or exotic pieces to build a full set!",
            Missing2: "Missing rare, legendary, or exotic pieces to build a full set!"
          },
          Loadouts: {
            Any: "Any",
            Loadouts: "Loadouts",
            Before: "Before '{name}'",
            Create: "Create Loadout",
            FromEquipped: "Equipped",
            Edit: "Edit Loadout",
            Delete: "Delete Loadout",
            ConfirmDelete: "Are you sure you want to delete '{name}'?",
            ApplySearch: "Items = \"{query}\"",
            MaximizeLight: "Maximize Light",
            ItemLeveling: "Item Leveling",
            GatherEngrams: "Gather Engrams",
            GatherEngramsExceptExotics: "Exotics",
            RestoreAllItems: "All Items",
            Random: "Random",
            Randomize: "Randomize your equipped weapons, armor, ghost, and artifact?",
            VendorsCannotEquip: "These vendor items cannot be equipped:",
            VendorsCanEquip: "These items can be equipped:",
            MaxSlots: "You can only have {slots} of that kind of item in a loadout.",
            OnlyItems: "Only equippable items, materials, and consumables can be added to a loadout.",
            FilteredItems: "Filtered Items",
            NoEngrams: "No non-exotic engrams are available to transfer.",
            NoExotics: "No engrams are available to transfer.",
            LoadoutName: "Loadout Name...",
            Save: "Save",
            SaveAsNew: "Save As New",
            Cancel: "Cancel",
            ItemsWithIcon: "Items with this icon will be equipped. Click on an item to toggle equip.",
            CouldNotEquip: "Could not equip {itemname}",
            TooManyRequested: "You have {total} {itemname} but your loadout asks for {requested} We transfered all you had.",
            DoesNotExist: "{itemname} doesn't exist in your account.",
            AppliedAuto: "Automatic Loadout Builder",
            Applied: "Your {amount, plural, =1{single item loadout has} other{loadout of # items have}} been transferred to your {store}.",
            AppliedError: "None of the items in your loadout could be transferred.",
            AppliedWarn: "Your loadout has been partially transferred, but {failed} of {total} items had errors.",
            NameRequired: "A name is required.",
            MakeRoom: "Make Room for Postmaster",
            MakeRoomDone: "Finished making room for {postmasterNum, plural, =1{1 Postmaster item} other{# Postmaster items}} by moving {movedNum, plural, =1{1 item} other{# items}} off of {store}.",
            MakeRoomError: "Unable to make room for all Postmaster items: {error}."
          },
          Manifest: {
            Build: "Building Destiny info database",
            Download: "Downloading latest Destiny info from Bungie",
            Error: "Error loading Destiny info:\n{error}\nReload to retry.",
            Outdated: "Outdated Destiny Info",
            OutdatedExplanation: "Bungie has updated their Destiny info database. Reload DIM to pick up the new info. Note that some things in DIM may not work for a few hours after Bungie updates Destiny, as the new data propagates through their systems.",
            BungieDown: "Bungie.net may be having trouble.",
            Load: "Loading saved Destiny info",
            LoadCharInv: "Loading Destiny characters and inventory",
            Save: "Saving latest Destiny info",
            Unzip: "Unzipping latest Destiny info"
          },
          MaterialsExchange: {
            MaterialsExchange: "Materials Exchange",
            CurrentRank: "Current Rank",
            CurrentRep: "Current Rep",
            OnHand: "Materials on hand",
            FromTrade: "Materials from trade",
            NewRank: "New Rank",
            NewRep: "New Rep"
          },
          MovePopup: {
            Consolidate: "Consolidate",
            DistributeEvenly: "Distribute Evenly",
            Equip: "Equip",
            Split: "Split",
            Store: "Store",
            Take: "Take",
            Vault: "Vault"
          },
          Notes: {
            Error: "Error! Max 120 characters for notes.",
            Help: "Add notes to this item"
          },
          Postmaster: {
            Limit: "Postmaster Limit",
            Desc: "There are 20 lost items at the Postmaster on your {store}. Any new items will overwrite the existing."
          },
          Settings: {
            Settings: "Settings",
            Language: "Language (reload DIM to take effect)",
            HideUnfiltered: "Hide Unfiltered Items while Filtering",
            HideUnfilteredHelp: "Items that do not match filter criteria will be hidden.",
            AlwaysShowDetails: "Always Show Item Details",
            AlwaysShowDetailsHelp: "Clicking on an item will show a popup that can be expanded to show perk and stat details.  This option will always show that detail when you click on an item.",
            EnableAdvancedStats: "Enable advanced stat quality comparison features",
            EnableAdvancedStatsHelp: "Will enable advanced min/max features on the move dialog and enable the armor comparison view.",
            ShowOverlay: "Show new items with an overlay",
            ShowOverlayHelp: "Will show new items with an overlay.",
            ShowAnimations: "Show new item overlay animations on new items.",
            ShowAnimationsHelp: "Will show the animated new item overlay on new items. Turning this off can save CPU cycles.",
            ShowElemental: "Show elemental damage icons on weapons",
            ShowElementalHelp: "Show elemental damage icons on weapons.",
            SetSort: "Sort Items by:",
            SetSortHelp: "Sort items by rarity or their primary stat value.",
            SortPrimary: "Primary stat",
            SortRarity: "Rarity",
            SortRoll: "Stat roll percent",
            InventoryColumns: "Character Inventory Columns",
            InventoryColumnsHelp: "Select the number of columns for character inventory.",
            VaultColumns: "Vault Maximum Inventory Columns",
            VaultColumnsHelp: "Select the maximum number of columns for vault.",
            SizeItem: "Item Size",
            SizeItemHelp: "How big should items be?",
            ResetToDefault: "Reset to Default",
            CharacterOrder: "Character Order",
            CharacterOrderHelp: "Characters can be ordered by last login or based on their creation date.",
            CharacterOrderRecent: "By Most Recent Character",
            CharacterOrderReversed: "By Most Recent Character (Reversed)",
            CharacterOrderFixed: "Fixed (By Character Age)",
            ExportSS: "Download Spreadsheets",
            ExportSSHelp: "Download a CSV list of your items that can be easily viewed in the spreadsheet app of your choice.",
            DIMPopups: "DIM Info Popups",
            DIMPopupsReset: "Reset previously hidden info tips"
          },
          Stats: {
            Discipline: "Discipline",
            Intellect: "Intellect",
            NoBonus: "No Bonus",
            OfMaxRoll: "{range} of max roll",
            PercentHelp: "Click for more information about what Stats Quality is.",
            Quality: "Stats quality",
            Strength: "Strength",
            TierProgress: "{progress} for {tier}"
          },
          StoreBucket: {
            FillStack: "Fill Stack ({amount})",
            HowMuch: "How much {itemname} to move?",
            Move: "Move"
          },
          Tags: {
            TagItem: "Tag Item",
            Favorite: "Favorite",
            Junk: "Junk",
            Infuse: "Infuse",
            Keep: "Keep"
          },
          Vendors: {
            Vendors: "Vendors",
            All: "All",
            Available: "Available on",
            Compare: "Compare with what you already have",
            Day: "{numDays, plural, =1{Day} other{Days}}",
            Load: "Loading Vendors",
            ArmorAndWeapons: "Armor & Weapons",
            ShipsAndVehicles: "Ships & Vehicles",
            Consumables: "Consumables",
            Bounties: "Bounties",
            ShadersAndEmblems: "Shaders & Emblems",
            Emotes: "Emotes"
          },
          TrialsCard: {
            FiveWins: "5 Win Reward (Armor)",
            SevenWins: "7 Win Reward (Weapon)",
            Flawless: "Flawless"
          }
        })
        .translations('it', {
          Level: "Livello",
          Bucket: {
            Armor: "Armatura",
            General: "Generale",
            Postmaster: "Amministratrice",
            Progress: "Progesso",
            Reputation: "Reputazione",
            Show: "Mostra {bucket}",
            Unknown: "Sconosciuto",
            Vault: "Deposito",
            Weapons: "Armi"
          },
          BungieService: {
            DevVersion: "Stai eseguendo una versione di DIM in via di sviluppo? Devi registrare la tua estensione per chrome con bungie.net.",
            Down: "Bungie.net è offline.",
            Difficulties: "Al momento le API di Bungie hanno dei problemi.",
            NetworkError: "Errore Network - {status} {statusText}",
            Throttled: "Superato il limite di strozzamento delle API di Bungie. Riprovare fra poco.",
            NotLoggedIn: "Effettuare l accesso a Bungie.net per utilizzare questa estensione.",
            Maintenance: "I server di Bungie.net sono offline per manutenzione.",
            NoAccount: "Non è stato trovato alcun account Destiny per questa piattaforma. Hai selezionato la piattaforma giusta?",
            NoAccountForPlatform: "Impossibile trovare un account Destiny per te su {platform}.",
            NoCookies: "Non è stato trovato nessun cookie.",
            NotConnected: "Potresti non essere connesso a internet.",
            Twitter: "Ottieni informazioni sullo stato del servizio su",
            ItemUniqueness: "Unicità dell elemento",
            ItemUniquenessExplanation: "Hai provato a spostare il '{name}' {type} {gender, select, male{al tuo} female{alla tua}} {character} ma quella destinazione ne possiede già una e solo una è concessa."
          },
          Compare: {
            All: "Confronta ogni {type} ({quantity})",
            Archetype: "Confronta per archetipo ({quantity})",
            Compare: "Confronta",
            Close: "Chiudi",
            Error: {
              Class: "Impossibile confrontare questo oggetto, poichè non è per {class}.",
              Archetype: "Impossibile confrontare questo oggetto, poichè non è un {type}."
            },
            Splits: "Confronta simili suddivisioni ({quantity})"
          },
          Cooldown: {
            Grenade: "Granate tempo di recupero",
            Melee: "Corpo a corpo tempo di recupero",
            Super: "Super tempo di recupero"
          },
          Debug: {
            Dump: "Svuota informazioni nella console",
            View: "Visualizza Item Debug Info"
          },
          DidYouKnow: {
            DidYouKnow: "Lo sapevi?",
            Collapse: "Hai appena chiuso una sezione in DIM! Questo può essere utile per nascondere parti di DIM che non utilizzi solitamente.",
            DontShowAgain: "Non mostrare questo consiglio nuovamente",
            DoubleClick: "Se stai spostando un oggetto al personaggio attualmente attivo (ultimo utilizzato), puoi semplicemente fare doppio click su quell'oggetto per equipaggiarlo immediatamente.",
            DragAndDrop: "Gli oggetti possono essere trascinati e rilasciati tra le colonne dei personaggi e del deposito.",
            Expand: "Per riaprire una sezione, clicca sul 'più' sulla parte sinistra della categoria che hai chiuso.",
            TryNext: "Provaci la prossima volta!"
          },
          FarmingMode: {
            FarmingMode: "Modalità Farming (sposta oggetti)",
            Desc: "DIM sposta Engrammi e consumabili per Lumen {gender, select, male{dal} female{dalla}} {store} al deposito e lascia uno slot libero per ogni tipo di oggetto per evitare che qualcosa finisca dall'Amministratore.",
            Configuration: "Configurazione",
            MakeRoom: {
              Desc: "DIM sposta solo gli Engrammi e i consumabili per i Lumen {gender, select, male{dal} female{dalla}} {store} al deposito o agli altri personaggi per evitare che qualcosa finisca dall'Amministratrice",
              MakeRoom: "Crea spazio per poter raccogliere oggetti, spostando l'equipaggiamento",
              Tooltip: "Se selezionato, DIM sposterà armi e equipaggiamento per creare spazio per gli engrammi nel deposito."
            },
            OutOfRoom: "Non hai più spazio per trasferire oggetti dal {character}. E' il momento di decriptare degli engrammi e pulire il cestino!",
            Quickmove: "Spostamento Rapido",
            Stop: "Stop"
          },
          Filter: {
            EnterName: "Inserisci il nome di un oggetto:",
            EnterNote: "Inserisci delle note:"
          },
          Header: {
            About: "Chi siamo",
            Filters: "Filtri",
            FilterHelp: "Cerca oggetti/perk o is:arc",
            MaterialsExchange: "Livelli fazione disponibili",
            Refresh: "Aggiorna i Dati di Destiny",
            SupportDIM: "Supporta DIM"
          },
          Help: {
            BackToDIM: "Torna a DIM",
            CannotMove: "Non posso spostare quell'oggetto da questo personaggio.",
            Drag: "Tieni premuto shift o fermati su una zona di rilascio per trasferire solo una certa qauntità",
            ChangingPerks: "Selezione dei Perk non supportata",
            ChangingPerksInfo: "Scusa, non è possibile cambiare i perk dall'esterno del gioco. Ci piacerebbe poterlo fare!",
            HidePopup: "Nascondi Questo Popup",
            NeverShow: "Non mostrarmi più questo messaggio.",
            UpgradeChrome: "Prego aggiornare Chrome",
            Version: {
              Beta: "La Beta è stata aggiornata alla versione $DIM_VERSION",
              Stable: "Rilasciata la versione $DIM_VERSION di DIM"
            },
            Xur: "Xûr è arrivato"
          },
          Hotkey: {
            StartSearch: "Inizia una ricerca",
            RefreshInventory: "Aggiorna l'inventario",
            ToggleDetails: "Bottone per mostrare o meno tutti i dettagli dell'oggetto",
            MarkItemAs: "Contrassegna oggetto come '{tag}'",
            ClearNewItems: "Pulisci nuovi oggetti"
          },
          Infusion: {
            Infusion: "Finder di Oggetti per Infusione",
            BringGear: "Porterà l'oggetto a:",
            Calc: "Calcolatrice per Infusione",
            InfuseItems: "Seleziona oggetto da infondere con:",
            InfusionMaterials: "Materiali da Infusione",
            LockedItems: "Include oggetti 'bloccati'",
            NoItems: "Non è disponibile nessun oggetto per l'infusione.",
            NoTransfer: "Trasferimento maperiale per infusione\n {target} non può essere spostato.",
            ShowItems: "Mostra gli oggetti infondibili di tutti i personaggi e del deposito",
            TransferItems: "Trasferisci oggetti",
            Using3: "usa 3"
          },
          ItemMove: {
            Consolidate: "{name} consolidati",
            Distributed: "{name} distribuiti\n {name} sono ora suddivisi in modo equo tra i personaggi.",
            ToVault: "Tutti i {name} sono ora nel deposito.",
            ToStore: "Tutti i {name} sono ora sul tuo {store}."
          },
          ItemService: {
            BucketFull: "{gender, select, female{La} other{Il}} {store} ha troppe '{item type}'.",
            Classified: "Questo oggetto è classificato e non può essere trasferito attualemente.",
            Classified2: "Oggetto classificato. Bungie non fornisce informazioni riguardo questo oggetto. Questo oggetto non è ancora trasferibile.",
            Deequip: "Impossibile trovare un altro oggetto da equipaggiare per rimuovere {itemname}",
            ExoticError: "'{itemname}' non può essere equipaggiato, poichè l'esotico nello slot {slot} non può essere rimosso. ({error})",
            NotEnoughRoom: "Non c'è nulla che possiamo spostare dal {store} per fare spazio per {itemname}",
            OnlyEquippedLevel: "Questo oggetto può essere equipaggiato solamente su personaggi al livello {level} o superiore.",
            OnlyEquippedClassLevel: "Questo oggetto può essere equipaggaito solo su un {class} al livello {level} o superiore.",
            PercentComplete: "({ percent | percent } Completato)",
            TooMuch: "Sembra tu abbia richiesto di spostare una quantità maggiore di oggetti rispetto a quella disponibile nell'origine!",
            TwoExotics: "Non sappiamo come tu abbia equipaggiati più di 2 esotici!"
          },
          LB: {
            LB: "Costruttore di Loadout",
            Guardians: "Guardiani",
            ShowGear: "Mostra equipaggiamento {class}",
            HideGear: "Nascondi equipaggiamento {class}",
            LockEquipped: "Blocca Equipaggiati",
            ClearLocked: "Pulisci Bloccati",
            Locked: "Oggetti Bloccati",
            LockedHelp: "Trascina e rilascia un qualsiasi oggetto nel suo riquadro per costruire un set con quella specifica armatura. Shift + click per escludere oggetti.",
            FilterSets: "Filtra i set",
            AdvancedOptions: "Opzioni Avanzate",
            ProcessingMode: {
              Fast: "Veloce",
              Full: "Completa",
              ProcessingMode: "Procedura",
              HelpFast: "Controlla solo tra il tuo equipaggiamento migliore.",
              HelpFull: "Controlla tra più elementi del tuo equipaggiamento, ma impiega più tempo."
            },
            Scaled: "In Scala",
            Current: "Corrente",
            LightMode: {
              LightMode: "Modalità Luce",
              HelpScaled: "Calcola i loadout, supponendo che tutti gli oggetti abbiano 350 di difesa.",
              HelpCurrent: "Calcola i loadout con i livelli di difesa correnti."
            },
            IncludeRare: "Includi oggetti rari (blu)",
            Help: "Hai bisogno di aiuto?",
            Equip: "Equipaggia sul personaggio corrente",
            ShowAllConfigs: "Mostra tutte le configurazioni",
            ShowConfigs: "Mostra configurazioni",
            HideAllConfigs: "Nascondi tutte le configurazioni",
            HideConfigs: "Nascondi configurazioni",
            Loading: "Caricando i migliori set",
            Vendor: "Includi oggetti dei Mercanti",
            Exclude: "Oggetti esclusi",
            ExcludeHelp: "Shift + click su un oggetto (o trascina e rilascia in questo riquadro) per creare dei set senza delle specifiche armature.",
            LockPerk: "Blocca perk",
            Missing1: "Manca un leggendario o un esotico per costruire un set completo!",
            Missing2: "Manca un raro, un leggendario o un esotico per costruire un set completo"
          },
          Loadouts: {
            Any: "Qualsiasi",
            Loadouts: "Loadouts",
            Before: "Prima '{name}'",
            Create: "Creare Loadout",
            FromEquipped: "Equipaggiato",
            Edit: "Modifica Loadout",
            Delete: "Cancellare Loadout",
            ConfirmDelete: "Sei sicuro di voler eliminare '{name}'?",
            ApplySearch: "Elementi = \"{query}\"",
            MaximizeLight: "Massimizzare la Luce",
            ItemLeveling: "Elementi da Livellare",
            GatherEngrams: "Raccogliere Engrammi",
            GatherEngramsExceptExotics: "Esotici",
            RestoreAllItems: "Tutti gli Elementi",
            Random: "Casuale",
            Randomize: "Vuoi selezionare casualmente armi, armature, spettro e artefatto?",
            VendorsCannotEquip: "Questi oggetti dei venditori non possono essere equipaggiati:",
            VendorsCanEquip: "Questi oggetti possono essere equipaggiati:",
            MaxSlots: "Puoi avere solo {slots} tipi di quell'oggetto in un loadout.",
            OnlyItems: "Solo oggetti, che si possono equipaggiare, materiali e consumabili si possono aggiungere a un loadout.",
            FilteredItems: "Oggetti Filtrati",
            NoEngrams: "Non ci sono engrammi non-esotici da trasferire.",
            NoExotics: "Non ci sono engrammi da trasferire.",
            LoadoutName: "Nome Loadout...",
            Save: "Salva",
            SaveAsNew: "Salva come nuovo",
            Cancel: "Cancella",
            ItemsWithIcon: "Gli oggetti con questa icona verranno equipaggiati. Clicca su un oggetto per scegliere se equipaggiarli o meno.",
            CouldNotEquip: "Impossibile equipaggiare {itemname}",
            TooManyRequested: "Hai un totale di {total} {itemname}, ma il tuo loadout ne richiede {requested}. Abbiamo trasferito tutti quelli che avevi.",
            DoesNotExist: "{itemname} non esiste sul tuo account.",
            AppliedAuto: "Costruttore Automatico di Loadout",
            Applied: "Il tuo loadout di {amount, plural, =1{un oggetto} other{# oggetti}} è stato trasferito {gender, select, male{al tuo} female{alla tua}} {store}.",
            AppliedError: "Non è stato possibile trasferire nessuno degli oggetti del tuo loadout.",
            AppliedWarn: "Il tuo loadout è stato parzialmente trasferito, ma per {failed} di {total} oggetti il trasferimento è fallito.",
            NameRequired: "E' richiesto un nome.",
            MakeRoom: "Crea spazio per l'Amministratore",
            MakeRoomDone: "Ho terminato di creare spazio per {postmasterNum, plural, =1{1 oggetto} other{# oggetti}}  dell'Amministratore togliendo {movedNum, plural, =1{1 oggetto} other{# oggetti}} {gender, select, male{dal} female{dalla}} {store}.",
            MakeRoomError: "Impossibile creare spazio per tutti gli oggetti dell'Amministratore: {error}."
          },
          Manifest: {
            Build: "Costruisco il database di informazioni di Destiny",
            Download: "Scarico le ultime informazioni riguardanti Destiny da Bungie",
            Error: "Errore caricando le informazioni su Destiny:\n{error}\nRicarica per riprovare.",
            Outdated: "Informazioni su Destiny datate",
            OutdatedExplanation: "Bungie ha aggiornato il suo database di informazioni su Destiny. Ricarica DIM per raccogliere le nuove informazioni. Nota che alcune cose su DIM potrebbero non funzionare per alcune ore, dopo che Bungie ha aggiornato Destiny, poichè i nuovi dati vengono diffusi dai loro sistemi.",
            BungieDown: "Bungie.net potrebbe star riscontrando dei problemi.",
            Load: "Carico le informazioni su Destiny salvate",
            LoadCharInv: "Carico i personaggi e l'inventario di Destiny",
            Save: "Salvo le ultime informazioni su Destiny",
            Unzip: "Decomprimo le ultime informazioni su Destiny"
          },
          MaterialsExchange: {
            MaterialsExchange: "Scambio Materiali",
            CurrentRank: "Grado Attuale",
            CurrentRep: "Reputazione Attuale",
            OnHand: "Materiali disponibili",
            FromTrade: "Materiali da scambi",
            NewRank: "Nuovo Grado",
            NewRep: "Nuova Reputazione"
          },
          MovePopup: {
            Consolidate: "Consolida",
            DistributeEvenly: "Distribuisci Equamente",
            Equip: "Usa",
            Split: "Dividi",
            Store: "Mouvi",
            Take: "Prendi",
            Vault: "Depos"
          },
          Notes: {
            Error: "Errore! Massimo 120 caratteri per nota.",
            Help: "Aggiungere note a questo oggetto"
          },
          Postmaster: {
            Limit: "Limite Amministratore",
            Desc: "Sul tuo {store} ci sono 20 oggetti persi dall'amministratore. Qualsiasi nuovo oggetto sovrascriverà uno degli esistenti."
          },
          Settings: {
            Settings: "Impostazioni",
            Language: "Lingua (ricarica DIM per apportare la modifica)",
            HideUnfiltered: "Nascondi elementi indersiderati mentre uso i Filtri",
            HideUnfilteredHelp: "Gli oggetti che non corrispondono ai criteri dei filtri verranno nascosti.",
            AlwaysShowDetails: "Mostra sempre i dettagli degli oggetti",
            AlwaysShowDetailsHelp: "Cliccare su un oggetto mostrerà una finestra che può essere espansa per mostrare i perk e i dettagli delle statistiche. Questa opzione mostrerà sempre i dettagli quando clicchi un oggetto",
            EnableAdvancedStats: "Attiva funzionalità di confronto avanzato della qualità delle statistiche",
            EnableAdvancedStatsHelp: "Attiva funzionalità avanzata di minimo/massimo sulle finestre e la vista di confronto armature.",
            ShowOverlay: "Mostra una sfumatura sui nuovi oggetti.",
            ShowOverlayHelp: "Mostrerà una sfumatura sui nuovi oggetti.",
            ShowAnimations: "Mostra una sfumatura animata sui nuovi oggetti.",
            ShowAnimationsHelp: "Mostrerà una sfumatura animata sui nuovi oggetti. Disattivare quest'opzione può salvare cicli di CPU.",
            ShowElemental: "Mostra icona di danno elemetale sulle armi",
            ShowElementalHelp: "Mostra icona di danno elemetale sulle armi.",
            SetSort: "Ordina oggetti per:",
            SetSortHelp: "Ordina oggetti per rarità o per valore delle statistiche primarie.",
            SortPrimary: "Statistiche Primarie",
            SortRarity: "Rarità",
            SortRoll: "Percentuale delle statistiche",
            InventoryColumns: "Colonne per Inventario del Personaggio",
            InventoryColumnsHelp: "Seleziona il numero di colonne per inventario del personaggio.",
            VaultColumns: "Massimo Colonne per il Deposito",
            VaultColumnsHelp: "Seleziona il numero massimo di colonne per il Deposito.",
            SizeItem: "Dimensione Oggetti",
            SizeItemHelp: "Quanto grandi devono essere le icone degli oggetti?",
            ResetToDefault: "Ripristina Default",
            CharacterOrder: "Ordine Personaggi",
            CharacterOrderHelp: "I personaggi possono essere ordinati in base all'ultimo login o in base alla loro data di creazione.",
            CharacterOrderRecent: "Dal Personaggio Più Recente",
            CharacterOrderReversed: "Dal Personaggio Più Recente (Contrario)",
            CharacterOrderFixed: "Fisso (In Base All'Età)",
            ExportSS: "Scarica il foglio elettronico",
            ExportSSHelp: "Scarica una lista CSV dei tuoi oggetti, che può essere facilmente visualizzata in un'applicazione di fogli elettronici di tua scelta.",
            DIMPopups: "Popup informativi di DIM ",
            DIMPopupsReset: "Ripristina i consigli precedentemente nascosti"
          },
          Stats: {
            Discipline: "Disciplina",
            Intellect: "Intelletto",
            NoBonus: "Nessun Bonus",
            OfMaxRoll: "{range} del roll massimo",
            PercentHelp: "Clicca per maggiori informazioni riguarso la Qualità delle Statistiche.",
            Quality: "Qualità statistiche",
            Strength: "Forza",
            TierProgress: "{progress} per {tier}"
          },
          StoreBucket: {
            FillStack: "Riempi Stack ({amount})",
            HowMuch: "Quanti {itemname} vuoi spostare?",
            Move: "Sposta"
          },
          Tags: {
            TagItem: "Segna Oggetto",
            Favorite: "Preferito",
            Junk: "Smantella",
            Infuse: "Infondi",
            Keep: "Tieni"
          },
          Vendors: {
            Vendors: "Mercanti",
            All: "Tutto",
            Available: "Disponibile da",
            Compare: "Confronta con quello che hai già",
            Day: "{numDays, plural, =1{Giorno} other{Giorni}}",
            Load: "Caricamento Mercanti",
            ArmorAndWeapons: "Equipaggiamento & Armi",
            ShipsAndVehicles: "Navi & Veicoli",
            Consumables: "Consumabili",
            Bounties: "Taglie",
            ShadersAndEmblems: "Shader & Emblemi",
            Emotes: "Emotes"
          },
          TrialsCard: {
            FiveWins: "Ricompensa 5 Vittorie (Armatura)",
            SevenWins: "Ricompensa 7 Vittorie (Arma)",
            Flawless: "Vittoria Impeccabile"
          }
        })
        .translations('de', {
          Level: "Level",
          Bucket: {
            Armor: "Rüstung",
            General: "Allgemein",
            Postmaster: "Poststelle",
            Progress: "Fortschritt",
            Reputation: "Ruf",
            Show: "Zeige {bucket}",
            Unknown: "Unbekannt",
            Vault: "Tresor",
            Weapons: "Waffen"
          },
          BungieService: {
            DevVersion: "Benutzt du eine Entwickler-Version von DIM? Du musst deine Chrome-Erweiterung auf bungie.net registrieren.",
            Down: "Bungie.net ist nicht erreichbar.",
            Difficulties: "Die Bungie-API hat zur Zeit mit Schwierigkeiten zu kämpfen.",
            NetworkError: "Netzwerk Fehler - {status} {statusText}",
            Throttled: "Bungie API Drosselgrenze überschritten. Bitte warte etwas und versuche es dann erneut.",
            NotLoggedIn: "Bitte melde dich bei Bungie.net an, um diese Erweiterung zu nutzen.",
            Maintenance: "Bungie.net Server werden zur Zeit gewartet.",
            NoAccount: "Es wurde kein Destiny Account für diese Platform gefunden. Hast du die richtige Platform gewählt?",
            NoAccountForPlatform: "Konnte auf {platform} keinen Destiny Account für dich finden.",
            NoCookies: "Keine Cookies gefunden.",
            NotConnected: "Du bist eventuell nicht mit dem Internet verbunden.",
            Twitter: "Bekomme Statusupdates auf",
            ItemUniqueness: "Item Einzigartigkeit",
            ItemUniquenessExplanation: "Du hast versucht '{name}' {type} zu deinem {character} zu verschieben, aber das Ziel hat schon eins davon und es ist nur eins erlaubt.."
          },
          Compare: {
            All: "{type} Vergleich ({quantity})",
            Archetype: "Vergleiche im Urzustand ({quantity})",
            ButtonHelp: "Gegenstände vergleichen",
            Compare: "Vergleiche",
            Close: "Schließen",
            Error: {
              Class: "Kann dieses Item nicht vergleichen, da es nicht für einen {class} ist.",
              Archetype: "Kann dieses Item nicht vergleichen, da es kein {type} ist."
            },
            Splits: "Vergleiche mit selben Werten ({quantity})"
          },
          Cooldown: {
            Grenade: "Granaten Abklingzeit",
            Melee: "Nahkampf Abklingzeit",
            Super: "Super Abklingzeit"
          },
          Debug: {
            Dump: "Info in Konsole ausgeben",
            View: "Zeige Item Debug Info"
          },
          DidYouKnow: {
            DidYouKnow: "Wusstest du schon?",
            Collapse: "Du hast gerade eine Sektion in DIM eingeklappt! Das kann nützlich sein um Teile von DIM zu verstecken, die du normalerweise nicht verwendest.",
            DontShowAgain: "Diesen Tipp nicht erneut zeigen",
            DoubleClick: "Wenn du ein Item zu deinem aktiven (zuletzt eingeloggt) Charakter bewegst, kannst du es stattdessen doppelt anklicken um es sofort auszurüsten.",
            DragAndDrop: "Gegenstände können zwischen verschiedenen Charackteren und dem Tresor per \"Drag and Drop\" verschoben werden",
            Expand: "Klicke das Plus-Zeichen auf der linken Seite der eingeklappten Kategorie an, um diese wieder aufzuklappen.",
            TryNext: "Probiere es das nächste Mal aus!"
          },
          FarmingMode: {
            FarmingMode: "Farm Modus (verschickt Items)",
            Desc: "DIM verschiebt Engramme und Glimmergegenstände vom {store} in den Tresor und lässt einen Platz pro Gegenstandstyp frei um zu verhindern, dass etwas zur Poststelle geschickt wird.",
            Configuration: "Einstellungen",
            MakeRoom: {
              Desc: "DIM verschiebt Engramme und Glimmergegenstände vom {store} zum Tresor oder anderen Charakteren, nur um zu verhindern, dass etwas in der Poststelle landet.",
              MakeRoom: "Mache Platz durch verschieben von Ausrüstung, um Items aufnehmen zu können",
              Tooltip: "Wenn ausgewählt, wird DIM Waffen und Rüstungen verschieben, um im Tresor Platz für Engramme zu schaffen."
            },
            OutOfRoom: "Dir ist der Platz ausgegangen um Gegenstände von {character} wegzuschieben. Es ist an der Zeit einige Engramme zu entschlüsseln und den Müll auszusortieren.",
            Quickmove: "Schnelles Verschieben",
            Stop: "Stop"
          },
          Filter: {
            EnterName: "Trage einen Namen ein:",
            EnterNote: "Trage eine Beschreibung ein:"
          },
          Header: {
            About: "Über",
            Filters: "Filter",
            FilterHelp: "Suche nach Item/Perk oder is:arc",
            MaterialsExchange: "Verfügbare Fraktionsränge",
            Refresh: "Aktualisiere Destiny Daten",
            SupportDIM: "DIM Unterstützen"
          },
          Help: {
            BackToDIM: "Zurück zu DIM",
            CannotMove: "Item kann nicht von diesem Charakter wegbewegt werden.",
            Drag: "Halte Shift oder pausiere über dem Ziel, um einen Teilstapel zu übertragen",
            ChangingPerks: "Verändern der Perks wird nicht unterstützt",
            ChangingPerksInfo: "Entschuldigung, es gibt keine Möglichkeit die Perks außerhalb des Spiels zu verändern. Wir würden es nur zu gern!",
            HidePopup: "Dieses Fenster ausblenden",
            NeverShow: "Diesen Tipp nicht erneut zeigen",
            UpgradeChrome: "Bitte aktualisiere Chrome",
            Version: {
              Beta: "Beta wurde auf v$DIM_VERSION aktualisiert",
              Stable: "DIM v$DIM_VERSION veröffentlicht"
            },
            Xur: "Xûr ist da"
          },
          Hotkey: {
            StartSearch: "Starte eine Suche",
            RefreshInventory: "Aktualisiere Inventar",
            ToggleDetails: "Zeige/verstecke vollständige Gegenstanddetails",
            MarkItemAs: "Markiere Gegenstand als '{tag}'",
            ClearNewItems: "Markierung von neuen Items entfernen"
          },
          Infusion: {
            Infusion: "Finde Infusions-Material",
            BringGear: "Bringt die Ausrüstung zu",
            Calc: "Infusionsrechner",
            InfuseItems: "Item auswählen zum Infundieren mit:",
            InfusionMaterials: "Infusions Material",
            LockedItems: "Beziehe 'gesperrte' Items ein",
            NoItems: "Keine infundierbaren Items verfügbar.",
            NoTransfer: "Transfer des Infundiermaterials\n{target} kann nicht verschoben werden.",
            ShowItems: "Zeige alle infundierbaren Items von allen Charaktern und dem Tresor",
            TransferItems: "Übertrage Items",
            Using3: "verwendet 3"
          },
          ItemMove: {
            Consolidate: "{name} zusammengefasst",
            Distributed: "{name} verteilt\n{name} ist gleichermaßen zwischen Charakteren verteilt",
            ToVault: "Alle {name} sind nun in deinem Tresor.",
            ToStore: "Alle {name} sind nun bei deinem {store}."
          },
          ItemService: {
            BucketFull: "Es sind zu viele '{itemtype}'-Gegenstände im{isVault, select, false{ Inventar vom}} {store}.",
            Classified: "Dieses Item ist geheim und kann zur Zeit nicht übertragen werden.",
            Classified2: "Geheimes Item. Bungie stellt zur Zeit keine Informationen über dieses Item zur Verfügung. Item ist noch nicht übertragbar.",
            Deequip: "Kann keinen weiteren ausrüstbaren Gegenstand finden um {itemname} abzulegen.",
            ExoticError: "'{itemname}' kann nicht ausgerüstet werden, da der exotische Gegenstand im {slot} Slot nicht abgelegt werden kann. ({error})",
            NotEnoughRoom: "Es gibt nichts was wir aus {store} wegbewegen könnten um Platz für {itemname} zu schaffen",
            OnlyEquippedLevel: "Das kann nur von Charakteren ab einem Level von {level} oder drüber ausgerüstet werden.",
            OnlyEquippedClassLevel: "Das kann nur von einem {class} ab einem Level von {level} oder drüber ausgerüstet werden.",
            PercentComplete: "({ percent | percent } fertig)",
            TooMuch: "Es hat den Anschein dass du mehr Einheiten dieses Items verschieben wolltest als in der Quelle existieren!",
            TwoExotics: "Wir wissen nicht wie du es geschafft hast mehr als 2 exotische Gegenstände auszurüsten!"
          },
          LB: {
            LB: "Loadout Builder",
            Guardians: "Hüter",
            ShowGear: "Zeige {class} Ausrüstung",
            HideGear: "Verstecke {class} Ausrüstung",
            LockEquipped: "Ausgerüstetes sperren",
            ClearLocked: "Gesperrte entfernen",
            Locked: "Gesperrte Gegenstände",
            LockedHelp: "Ziehe einen beliebigen Gegenstand in sein Feld, um ihn in den Loadouts zu verwenden. Mit Shift + Klick kannst du Gegenstände ignorieren.",
            FilterSets: "Filter setzen",
            AdvancedOptions: "Erweiterte Optionen",
            ProcessingMode: {
              Fast: "Schnell",
              Full: "Vollständig",
              ProcessingMode: "Berechnung",
              HelpFast: "Nur die beste Ausrüstung wird einbezogen.",
              HelpFull: "Bezieht mehr Ausrüstung ein, braucht dafür länger."
            },
            Scaled: "Skaliertes",
            Current: "Aktuelles",
            LightMode: {
              LightMode: "Lichtlevel",
              HelpScaled: "Berechne Loadouts als ob alle Gegenstände 350 Verteidigung hätten.",
              HelpCurrent: "Berechnet Loadouts mit dem aktuellen Verteidigungswert."
            },
            IncludeRare: "Seltene (blaue) Gegenstände einbeziehen",
            Help: "Brauchst du Hilfe?",
            Equip: "Beim aktuellen Charakter anlegen.",
            ShowAllConfigs: "Zeige alle Einstellungen",
            ShowConfigs: "Zeige Einstellungen",
            HideAllConfigs: "Verstecke alle Einstellungen",
            HideConfigs: "Verstecke Einstellungen",
            Loading: "Lade die besten Sets",
            Vendor: "Gegenstände von Händlern einschließen",
            Exclude: "Ignorierte Gegenstände",
            ExcludeHelp: "Benutze Shift + Klick bei einem Gegenstand (oder ziehe ihn in dieses Feld) um Sets ohne diesen Gegenstand zu generieren.",
            LockPerk: "Perk sperren",
            Missing1: "Es fehlen legendäre oder exotische Gegenstände, um ein vollständiges Set zu generieren!",
            Missing2: "Es fehlen seltene, legendäre oder exotische Gegenstände, um ein vollständiges Set zu generieren!"
          },
          Loadouts: {
            Any: "Irgendein",
            Loadouts: "Loadouts",
            Before: "Zurück zu '{name}'",
            Create: "Loadout erstellen",
            FromEquipped: "Ausrüstung",
            Edit: "Loadout bearbeiten",
            Delete: "Loadout löschen",
            ConfirmDelete: "'{name}' wirklich löschen?",
            ApplySearch: "Gegenstand = \"{query}\"",
            MaximizeLight: "Licht maximieren",
            ItemLeveling: "Gegenstand aufwerten",
            GatherEngrams: "Engramme sammeln",
            GatherEngramsExceptExotics: "Exo",
            RestoreAllItems: "Alle Gegenstände",
            Random: "Zufällig",
            Randomize: "Sollen deine ausgerüsteten Waffen und Rüstungen, sowie Geist und Artefakt zufällig ausgewählt werden?",
            VendorsCannotEquip: "Folgende Händler-Gegenstände können nicht ausgerüstet werden:",
            VendorsCanEquip: "Folgende Gegenstände können ausgerüstet werden:",
            MaxSlots: "Du kannst nur {slots} Gegenstände dieser Art in einem Loadout haben.",
            OnlyItems: "Es können nur ausrüstbare Gegenstände, Materialien und Verbrauchsgegenstände zu einem Loadout hinzugefügt werden.",
            FilteredItems: "Gefilterte Items",
            NoEngrams: "Es sind keine nicht-exotischen Engramme zum Transfer verfügbar.",
            NoExotics: "Es sind keine Engramme zum Transfer verfügbar.",
            LoadoutName: "Loadout Name...",
            Save: "Speichern",
            SaveAsNew: "Als neu speichern",
            Cancel: "Abbrechen",
            ItemsWithIcon: "Gegenstände mit diesem Symbol werden angelegt. Klicke auf einen Gegenstand um ihn anzulegen bzw. abzulegen.",
            CouldNotEquip: "{itemname} konnte nicht ausgerüstet werden",
            TooManyRequested: "Du hast {total} {itemname}. Dein Loadout verlangt jedoch {requested}. Wir haben alles übertragen, was da war.",
            DoesNotExist: "{itemname} existiert nicht auf deinem Account.",
            AppliedAuto: "Automatischer Loadout Builder",
            Applied: "{amount, plural, =1{Dein Ein-Item Loadout} other{Loadout aus # Gegenständen}} wurde zum {store} übertragen.",
            AppliedError: "Keiner der Gegenstände in deinem Loadout konnte übertragen werden.",
            AppliedWarn: "Dein Loadout wurde teilweise übertragen, aber {failed} von {total} Gegenständen hatten Fehler.",
            NameRequired: "Ein Name ist erforderlich.",
            MakeRoom: "Schaffe Platz für Posstellenitems",
            MakeRoomDone: "Platz für {postmasterNum, plural, =1{1 Poststellenitem} other{# Poststellenitems}} durch verschieben von {movedNum, plural, =1{1 Item} other{# Items}} vom {store} geschaffen.",
            MakeRoomError: "Es kann kein Platz für alle Posstellengegenstände geschaffen werden: {error}."
          },
          Manifest: {
            Build: "Lege Destiny Datenbank an",
            Download: "Lade neueste Daten von Bungie herunter",
            Error: "Fehler beim Laden von Destiny Daten:\n{error}\nApp neu laden, um es nochmals zu versuchen.",
            Outdated: "Veraltete Destiny Daten",
            OutdatedExplanation: "Bungie hat die Destiny Info-Datenbank aktualisiert. Lade DIM erneut, um die neuen Infos zu laden. Beachte, dass einige Dinge in DIM u.U. nicht richtig funktionieren, nachdem Bungie.net Destiny aktualisiert hat, solange die neuen Daten im System verbreiten werden.",
            BungieDown: "Bungie.net hat möglicherweise Probleme.",
            Load: "Lade gespeicherte Daten",
            LoadCharInv: "Lade Destiny Charaktere und Inventar",
            Save: "Speichere neueste Daten",
            Unzip: "Entpacke neueste Daten"
          },
          MaterialsExchange: {
            MaterialsExchange: "Materialaustausch",
            CurrentRank: "Aktueller Rang",
            CurrentRep: "Aktueller Ruf",
            OnHand: "Materialien in Besitz",
            FromTrade: "Materialien vom Tausch",
            NewRank: "Neuer Rang",
            NewRep: "Neuer Ruf"
          },
          MovePopup: {
            Consolidate: "Zusammenführen",
            DistributeEvenly: "Gleichmäßig verteilen",
          },
          Notes: {
            Error: "Fehler! Max 120 Zeichen für Notizen.",
            Help: "Notiz für dieses Item hinzufügen"
          },
          Postmaster: {
            Limit: "Poststellenlimit",
            Desc: "Es sind 20 verlorene Gegenstände in der Poststelle deines {store}. Jedes neue Item wird bereits vorhandene überschreiben."
          },
          Settings: {
            Settings: "Einstellungen",
            Language: "Sprache (lade DIM neu zum Übernehmnen)",
            HideUnfiltered: "Blende ungefilterte Gegenstände beim Filtern aus",
            HideUnfilteredHelp: "Items welche die Filterkriterien nicht erfüllen, werden ausgeblendet.",
            AlwaysShowDetails: "Zeige immer Gegenstand Details",
            AlwaysShowDetailsHelp: "Ein Klick auf einen Gegenstand öffnet ein Popup, welches erweitert werden kann, um Details zu Statistiken und Perks anzuzeigen. Diese Option wird immer diese Details zeigen, wenn du auf einen Gegenstand klickst.",
            EnableAdvancedStats: "Aktivieren der erweiterten Vergleichsfunktion für die Qualität der Werte",
            EnableAdvancedStatsHelp: "Ermöglicht erweiterte Min/Max-Funktionen im Verschieben-Dialog und aktiviert die Rüstungsvergleichsansicht.",
            ShowOverlay: "Zeige neue Gegenstände mit einem Overlay",
            ShowOverlayHelp: "Zeigt neue Gegenstände mit einem hellen Overlay an.",
            ShowAnimations: "Zeige animiertes Overlay bei neuen Gegenständen an",
            ShowAnimationsHelp: "Zeigt ein animiertes Overlay bei neuen Gegenständen an. Abschalten verringert die CPU Auslastung.",
            ShowElemental: "Zeige Elementarschaden bei Waffen an",
            ShowElementalHelp: "Zeigt den Elementarschaden bei Waffen an.",
            SetSort: "Sortiere Gegenstände nach:",
            SetSortHelp: "Sortieren von Gegenständen nach Seltenheit oder ihrem primären Statuswert.",
            SortPrimary: "Primärer Wert",
            SortRarity: "Seltenheit",
            SortRoll: "Roll-Wert Prozent",
            InventoryColumns: "Charakter Inventar Spalten",
            InventoryColumnsHelp: "Wähle die Anzahl der Spalten für das Charakter Inventar.",
            VaultColumns: "Maximale Anzahl von Spalten des Tresors",
            VaultColumnsHelp: "Wähle die maximale Anzahl von Spalten für den Tresor aus.",
            SizeItem: "Item Größe",
            SizeItemHelp: "Wie groß sollen die Gegenstände sein?",
            ResetToDefault: "Zurücksetzen auf Standard",
            CharacterOrder: "Charakter Reihenfolge",
            CharacterOrderHelp: "Charakter können nach dem letzten Login oder ihrem Erstelldatum sortiert werden.",
            CharacterOrderRecent: "Nach zuletzt aktivem Charakter",
            CharacterOrderReversed: "Nach zuletzt aktivem Charakter (umgekehrt)",
            CharacterOrderFixed: "Fest (Nach Alter des Charakters)",
            ExportSS: "Lade Tabelle herunter",
            ExportSSHelp: "Lade eine CSV-Tabelle von deinen Gegenständen herunter, die leicht mit jedem Tabellenprogramm angezeigt werden kann.",
            DIMPopups: "DIM Info Popups",
            DIMPopupsReset: "Zeige zuvor versteckte Info Tipps"
          },
          Stats: {
            Discipline: "Disziplin",
            Intellect: "Intellekt",
            NoBonus: "Kein Bonus",
            OfMaxRoll: "{range} des max. Rolls",
            PercentHelp: "Klicke für mehr Informationen über die Qualität der Werte.",
            Quality: "Qualität der Werte",
            Strength: "Stärke",
            TierProgress: "{progress} für {tier}"
          },
          StoreBucket: {
            FillStack: "Stapel auffüllen ({amount})",
            HowMuch: "Wie viele {itemname} sollen verschoben werden?",
            Move: "Verschieben"
          },
          Tags: {
            TagItem: "Item markieren",
            Favorite: "Favorit",
            Junk: "Müll",
            Infuse: "Infundieren",
            Keep: "Behalten"
          },
          Vendors: {
            Vendors: "Händler",
            All: "Alle",
            Available: "Verfügbar auf",
            Compare: "Vergleiche mit dem was du bereits hast",
            Day: "{numDays, plural, =1{Tag} other{Tage}}",
            Load: "Lade Händler",
            ArmorAndWeapons: "Panzerung & Waffen",
            ShipsAndVehicles: "Schiffe & Fahrzeuge",
            Consumables: "Verbrauchsgegenstände",
            Bounties: "Beutezüge",
            ShadersAndEmblems: "Shader & Abzeichen",
            Emotes: "Gesten"
          },
          TrialsCard: {
            FiveWins: "5 Siege Belohnung (Rüstung)",
            SevenWins: "7 Siege Belohnung (Waffe)",
            Flawless: "Makellos"
          }
        })
        .translations('fr', {
          Level: "Niveau",
          Bucket: {
            Armor: "Armure",
            General: "Général",
            Postmaster: "Commis des postes",
            Progress: "Progrès",
            Reputation: "Estime",
            Show: "Afficher {bucket}",
            Unknown: "Inconnu",
            Vault: "Coffres",
            Weapons: "Armes"
          },
          BungieService: {
            Down: "Bungie.net est hors service.",
            Difficulties: "L'API de Bungie rencontre actuellement des difficultés.",
            NetworkError: "Erreur de réseau - {status} {statusText}",
            Throttled: "La limite de connections à l'API de Bungie a été atteinte. Veuillez réessayer plus tard.",
            NotLoggedIn: "Veuillez vous connecter sur Bungie.net pour utiliser cette extension.",
            Maintenance: "Les serveurs Bungie.net sont indisponibles pour cause de maintenance.",
            NoAccount: "Aucun compte Destiny n'a été trouvé pour cette platforme. Avez-vous sélectionné la bonne platforme?",
            NoAccountForPlatform: "Nous n'avons pas trouvé de compte Destiny pour vous sur {platform}.",
            NotConnected: "Vous n'êtes probablement pas connecté à Internet.",
            Twitter: "Tenez-vous informer sur",
            ItemUniqueness: "Unicité d'un objet",
            ItemUniquenessExplanation: "Vous avez essayé de déplacer '{name}' {type} sur votre {character} mais cette destination a déjà cet objet et n'en autorise qu'un."
          },
          Cooldown: {
            Grenade: "Régénération de Grenade",
            Melee: "Régénération de Mêlée",
            Super: "Régénération du Super"
          },
          Debug: {
            Dump: "Envoyer les infos sur la console",
            View: "Afficher les infos de débug de l'objet."
          },
          FarmingMode: {
            FarmingMode: "Mode Farming (transfert d'objets)",
            Desc: "DIM est entrain de transférer des engrammes et objets pour Glimmer du {store} aux coffres et laisse un espace disponible pour chaque type d'objet afin d'éviter que rien ne soit envoyé au commis des postes.",
            Configuration: "Configuration",
            MakeRoom: {
              Desc: "DIM est entrain de transférer uniquement les engrammes et objets pour Glimmer du {store} aux coffres ou autres persos afin d'éviter que rien ne soit envoyé au commis des postes.",
              MakeRoom: "Faites de la place pour collecter des objets en déplaçant de l'équipement",
              Tooltip: "Si activé, DIM déplacera les armes at armures afin de faire de la place dans les coffres pour les engrammes."
            },
            Quickmove: "Déplacement rapide",
            Stop: "Stop"
          },
          Header: {
            About: "À propos",
            Filters: "Filtres",
            FilterHelp: "Rechercher objet/amélioration ou is:arc",
            MaterialsExchange: "Rangs de faction disponibles",
            Refresh: "Rafraîchir les données Destiny",
            SupportDIM: "Soutien DIM"
          },
          Help: {
            BackToDIM: "Retour sur DIM",
            Drag: "Maintenez shift ou stoppez au-dessus d'une zone de dépôt pour transférer une partie de la pile."
          },
          ItemService: {
            PercentComplete: "({ percent | percent } Achevée)"
          },
          LB: {
            LB: "Constructeur de Loadout",
            ShowGear: "Afficher équipement de {class}",
            HideGear: "Cacher équipement de {class}",
            LockEquipped: "Verrouiller équipé",
            ClearLocked: "Enlever verrouillés",
            Locked: "Objets verrouillés",
            LockedHelp: "Glissez et déplacez un objet dans cet espace pour construire votre set avec cet équipement. Shift + clique pour exclure les objets",
            FilterSets: "Filtrer les sets",
            AdvancedOptions: "Options avancées",
            ProcessingMode: {
              Fast: "Rapide",
              Full: "Complet",
              ProcessingMode: "Mode de processing",
              HelpFast: "Ne se concentre que sur votre meilleur équipement.",
              HelpFull: "Se concentre sur plus d'équipements, mais prend plus de temps."
            },
            Scaled: "Échelonné",
            Current: "Actuel",
            LightMode: {
              LightMode: "Mode lumière",
              HelpScaled: "Calcule les loadouts comme si tous les objets avaient 350 de défense.",
              HelpCurrent: "Calcule les loadouts à leur niveau de défense actuel."
            },
            IncludeRare: "Inclure les objets rares (bleus)",
            Help: "Besoin d'aide?",
            Equip: "Équiper sur le perso actuel",
            ShowAllConfigs: "Afficher toutes les configurations",
            ShowConfigs: "Afficher les configurations",
            HideAllConfigs: "Cacher toutes les configurations",
            HideConfigs: "Cacher les configurations",
            Loading: "Chargement des meilleurs sets",
            Vendor: "Inclure objets de marchands",
            Exclude: "Objets exclus",
            ExcludeHelp: "Shift + cliquez un objet (ou glissez-déposez dans cet espace) pour construire des sets sans équipement spécifique.",
            LockPerk: "Verrouiller amélioration",
            Missing1: "Pièces légendaires ou éxotiques manquantes pour construire un set complet!",
            Missing2: "Pièces rares, légendaires ou éxotiques manquantes pour construire un set complet!"
          },
          Loadouts: {
            Any: "Tout",
            Loadouts: "Loadouts",
            Before: "Avant '{name}'",
            Create: "Créer Loadout",
            FromEquipped: "Equipé",
            Edit: "Modifier Loadout",
            Delete: "Effacer Loadout",
            ConfirmDelete: "Êtes-vous sûr de vouloir supprimer '{name}'?",
            ApplySearch: "Objets = \"{query}\"",
            MaximizeLight: "Maximiser la Lumière",
            ItemLeveling: "Evolution d'objet",
            GatherEngrams: "Réunir les Engrammes",
            GatherEngramsExceptExotics: "Exotiques",
            RestoreAllItems: "Tous les objets",
            Random: "Aléatoire",
            LoadoutName: "Nom du loadout...",
            Save: "Sauvegarder",
            SaveAsNew: "Sauvegarder comme nouveau",
            Cancel: "Annuler",
            ItemsWithIcon: "Les objets avec cet icone seront équipés. Cliquez sur un bouton d'objet pour l'équiper.",
            AppliedAuto: "Constructeur de Loadout automatique",
            Applied: "Votre loadout de {amount} objets a été transféré à votre {store}",
            AppliedError: "Aucun des objets de votre loadout n'a pu être transféré.",
            AppliedWarn: "Votre loadout a été partiellement transféré, mais {failed} sur {total} objets ont échoué."
          },
          Manifest: {
            Build: "Base de données d'info de Destiny en cours de construction",
            Download: "Téléchargement en cours des derniers infos Destiny de Bungie",
            Error: "Erreur de chargement des infos Destiny:\n{error}\nRedémarrez pour rééssayer.",
            Outdated: "Infos Destiny expirées",
            OutdatedExplanation: "Bungie a mis à jour les base de données de Destiny. Redémarrez DIM pour charger les nouvelles informations. Notez que certaines fonctionalités de DIM puissent ne pas fonctionner pendant quelques heures après que Bungie mette à jour Destiny, le temps que les nouvelles données se propagent dans leur système.",
            BungieDown: "Bungie.net rencontre des problèmes.",
            Load: "Chargement des données sauvegardées de Destiny",
            LoadCharInv: "Chargement des persos et des inventaires de Destiny",
            Save: "Sauvegarde des dernières données de Destiny",
            Unzip: "Désarchivage des dernières données de Destiny"
          },
          Notes: {
            Error: "Erreur! Max 120 charactères pour les notes.",
            Help: "Ajouter des notes à cet objet"
          },
          Settings: {
            Settings: "Paramètres",
            Language: "Langue (redémarrez DIM pour prendre effet)",
            HideUnfiltered: "Cacher les objets non filtrés pendant le filtrage",
            HideUnfilteredHelp: "Les objets qui ne correspondent pas aux critères de filtrage seront cachés.",
            AlwaysShowDetails: "Toujours afficher les détails de l'objet",
            AlwaysShowDetailsHelp: "Cliquer sur un objet affichera toujours un popup pouvant être agrandi pour afficher les stats et améliorations. Cette option les affichera toujours quand vous cliquerez sur un objet.",
            EnableAdvancedStats: "Activer les fonctionalités de comparaison de qualité de stat avancée",
            EnableAdvancedStatsHelp: "Activera les fonctionalités avancées de min/max dans le dialogue de déplacement et activera la vue de comparaison d'armure.",
            ShowOverlay: "Afficher les nouveaux objets avec un indicateur",
            ShowOverlayHelp: "Afficher les nouveaux objets avec un indicateur.",
            ShowAnimations: "Afficher les animations pour les nouveaux objets",
            ShowAnimationsHelp: "Affichera les animations pour les nouveaux objets. Désactiver cette option peut améliorer les performances du CPU.",
            ShowElemental: "Afficher les icônes d'élément de dégât sur les armes",
            ShowElementalHelp: "Afficher les icônes d'élément de dégât sur les armes.",
            SetSort: "Ordonner les objets par:",
            SetSortHelp: "Ordonner les objets par rareté ou par la valeur de leur stat première.",
            SortPrimary: "Stat première",
            SortRarity: "Rareté",
            SortRoll: "Pourcentage de roulement de stat",
            InventoryColumns: "Colonnes d'Inventaire de Perso",
            InventoryColumnsHelp: "Sélectionner le nombre de colonnes pour l'inventaire de votre perso.",
            VaultColumns: "Maximum de Colonnes de l'Inventaire des Coffres",
            VaultColumnsHelp: "Sélectionner le nombre maximum de colonnes pour l'inventaire des Coffres.",
            SizeItem: "Taille d'un objet",
            SizeItemHelp: "Quelle taille devrait être les objets?",
            ResetToDefault: "Réinitialiser par défaut",
            CharacterOrder: "Ordre de Perso",
            CharacterOrderHelp: "Les persos peuvent être ordonnés par dernière connexion ou par leur date de création.",
            CharacterOrderRecent: "Par le Plus Récent",
            CharacterOrderReversed: "Par le Plus Récent (Inversé)",
            CharacterOrderFixed: "Fixe (Par Age du Perso)",
            ExportSS: "Télécharger le Tableur",
            ExportSSHelp: "Télécharger une liste CSV de vos objets qui peut être facilement visualisée dans l'app de votre choix.",
            DIMPopups: "Popups d'Info de DIM",
            DIMPopupsReset: "Réinitialiser les astuces cachées précédentes"
          },
          Stats: {
            Discipline: "Discipline",
            Intellect: "Intelligence",
            NoBonus: "Pas de Bonus",
            Strength: "Force",
            TierProgress: "{progress} pour {tier}"
          },
          Tags: {
            TagItem: "Tagger Objet",
            Favorite: "Préféré",
            Junk: "Camelote",
            Infuse: "Infuser",
            Keep: "Garder"
          },
          Vendors: {
            Vendors: "Marchands",
            All: "Tous",
            Day: "{numDays, plural, =1{Journée} other{Journées}}",
            Load: "Chargement des Marchands",
            ArmorAndWeapons: "Armure & Armes",
            ShipsAndVehicles: "Vaisseaux & Véhicules",
            Consumables: "Consommables",
            Bounties: "Contrats",
            ShadersAndEmblems: "Revêtements & Emblèmes",
            Emotes: "Intéractions"
          },
          TrialsCard: {
            FiveWins: "Récompense à 5 Victoires (Armure)",
            SevenWins: "Récompense à 7 Victoires (Arme)",
            Flawless: "Sans Défaite"
          }
        })
        .translations('es', {
          Level: "Nivel",
          Bucket: {
            Armor: "Armadura",
            General: "General",
            Postmaster: "Administración",
            Progress: "Progreso",
            Reputation: "Reputación",
            Show: "Muestra {bucket}",
            Unknown: "Desconocido",
            Vault: "Depósito",
            Weapons: "Armas"
          },
          BungieService: {
            DevVersion: "¿Estás corriendo una versión de desarrollo de DIM? Debes primero registrar tu extensión de Chrome con Bungie.net.",
            Down: "Bungie.net no esta disponible.",
            Difficulties: "La API de Bungie esta teniendo dificultades.",
            NetworkError: "Error de red - {status} {statusText}",
            Throttled: "El límite de saturación de la API de Bungie se ha excedido. Por favor espere un poco y vuelva a intentarlo.",
            NotLoggedIn: "Por favor inicie sesión en Bungie.net para poder usar esta extensión.",
            Maintenance: "Los servidores de Bungie.net se encuentran en mantenimiento.",
            NoAccount: "No se encontró una cuenta de Destiny para esta plataforma. Has elegido la plataforma correcta?",
            NoAccountForPlatform: "No encontramos una cuenta de Destiny para {platform}.",
            NoCookies: "No se encontraron cookies.",
            NotConnected: "Es posible que no tengas conexión a Internet.",
            Twitter: "Entérate de los estados de actualizaciones",
            ItemUniqueness: "Unicidad de objeto",
            ItemUniquenessExplanation: "Intentáste mover el '{name}' {type} a tu {character} pero ese destino ya cuenta con ese objeto y solo puede tener uno."
          },
          Compare: {
            All: "Comparaciones de {type} ({quantity})",
            Archetype: "Comparaciones de arquetipo ({quantity})",
            ButtonHelp: "Compara Elementos",
            Compare: "Comparar",
            Close: "Cerrar",
            Error: {
              Class: "No se puede comparar este objeto ya que no es para {class}.",
              Archetype: "No se puede comparar este objeto ya que no es {type}."
            },
            Splits: "Comparar partes similares ({quantity})"
          },
          Cooldown: {
            Grenade: "Tiempo para Granada",
            Melee: "Tiempo para Cuerpo a cuerpo",
            Super: "Tiempo para Super"
          },
          Debug: {
            Dump: "Tirar información a la consola",
            View: "Ver información de depuración de objeto"
          },
          DidYouKnow: {
            DidYouKnow: "¿Sabias que?",
            Collapse: "Acabas de colapsar una seccion en DIM!. Esto puede ser util para ocultar partes de DIM que no necesitas usar normalmente.",
            DontShowAgain: "No muestres este consejo de vuelta",
            DoubleClick: "Si estas moviendo un objeto a tu personaje activo (último al que iniciaste sesión), puedes darle doble click al objeto para equiparlo instantáneamente.",
            DragAndDrop: "Los objetos pueden ser arrastrados y soltados entre diferentes columnas de personajes o bóveda.",
            Expand: "Para expandir de nuevo una sección, simplemente da click en el símbolo de más a la izquierda de la categoría que colapsaste.",
            TryNext: "¡Pruébalo la próxima vez!"
          },
          FarmingMode: {
            FarmingMode: "Modo recolector (mover objetos)",
            Desc: "DIM esta moviendo Engramas y objetos de Lúmen desde {store} hacia el depísoto y dejando un espacio abierto por cada tipo de objeto para prevenir que cualquier cosa se vaya a la Administración.",
            Configuration: "Configuración",
            MakeRoom: {
              Desc: "DIM esta moviendo solo Engramas y objetos de Lúmen desde {store} al depósito o a otros personajes para prevenir que se vayan a la Administración.",
              MakeRoom: "Hacer espacio para coger objetos moviendo equipamiento",
              Tooltip: "Si esta marcado, DIM va a mover armas y armadura para hacer espacio en el depósito para Engramas."
            },
            OutOfRoom: "Ya no hay espacio para mover objetos fuera de tu  {character}. ¡Es hora de desencriptar algunos engramas y limpiar la basura!",
            Quickmove: "Movimiento rápido",
            Stop: "Detener"
          },
          Filter: {
            EnterName: "Escribe el nombre de un objeto:",
            EnterNote: "Escribe texto de las notas:"
          },
          Header: {
            About: "Acerca de",
            Filters: "Filtros",
            FilterHelp: "Buscar objeto/beneficio o is:arc",
            MaterialsExchange: "Rangos de facción disponible",
            Refresh: "Actualizar datos de Destiny",
            SupportDIM: "Apoyo DIM"
          },
          Help: {
            BackToDIM: "Regresar a DIM",
            CannotMove: "No puedes mover este objeto de este personaje.",
            Drag: "Mantén presionado Shift o pausa sobre la zona de soltar para transferir un montón parcial",
            ChangingPerks: "Cambio de beneficios no soportado",
            ChangingPerksInfo: "Lo sentimos, no hay forma de cambiar beneficios afuera del juego. ¡Quisiéramos poder hacerlo!",
            HidePopup: "Esconde Esta Ventana",
            NeverShow: "Nunca mostrar esto de nuevo.",
            UpgradeChrome: "Por favor actualice Chrome",
            Version: {
              Beta: "La Beta ha sido actualizada a la v$DIM_VERSION",
              Stable: "DIM v$DIM_VERSION ha sido Publicado"
            },
            Xur: "Xûr esta aquí."
          },
          Hotkey: {
            StartSearch: "Empezar una búsqueda",
            RefreshInventory: "Actualizar inventario",
            ToggleDetails: "Mostrar detalles completos de objeto",
            MarkItemAs: "Marcar objeto como '{tag}'",
            ClearNewItems: "Despejar objetos nuevos"
          },
          Infusion: {
            Infusion: "Buscador de Combustible de Infusión.",
            BringGear: "Traerá el equipo a",
            Calc: "Calculador de Infusión",
            InfuseItems: "Selecciona un objeto para infusionar:",
            InfusionMaterials: "Materiales para Infusionar",
            LockedItems: "Incluir objetos 'bloqueados'",
            NoItems: "No hay objetos disponibles para infusionar.",
            NoTransfer: "El material para infusionar\n{target} no puede ser movido.",
            ShowItems: "Mostrar objetos infundibles en el Depósito y todos los personajes",
            TransferItems: "Transferir objetos",
            Using3: "usando 3"
          },
          ItemMove: {
            Consolidate: "Consolidado {name} ",
            Distributed: "{name} distribuidos. Ahora {name} se encuentra dividido entre los personajes de manera equitativa.",
            ToVault: "Todos los {name} ahora están en tu Depósito",
            ToStore: "Todos los {name} ahora están en tu {store}"
          },
          ItemService: {
            BucketFull: "Hay muchos objetos de tipo '{itemtype}' {isVault, select, true{en la} false{en tu}} {store}.",
            Classified: "Este objeto es 'clasificado' y no puede transferirse en este momento",
            Classified2: "Objeto 'clasificado'. Bungie no a entregado información acerca de este objeto.  Este objeto todavía no es transferible.",
            Deequip: "No se encontró otro objeto a equipar para desequipar  {itemname}",
            ExoticError: "'{itemname}' no puede ser equipado porque el objeto exótico en el espacio {slot} no puede ser desequipado. ({error})",
            NotEnoughRoom: "No hay nada que podamos sacar fuera de {store} para hacerle espacio a {itemname}",
            OnlyEquippedLevel: "Esto solo puede equiparse en personajes de nivel igual o superior a {level}",
            OnlyEquippedClassLevel: "Esto solo puede equiparse en un {class} de nivel igual o superior a {level}.",
            PercentComplete: "({ percent | percent } Completar)",
            TooMuch: "Parece que pediste mover más objetos de los que existen en la fuente!",
            TwoExotics: "No sabemos cómo conseguiste equipar más de 2 exóticas!"
          },
          LB: {
            LB: "Creador de equipo",
            Guardians: " Guardianes",
            ShowGear: "Mostrar equipo de {class}",
            HideGear: "Ocultar equipo de {class}",
            LockEquipped: "Bloquear equipado",
            ClearLocked: "Quitar bloqueo",
            Locked: "Objetos bloqueados",
            LockedHelp: "Arrastrar y soltar cualquier objeto en su cubeta para crear conjunto con ese equipamiento específico. Shift + click para excluir objetos.",
            FilterSets: "Conjuntos de filtros",
            AdvancedOptions: "Opciones avanzadas",
            ProcessingMode: {
              Fast: "Rápido",
              Full: "Completo",
              ProcessingMode: "Modo de procesamiento",
              HelpFast: "Solo ve tu mejor equipo.",
              HelpFull: "Ve más equipo, pero tarda más."
            },
            Scaled: "Escalado",
            Current: "Actual",
            LightMode: {
              LightMode: "Modo ligero",
              HelpScaled: "Calcula los equipos como si todos los objetos tuvieran 350 de defensa.",
              HelpCurrent: "Calcula los equipos con los nieveles de defensa actuales."
            },
            IncludeRare: "Incluir objetos raros (azules)",
            Help: "Necesitas ayuda?",
            Equip: "Equipar al personaje actual",
            ShowAllConfigs: "Mostrar todas las configuraciones",
            ShowConfigs: "Mostrar configuraciones",
            HideAllConfigs: "Ocultar todas las configuraciones",
            HideConfigs: "Ocultar configuraciones",
            Loading: "Cargar mejores equipos",
            Vendor: "Incluir objetos de vendedores",
            Exclude: "Objetos excluidos",
            ExcludeHelp: "Shift + click en un objeto (o arrástralo y suéltalo en esta cubeta) para crear un conjunto sin equipo específico.",
            LockPerk: "Bloquear mejora",
            Missing1: "Faltan piezas legendarias o exóticas para crear un conjunto completo!",
            Missing2: "Faltan piezas raras, legendarias o exóticas para crear un conjunto completo!"
          },
          Loadouts: {
            Any: "Alguna",
            Loadouts: "Equipos",
            Before: "Antes '{name}'",
            Create: "Crear Equipo",
            FromEquipped: "Equipado",
            Edit: "Editar equipo",
            Delete: "Borrar equipo",
            ConfirmDelete: "Estas seguro de que quieres borrar '{name}'?",
            ApplySearch: "Objetos = \"{query}\"",
            MaximizeLight: "Maximizar Luz",
            ItemLeveling: "Nivel de objetos",
            GatherEngrams: "Juntar engramas",
            GatherEngramsExceptExotics: "Exóticos",
            RestoreAllItems: "Todos los objetos",
            Random: "Aleatorio",
            Randomize: "Aleatorizar las armas, armaduras, carcasa y artefacto equipados?",
            VendorsCannotEquip: "Estos objetos de vendedores no pueden equiparse:",
            VendorsCanEquip: "Estos objetos pueden equiparse:",
            MaxSlots: "Solo puedes tener {slots} objetos de ese tipo en una configuración",
            OnlyItems: "Solo objetos equipables, materiales, y consumibles pueden añadirse a una configuración",
            FilteredItems: "Objetos filtrados",
            NoEngrams: "No hay engramas no exóticos disponibles para transferir",
            NoExotics: "No hay engramas disponibles para transferir",
            LoadoutName: "Nombre de equipo...",
            Save: "Guardar",
            SaveAsNew: "Guardar como nuevo",
            Cancel: "Cancelar",
            ItemsWithIcon: "Objetos con éste ícono van a ser equipados. Click en un objeto para equipar.",
            CouldNotEquip: "No se pudo equipar {itemname}",
            TooManyRequested: "Tu tienes {total} {itemname} pero tu configuración pregunta por {requested}. Transferimos todo lo que tenías.",
            DoesNotExist: "{itemname} no existe en tu cuenta.",
            AppliedAuto: "Crear automático de equipo",
            Applied: "Tu equipo de {amount, plural, =1{un objeto ha sido transferido} other{# objetos han sido transferidos}} a tu {store}.",
            AppliedError: "Ninguno de los objetos en tu equipo pudo ser transferido.",
            AppliedWarn: "Tu equipo ha sido parcialmente transferido, pero {failed} de {total} objetos tuvieron errores.",
            NameRequired: "Se necesita un nombre",
            MakeRoom: "Hacer espacio en la Administración",
            MakeRoomDone: "Se terminó de hacer espacio para {postmasterNum, plural, =1{1 objeto de la Administración} other{# objetos de la Administración}} al mover {movedNum, plural, =1{1 objeto} other{# objetos}} fuera de {store}.",
            MakeRoomError: "Imposible hacer espacio para todos los objetos en la Administración: {error}."
          },
          Manifest: {
            Build: "Creando información de la base de datos de Destiny",
            Download: "Descargando información más actualizada de Destiny desde Bungie",
            Error: "Error cargando Destiny info:\n{error}\n Carga de nuevo para volver a intentarlo.",
            Outdated: "Información de Destiny obsoleta",
            OutdatedExplanation: "Bungie ha actualizado su información de base de datos de Destiny. Recarga DIM para cargar la información nueva. Toma en cuenta que puede que DIM no funcione por algunas horas después de que Bungie actualiza Destiny, mientras que los nuevos datos se propagan por sus sistemas.",
            BungieDown: "Bungie.net puede estar teniendo problemas.",
            Load: "Cargando información de Destiny guardada",
            LoadCharInv: "Cargando personajes e inventario de Destiny",
            Save: "Guardando última información de Destiny",
            Unzip: "Descomprimiendo última información de Destiny"
          },
          MaterialsExchange: {
            MaterialsExchange: "Intercambio de materiales",
            CurrentRank: "Rango actual",
            CurrentRep: "Reputación actual",
            OnHand: "Materiales a la mano",
            FromTrade: "Materiales de intercambio",
            NewRank: "Nuevo rango",
            NewRep: "Nueva reputación"
          },
          MovePopup: {
            Consolidate: "Consolida",
            DistributeEvenly: "Distribuye Equitativamente",
            Equip: "Poner",
            Split: "Partir",
            Store: "Meter",
            Take: "Tomar",
            Vault: "Bóveda"
          },
          Notes: {
            Error: "Error! Máximo 120 caracteres por notas.",
            Help: "Agregar notas a este artículo"
          },
          Postmaster: {
            Limit: "Límite de Administración",
            Desc: "Hay 20 objetos perdidos en la Administración en tu {store}. Nuevos objetos reemplazarán los ya existentes"
          },
          Settings: {
            Settings: "Configuración",
            Language: "Lenguaje (recarga DIM para que se apliquen los cambios)",
            HideUnfiltered: "Ocultar objetos sin filtro mientras se filtran",
            HideUnfilteredHelp: "Objetos que no cumplan con el criterio serán escondidos",
            AlwaysShowDetails: "Siempre mostrar detalles de objeto",
            AlwaysShowDetailsHelp: "Hacer click en un objeto va a mostrar una ventana emergente que puede ser expandida para mostrar mejoras y detalles de estadísticas.  Ésta opción siempre va a mostrar ese detalle cuando hagas click en un objeto.",
            EnableAdvancedStats: "Habilitar características comparativas de calidad de mejoras",
            EnableAdvancedStatsHelp: "Habilitará características avanzadas de mín/máx en el diálogo móvil y habilitará vista de comparación de armadura.",
            ShowOverlay: "Mostrar objetos nuevos con una cobertura",
            ShowOverlayHelp: "Mostrará objetos nuevos con una cobertura.",
            ShowAnimations: "Mostrar cobertura animada en nuevos objetos.",
            ShowAnimationsHelp: "Mostrará la cobertura animada en objetos nuevos. Apagando esto puede ahorrar ciclos de procesamiento.",
            ShowElemental: "Mostrar ícono de daño elemental en armas",
            ShowElementalHelp: "Mostrará ícono de daño elemental en armas.",
            SetSort: "Ordernar objetos por:",
            SetSortHelp: "Ordernar objetos por rareza o por sus valores estadísticos.",
            SortPrimary: "Estadística primaria",
            SortRarity: "Rareza",
            SortRoll: "Porcentaje de valor de estadísticas",
            InventoryColumns: "Columnas de Inventario de personaje",
            InventoryColumnsHelp: "Seleccionar el número de columnas por inventario de personaje.",
            VaultColumns: "Máximo número de columnas del Inventario",
            VaultColumnsHelp: "Seleccionar el máximo número de columnas para el depósito.",
            SizeItem: "Tamaño de objetos",
            SizeItemHelp: "Qué tan grande deben verse los objetos?",
            ResetToDefault: "Reestablecer a Predeterminado",
            CharacterOrder: "Órden de personajes",
            CharacterOrderHelp: "Los personajes pueden ser ordenados por última sesión iniciada o por su fecha de creación.",
            CharacterOrderRecent: "Por el personaje más reciente",
            CharacterOrderReversed: "Por el personaje más reciente (Reverso)",
            CharacterOrderFixed: "Fijo (Por la edad del personaje)",
            ExportSS: "Descargar hojas de cálculo",
            ExportSSHelp: "Descargar una lista CSV de tus objetos que puede ser vista fácilmente en una aplicación de hojas de cálculo de tu preferencia.",
            DIMPopups: "Ventanas emergentes de información de DIM",
            DIMPopupsReset: "Reestablecer tips de información anteriormente escondidos"
          },
          Stats: {
            Discipline: "Disciplina",
            Intellect: "Intelecto",
            NoBonus: "Sin beneficio",
            OfMaxRoll: "{range} del máximo posible de estadísticas",
            PercentHelp: "Haz click para más información acerca de su calidad estadística.",
            Quality: "Calidad Estadística",
            Strength: "Fuerza",
            TierProgress: "{progress} por {tier}"
          },
          StoreBucket: {
            FillStack: "Llena la pila ({amount})",
            HowMuch: "Cuántos {itemname} quieres mover?",
            Move: "Mover"
          },
          Tags: {
            TagItem: "Elemento de Etiqueta",
            Favorite: "Favorito",
            Junk: "Basura",
            Infuse: "Infundir",
            Keep: "Guardar"
          },
          Vendors: {
            Vendors: "Comerciantes",
            All: "Todo",
            Available: "Disponible en",
            Compare: "Comparar con lo que ya tienes",
            Day: "{numDays, plural, =1{Día} other{Días}}",
            Load: "Cargando comerciantes",
            ArmorAndWeapons: "Armadura y armas",
            ShipsAndVehicles: "Naves y vehículos",
            Consumables: "Consumíbles",
            Bounties: "Contratos",
            ShadersAndEmblems: "Shaders & Emblemas",
            Emotes: "Gestos"
          },
          TrialsCard: {
            FiveWins: "Recompensa de 5 victorias (Armadura)",
            SevenWins: "Recompensa de 7 victorias (Arma)",
            Flawless: "Invicto"
          }
        })
        .translations('ja', {
          Level: "レベル",
          Bucket: {
            Armor: "生命力",
            General: "全般",
            Postmaster: "ポストマスター",
            Progress: "進行状況",
            Reputation: "ランク",
            Show: "表示 {bucket}",
            Unknown: "不明",
            Vault: "保管庫",
            Weapons: "武器"
          },
          BungieService: {
            DevVersion: "DIMの開発版を使用していますか？ bungie.netにクロムエクステンションを登録する必要があります。",
            Down: "Bungie.net に接続不可。",
            Difficulties: "Bungie APIは今困難を経験します。",
            NetworkError: "ネットワークエラー。{status} {statusText}",
            NotLoggedIn: "この拡張を利用するためには、Bungie.net にログインしてください。",
            Maintenance: "Bungie.net サーバーがメンテナンス中。",
            NoAccountForPlatform: "{platform} でのデスティニーアカウントが見つかりません。",
            NotConnected: "インターネットに接続してない可能性あります。",
            ItemUniquenessExplanation: "'{name}' {type} を {character} に移動しようとしましたが、同様のアイテムがあり、一個以上を持てません。"
          },
          Compare: {
            Compare: "比較",
            Close: "終了",
            Error: {
              Class: "このアイテム {class} 用のため、比較できません。",
              Archetype: "このアイテムは {type} ではないため、比較できません。"
            }
          },
          DidYouKnow: {
            DidYouKnow: "知っていますか？",
            DontShowAgain: "このヒントをもう一度表示しない",
            TryNext: "今度お試しください。"
          },
          FarmingMode: {
            FarmingMode: "アイテム収集モード (アイテム移動)",
            Quickmove: "素早く移動",
            Stop: "停止"
          },
          Filter: {
            EnterName: "アイテム名を入力してください。"
          },
          Header: {
            About: "情報",
            Filters: "フィルター",
            SupportDIM: "DIMを支援する"
          },
          ItemService: {
            PercentComplete: "({ percent | percent } 完了)"
          },
          Loadouts: {
            Loadouts: "ロードアウト",
            Create: "ロードアウトを作成",
            FromEquipped: "装備している",
            Edit: "ロードアウトを編集",
            Delete: "ロードアウトを削除",
            ApplySearch: "アイテム = \"{query}\"",
            MaximizeLight: "光レベルを最大化",
            ItemLeveling: "アイテムのレベルアップ",
            GatherEngrams: "エングラム収集",
            GatherEngramsExceptExotics: "エキゾチック",
            RestoreAllItems: "全アイテム",
            Random: "ランダム",
            Save: "保存",
            SaveAsNew: "新規で保存",
            Cancel: "キャンセル"
          },
          MovePopup: {
            Vault: "保管庫"
          },
          Notes: {
            Help: "このアイテムにメモを追加"
          },
          Settings: {
            Settings: "設定",
            SortRarity: "レア度"
          },
          Stats: {
            Discipline: "鍛錬",
            Intellect: "知性",
            Strength: "腕力"
          },
          Tags: {
            TagItem: "アイテムをタグする",
            Favorite: "お気に入り",
            Junk: "不要",
            Infuse: "融合する",
            Keep: "保管"
          },
          Vendors: {
            Vendors: "ベンダー",
            Day: "日間",
            Load: "ローディングベンダー",
            ArmorAndWeapons: "アーマーとウェポン",
            ShipsAndVehicles: "船とビークル",
            Consumables: "消費アイテム",
            Bounties: "バウンティ",
            ShadersAndEmblems: "シェーダーとエンブレム",
            Emotes: "感情表現"
          }
        })
        .translations('pt-br', {
          Level: "Nível",
          Bucket: {
            Armor: "Armaduras",
            General: "Geral",
            Postmaster: "Chefe do Correio",
            Progress: "Progresso",
            Reputation: "Reputação",
            Show: "Exibir {bucket}",
            Unknown: "Desconhecido",
            Vault: "Cofre",
            Weapons: "Armas"
          },
          BungieService: {
            DevVersion: "Você está executando uma versão de desenvolvimento do DIM? Você deve registrar sua extensão do Chrome no Bungie.net.",
            Down: "Bungie.net está fora do ar.",
            Difficulties: "A API da Bungie está atualmente passando por dificuldades.",
            NetworkError: "Erro de rede - {status} {statusText}",
            Throttled: "Limite de acesso à API da Bungie API excedido. Por favor, aguarde um pouco e tente novamente.",
            NotLoggedIn: "Por favor, faça seu login no Bungie.net para utilizar esta extensão.",
            Maintenance: "Servidores Bungie.net estão fora do ar para manutenção.",
            NoAccount: "Nenhuma conta de Destiny foi encontrada para esta plataforma. Você selecionou a plataforma correta?",
            NoAccountForPlatform: "Incapaz de encontrar uma conta de Destiny no {platform}.",
            NoCookies: "Nenhum cookie encontrado.",
            NotConnected: "Você deverá estar sem conexão com a Internet.",
            Twitter: "Veja atualizações em",
            ItemUniqueness: "Unicidade de itens",
            ItemUniquenessExplanation: "Você tentou mover o {type} '{name}' para seu {character} mas o local de destino já possui um item do tipo."
          },
          Compare: {
            All: "Comparações de {type} ({quantity})",
            Archetype: "Comparações de arquétipo ({quantity})",
            ButtonHelp: "Comparar itens",
            Compare: "Comparar",
            Close: "Fechar",
            Error: {
              Class: "Incapaz de comparar o item, pois não é um item de {class}.",
              Archetype: "Incapaz de comaprar o item, pois não é um {type}."
            },
            Splits: "Compare com atributos similares ({quantity})"
          },
          Cooldown: {
            Grenade: "Tempo de carga da granada",
            Melee: "Tempo de carga do corpo-a-corpo",
            Super: "Tempo de carga da Super"
          },
          Debug: {
            Dump: "Enviar informação ao console",
            View: "Visualizar informações de Debug do item"
          },
          DidYouKnow: {
            DidYouKnow: "Você sabia?",
            Collapse: "Você ocultou uma seção no DIM! Isso pode ser útil para esconder partes do DIM que você normalmente não usa.",
            DontShowAgain: "Não exibir esta dica novamente.",
            DoubleClick: "Se você está movendo um item para o seu personagem ativo atualmente (último logado), você pode dar um duplo clique para equipá-lo instantaneamente.",
            DragAndDrop: "Itens podem ser arrastados e soltados entre diferentes colunas de personagens/cofre.",
            Expand: "Para re-expandir uma seção simplesmente clique no sinal de mais, no lado esquerdo da categoria que você ocultou.",
            TryNext: "Tente na próxima vez!"
          },
          FarmingMode: {
            FarmingMode: "Modo Farm (mover itens)",
            Desc: "O DIM estará movendo engramas e consumíveis do {store} para o cofre e deixando um espaço livre por item para evitar que seus itens vão para o Chefe dos Correios.",
            Configuration: "Configuração",
            MakeRoom: {
              Desc: "O DIM está movendo apenas engramas e consumíveis do {store} para o cofre ou outros personagens para evitar que eles vão para o Chefe dos Correios.",
              MakeRoom: "Abrir espaço para novos itens movendo equipamentos",
              Tooltip: "Se marcado, o DIM irá mover também armas e armaduras para abrir espaço no cofre para engramas."
            },
            OutOfRoom: "Você está sem espaço para mover itens do {character}. É hora de descriptografar alguns engramas e fazer uma limpeza!",
            Quickmove: "Mover rapidamente",
            Stop: "Parar"
          },
          Filter: {
            EnterName: "Digite um nome de item:",
            EnterNote: "Digite a anotação:"
          },
          Header: {
            About: "Sobre",
            Filters: "Filtros",
            FilterHelp: "Buscar por item/perk ou is:arc",
            MaterialsExchange: "Ranks de facção disponíveis",
            Refresh: "Atualizar dados do Destiny",
            SupportDIM: "Apoie o DIM"
          },
          Help: {
            BackToDIM: "Voltar para o DIM",
            CannotMove: "Não é possível mover o item para fora deste personagem.",
            Drag: "Segure SHIFT ou mantenha o cursor sobre o inventário para mover parcialmente.",
            ChangingPerks: "Mudança de perks não é suportado.",
            ChangingPerksInfo: "Desculpe, não há maneira de alterar perks fora do jogo. Bem que gostaríamos!",
            HidePopup: "Esconder este Popup",
            NeverShow: "Não mostre isso novamente.",
            UpgradeChrome: "Por favor, atualizar o Chrome.",
            Version: {
              Beta: "Beta foi atualizado para v$DIM_VERSION",
              Stable: "DIM v$DIM_VERSION lançado"
            },
            Xur: "Xûr chegou"
          },
          Hotkey: {
            StartSearch: "Iniciar uma busca",
            RefreshInventory: "Atualizar inventário",
            ToggleDetails: "Mostrar todos os detalhes do item",
            MarkItemAs: "Marcar item como '{tag}'",
            ClearNewItems: "Limpar novos itens"
          },
          Infusion: {
            Infusion: "Buscador de Item para Infusão",
            BringGear: "Elevará o item para",
            Calc: "Calculadora de infusões",
            InfuseItems: "Selecione um item para infundir:",
            InfusionMaterials: "Materiais de infusão",
            LockedItems: "Incluir itens travados",
            NoItems: "Nenhum item para infusão encontrado.",
            NoTransfer: "Transferência de materia para infusão\n {target} não pôde ser movido.",
            ShowItems: "Exibir itens infundíveis de outros personagens e cofre",
            TransferItems: "Transferir itens",
            Using3: "usando 3"
          },
          ItemMove: {
            Consolidate: "{name} consolidado",
            Distributed: "{name} distribuído\n{name} está agora dividido por igual entre os personagens.",
            ToVault: "Todos os {name} estão agora no seu cofre.",
            ToStore: "Todos os {name} estão agora no seu {store}."
          },
          ItemService: {
            BucketFull: "Há muitos '{itemtype}' {isVault, select, true{no} false{em seu}} {store}.",
            Classified: "Este item é confidencial e não pode ser transferido no momento.",
            Classified2: "Item confidencial. A Bungie não fornece informações sobre este item. Este item ainda não é transferível.",
            Deequip: "Não foi possível encontrar outro item para equipar no lugar de {itemname}",
            ExoticError: "'{itemname}' não pode ser equipado porque o exótico no slot de {slot} não pode ser removido. ({error})",
            NotEnoughRoom: "Não há nada que possamos mover do {store} para abrir espaço para {itemname}",
            OnlyEquippedLevel: "Este item só pode ser equipado em personagens igual ou acima do nível {level}.",
            OnlyEquippedClassLevel: "Este item só pode ser equipado em um {class} igual ou acima do nível {level}.",
            PercentComplete: "({ percent | percent } Completo)",
            TooMuch: "Parece que você quis mover mais deste item do que ele existe!",
            TwoExotics: "Nós não sabemos como você conseguiu equipar mais de 2 equipamentos exóticos!"
          },
          LB: {
            LB: "Construtor de Sets",
            Guardians: "Guardiões",
            ShowGear: "Exibir itens de {class}",
            HideGear: "Ocultar itens de {class}",
            LockEquipped: "Travar itens equipados",
            ClearLocked: "Limpar itens equipados",
            Locked: "Itens travados",
            LockedHelp: "Arraste e solte itens para construir sets com itens específicos. SHIFT+Clique para excluir.",
            FilterSets: "Filtrar atributos",
            AdvancedOptions: "Opções avançadas",
            ProcessingMode: {
              Fast: "Rápido",
              Full: "Completo",
              ProcessingMode: "Modo de processamento",
              HelpFast: "Busca apenas pelos seus melhores itens.",
              HelpFull: "Busca por todos os itens, mas leva mais tempo."
            },
            Scaled: "Nivelado",
            Current: "Atual",
            LightMode: {
              LightMode: "Modo de luz",
              HelpScaled: "Calcular set como se todo os itens fossem 350 de defesa.",
              HelpCurrent: "Calcular set com os níveis de defesa reais."
            },
            IncludeRare: "Incluir itens raros (azuis)",
            Help: "Precisa de ajuda?",
            Equip: "Equipar no personagem atual",
            ShowAllConfigs: "Exibir todas as configurações",
            ShowConfigs: "Exibir configurações",
            HideAllConfigs: "Ocultar todas as configurações",
            HideConfigs: "Ocultar configurações",
            Loading: "Carregando os melhores sets",
            Vendor: "Incluir itens de vendedores",
            Exclude: "Itens ignorados",
            ExcludeHelp: "SHIFT+Clique em um item (ou arraste e solte no quadro abaixo) para construir sets ignorando itens específicos.",
            LockPerk: "Por perk",
            Missing1: "Faltam itens lendários ou exóticos para construir um set completo!",
            Missing2: "Faltam itens raros, lendários ou exóticos para construir um set completo!"
          },
          Loadouts: {
            Any: "Qualquer",
            Loadouts: "Sets",
            Before: "Antes '{name}'",
            Create: "Criar set",
            FromEquipped: "Equipado",
            Edit: "Editar set",
            Delete: "Excluir set",
            ConfirmDelete: "Tem certeza que deseja excluir '{name}'?",
            ApplySearch: "Itens = \"{query}\"",
            MaximizeLight: "Maximizar Luz",
            ItemLeveling: "Nivelamento de itens",
            GatherEngrams: "Obter engramas",
            GatherEngramsExceptExotics: "Exóticos",
            RestoreAllItems: "Todos os itens",
            Random: "Aleatória",
            Randomize: "Embaralhar suas armas equipadas, armadura, fantasma e artefato?",
            VendorsCannotEquip: "Estes itens de vendedores não podem ser equipados:",
            VendorsCanEquip: "Estes itens não podem ser equipados:",
            MaxSlots: "Você só pode ter {slots} desde tipo de item em seu set.",
            OnlyItems: "Somente itens equipáveis, materiais e consumíveis podem ser adicionados em um set.",
            FilteredItems: "Itens filtrados",
            NoEngrams: "Nenhum engrama não-exótico disponível para transferir.",
            NoExotics: "Nenhum engrama disponível para transferir.",
            LoadoutName: "Nome do set...",
            Save: "Salvar",
            SaveAsNew: "Salvar como novo",
            Cancel: "Cancelar",
            ItemsWithIcon: "Itens com este ícone serão equipados. Clicar em um item alterna a equipagem.",
            CouldNotEquip: "Não foi possível equipar {itemname}",
            TooManyRequested: "Você tem {total} {itemname} mas o seu set de itens busca por {requested}. Nós transferimos tudo o que você tem.",
            DoesNotExist: "{itemname} não existe em sua conta.",
            AppliedAuto: "Construtor automático de sets",
            Applied: "Seu set de {amount} itens foi transferido para seu {store}.",
            AppliedError: "Nenhum dos itens do seu set pode ser transferido.",
            AppliedWarn: "Seu set foi parcialmente transferido, mas {failed} de {total} itens retornaram erros.",
            NameRequired: "Um nome é obrigatório.",
            MakeRoom: "Abrir espaço para itens do Correio",
            MakeRoomDone: "Foi aberto espaço para {postmasterNum, plural, =1{1 item de Correio} other{# itens de Correio}} movendo {movedNum, plural, =1{1 item} other{# itens}} do {store}.",
            MakeRoomError: "Incapaz de abrir espaço para todos os itens do Correio: {error}."
          },
          Manifest: {
            Build: "Construindo banco de dados de informações",
            Download: "Baixando últimas informações da Bungie",
            Error: "Erro ao carregar informações de Destiny:\n{error}\nReinicie para tentar novamente.",
            Outdated: "Informações desatualizadas",
            OutdatedExplanation: "A Bungie atualizou seu banco de dados de informações de Destny. Reinicie o DIM para obter as novas informações. Esteja ciente que algumas coisas no DIM podem não funcionar por algumas horas após a Bungie atualizar o Destiny, já que as novas informações ainda estão sendo implementadas em seus servidores.",
            BungieDown: "A Bungie.net parece estar passando por problemas.",
            Load: "Carregando informações salvas",
            LoadCharInv: "Carregando personagens e inventário",
            Save: "Salvando últimas informações ",
            Unzip: "Descompactando últimas informações"
          },
          MaterialsExchange: {
            MaterialsExchange: "Troca de materiais",
            CurrentRank: "Rank atual",
            CurrentRep: "Reputação atual",
            OnHand: "Materiais disponíveis",
            FromTrade: "Materiais para troca",
            NewRank: "Novo rank",
            NewRep: "Nova reputação"
          },
          MovePopup: {
            Consolidate: "Consolidar",
            DistributeEvenly: "Distribuir igualmente",
            Equip: "Equip",
            Split: "Dividir",
            Store: "Mover",
            Take: "Tomar",
            Vault: "Cofre"
          },
          Notes: {
            Error: "Erro! Anotações devem ter até 120 caracteres.",
            Help: "Adicione anotações à este item"
          },
          Postmaster: {
            Limit: "Limite do Chefe de Correio",
            Desc: "Há 20 itens perdidos em seu Correio com seu {store}. Quaisquer novos itens irão substituir os existentes."
          },
          Settings: {
            Settings: "Configurações",
            Language: "Idioma (reinicie o DIM para aplicar)",
            HideUnfiltered: "Ocultar itens não-filtrados ao filtrar",
            HideUnfilteredHelp: "Itens que não corresponderem à pesquisa serão ocultos.",
            AlwaysShowDetails: "Sempre exibir detalhes dos itens",
            AlwaysShowDetailsHelp: "Quando ativo, clicar em um item sempre irá exibir um popup com os perks e detalhes das estatísticas dos itens.",
            EnableAdvancedStats: "Ativar recurso de comparação de qualidade dos itens",
            EnableAdvancedStatsHelp: "Ativa os recursos de min/max dos atributos e ativa a comparação de armaduras.",
            ShowOverlay: "Destacar itens novos",
            ShowOverlayHelp: "Itens novos serão exibidos com uma sobreposição de destaque.",
            ShowAnimations: "Exibir animação da sobreposição em itens novos.",
            ShowAnimationsHelp: "Irá exibir uma animação em itens novos. Desativar esse recurso pode economizar ciclos de CPU.",
            ShowElemental: "Exibir ícone de dano elemental em armas",
            ShowElementalHelp: "Exibe o ícone do dano elemental da arma.",
            SetSort: "Ordenar itens por:",
            SetSortHelp: "Ordena os itens por nível de luz ou raridade.",
            SortPrimary: "Estatística primária",
            SortRarity: "Raridade",
            SortRoll: "% de progresso do aprimoramento",
            InventoryColumns: "Colunas no inventário de personagens",
            InventoryColumnsHelp: "Selecione o número máximo de colunas a ser exibido no inventário dos personagens.",
            VaultColumns: "Numero máximo de colunas no cofre",
            VaultColumnsHelp: "Selecione o número máximo de colunas a ser exibido no cofre.",
            SizeItem: "Tamanho do item",
            SizeItemHelp: "Quão grande será exibida a imagem do item?",
            ResetToDefault: "Restaurar para padrão",
            CharacterOrder: "Ordem dos personagens",
            CharacterOrderHelp: "Personagens podem ser ordenados por data de login ou pela data de criação.",
            CharacterOrderRecent: "Personagem com login mais recente",
            CharacterOrderReversed: "Personagem com login mais recente (inverso)",
            CharacterOrderFixed: "Fixo (personagens antigos primeiro)",
            ExportSS: "Baixar planilha",
            ExportSSHelp: "Baixe a planilha CSV de todos os seus itens para que você possa visualizar no software de sua preferência.",
            DIMPopups: "Alertas do DIM",
            DIMPopupsReset: "Resetar todos os alertas ocultos"
          },
          Stats: {
            Discipline: "Disciplina",
            Intellect: "Intelecto",
            NoBonus: "Sem bônus",
            OfMaxRoll: "{range} do valor máximo",
            PercentHelp: "Clique para mais informações sobre Níveis de Qualidade.",
            Quality: "Níveis de qualidade",
            Strength: "Força",
            TierProgress: "{progress} para {tier}"
          },
          StoreBucket: {
            FillStack: "Encher Pilha ({amount})",
            HowMuch: "Quantos {itemname} para transferir?",
            Move: "Transferir"
          },
          Tags: {
            TagItem: "Marcar item",
            Favorite: "Favorito",
            Junk: "Lixo",
            Infuse: "Infundir",
            Keep: "Manter"
          },
          Vendors: {
            Vendors: "Vendedores",
            All: "Todos",
            Available: "Disponível em",
            Compare: "Compare com o que você já possui",
            Day: "{numDays, plural, =1{Dia} other{Dias}}",
            Load: "Carregando vendedores",
            ArmorAndWeapons: "Armaduras & Armas",
            ShipsAndVehicles: "Naves & Veículos",
            Consumables: "Consumíveis",
            Bounties: "Contratos",
            ShadersAndEmblems: "Tonalizadores & Emblemas",
            Emotes: "Gestos"
          },
          TrialsCard: {
            FiveWins: "Recompensa de 5 vitórias (armadura)",
            SevenWins: "Recompensa de 7 vitórias (arma)",
            Flawless: "Vitória perfeita"
          }
        })
        .fallbackLanguage('en');
    }]);
})();
