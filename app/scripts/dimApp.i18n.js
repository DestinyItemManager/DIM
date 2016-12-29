(function() {
  "use strict";

  // See https://angular-translate.github.io/docs/#/guide
  angular.module('dimApp')
    .config(['$translateProvider', function($translateProvider) {
      $translateProvider.useSanitizeValueStrategy('escape');
      $translateProvider.useMessageFormatInterpolation();

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
            View: "View Item Debug Info" },
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
            NeverShow: "Never show me this again.",
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
            BucketFull: "There are too many '{itemtype}' items in the {bucket}.",
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
            VendorsCannotEquip: "These vendor items cannot be equipped",
            VendorsCanEquip: "These items can be equipped",
            MaxSlots: "You can only have {slots} of that kind of item in a loadout.",
            OnlyItems: "Only equippable items, materials, and consumables can be added to a loadout.",
            FilteredItems: "Filtered Items",
            NoEngrams: "No non-exotic engrams are available to transfer.",
            NoExotics: "No engrams are available to transfer.",
            LoadoutName: "Loadout Name...",
            Save: "Save",
            SaveAsNew: "Save As New",
            Cancel: "Cancel",
            ItemsWithIcon: "Items with this icon will be equipped.",
            ClickToEquip: "Click on an item to toggle equip.",
            CouldNotEquip: "Could not equip {itemname}",
            TooManyRequested: "You have {total} {itemname} but your loadout asks for {requested} We transfered all you had.",
            DoesNotExist: "{itemname} doesn't exist in your account.",
            AppliedAuto: "Automatic Loadout Builder",
            Applied: "Your {amount, plural, =1{single item loadout has} other{loadout of # items have}} been transferred to your {store}.",
            AppliedError: "None of the items in your loadout could be transferred.",
            AppliedWarn: "Your loadout has been partially transferred, but {failed} of {total} items had errors."
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
            Super: "Super tempo di recupero",
            Grenade: "Granate tempo di recupero",
            Melee: "Corpo a corpo tempo di recupero"
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
            NeverShow: "Non mostrarmi più questo messaggio.",
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
            BucketFull: "Ci sono troppe '{itemtype}' nel {bucket}.",
            Classified: "Questo oggetto è classificato e non può essere trasferito attualemente.",
            Classified2: "Oggetto classificato. Bungie non fornisce informazioni riguardo questo oggetto. Questo oggetto non è ancora trasferibile.",
            Deequip: "Impossibile trovare un altro oggetto da equipaggiare per rimuovere {itemname}",
            ExoticError: "'{itemname}' non può essere equipaggiato, poichè l'esotico nello slot {slot} non può essere rimosso. ({error})",
            NotEnoughRoom: "Non c'è nulla che possiamo spostare dal {store} per fare spazio per {itemname}",
            OnlyEquippedLevel: "Questo oggetto può essere equipaggiato solamente su personaggi al livello {level} o superiore.",
            OnlyEquippedClassLevel: "Questo oggetto può essere equipaggaito solo su un {class} al livello {level} o superiore.",
            PercentComplete: "({ percent | percent } Completato)",
            TooMuch: "Sembra tu abbia richiesto di spostare una quantità maggiore di oggetti rispetto a quella disponibile nell'origine!",
            TwoExotics: "Non sappiamo come tu abbia equipaggiati più di 2 esotici!",
          },
          LB: {
            LB: "Costruttore di Loadout",
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
            VendorsCannotEquip: "Questi oggetti dei venditori non possono essere equipaggiati",
            VendorsCanEquip: "Questi oggetti possono essere equipaggiati",
            MaxSlots: "Puoi avere solo {slots} tipi di quell'oggetto in un loadout.",
            OnlyItems: "Solo oggetti, che si possono equipaggiare, materiali e consumabili si possono aggiungere a un loadout.",
            FilteredItems: "Oggetti Filtrati",
            NoEngrams: "Non ci sono engrammi non-esotici da trasferire.",
            NoExotics: "Non ci sono engrammi da trasferire.",
            LoadoutName: "Nome Loadout...",
            Save: "Salva",
            SaveAsNew: "Salva come nuovo",
            Cancel: "Cancella",
            ItemsWithIcon: "Gli oggetti con questa icona verranno equipaggiati.",
            ClickToEquip: "Clicca su un oggetto per scegliere se equipaggiarli o meno.",
            CouldNotEquip: "Impossibile equipaggiare {itemname}",
            TooManyRequested: "Hai un totale di {total} {itemname}, ma il tuo loadout ne richiede {requested}. Abbiamo trasferito tutti quelli che avevi.",
            DoesNotExist: "{itemname} non esiste sul tuo account.",
            AppliedAuto: "Costruttore Automatico di Loadout",
            Applied: "Il tuo loadout di {amount, plural, =1{un oggetto} other{# oggetti}} è stato trasferito {gender, select, male{al tuo} female{alla tua}} {store}.",
            AppliedError: "Non è stato possibile trasferire nessuno degli oggetti del tuo loadout.",
            AppliedWarn: "Il tuo loadout è stato parzialmente trasferito, ma per {failed} di {total} oggetti il trasferimento è fallito."
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
          Tags: {
            TagItem: "Contrassegna Elemento",
            Favorite: "Preferito",
            Keep: "Tieni",
            Junk: "Smantella",
            Infuse: "Infondi"
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
            DevVersion: "Benutzt du eine Entwickler-Version von DIM? Du musst die Chrome Erweiterung auf bungie.net registrieren.",
            Down: "Bungie.net ist nicht erreichbar.",
            Difficulties: "Die Bungie API hat zur Zeit mit Schwierigkeiten zu kämpfen.",
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
            Compare: "Vergleiche",
            Close: "Schließen",
            Error: {
              Class: "Kann dieses Item nicht vergleichen, da es nicht für einen {class} ist.",
              Archetype: "Kann dieses Item nicht vergleichen, da es kein {type} ist."
            },
            Splits: "Vergleiche ähnliche Stats ({quantity})"
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
          FarmingMode: {
            FarmingMode: "Engramme zum Tresor",
            Desc: "DIM verschiebt Engramme und Glimmergegenstände vom {store} in den Tresor und lässt einen Platz pro Gegenstandstyp frei um zu verhindern, dass Engramme zur Poststelle geschickt werden.",
            Configuration: "Konfiguration",
            MakeRoom: {
              Desc: "DIM verschiebt nur Engramme und Glimmer vom {store} zum Tresor oder anderen Charaktern, um zu verhindern, dass sie in der Poststelle landen.",
              MakeRoom: "Mache Platz durch verschieben von Equipment, um Items aufnehmen zu können",
              Tooltip: "Wenn ausgewählt, wird DIM Waffen und Rüstungen verschieben, um Platz im Tresor für Engramme zu machen."
            },
            Quickmove: "Schnelles Verschieben",
            Stop: "Stop"
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
            Drag: "Halte Shift oder pausiere über der Drop-Zone, um einen Teilstapel zu übertragen"
          },
          Hotkey: {
            StartSearch: "Starte eine Suche",
            RefreshInventory: "Aktualisiere Inventar",
            ToggleDetails: "Schalter für vollständige Artikeldetails",
            MarkItemAs: "Markiere Element als '{tag}'",
            ClearNewItems: "Neue Elemente löschen"
          },
          Infusion: {
            Infusion: "Infusion Fuel Finder",
            BringGear: "Bringt die Ausrüstung zu",
            Calc: "Infusionsrechner",
            InfuseItems: "Element auswählen zum Infundieren mit:",
            LockedItems: "Beziehe 'gesperrte' Items ein",
            NoItems: "Keine infundierbaren Items verfügbar.",
            ShowItems: "Zeige alle infundierbaren Items von allen Charaktern und dem Tresor",
            TransferItems: "Übertrage Items",
            Using3: "verwendet 3"
          },
          ItemService: {
            PercentComplete: "({ percent | percent } Komplett)"
          },
          LB: {
            LB: "Loadout Builder",
            ShowGear: "Zeige {class} Ausrüstung",
            HideGear: "Verstecke {class} Ausrüstung",
            LockEquipped: "Angelegte Ausrüstung",
            ClearLocked: "Festlegung leeren",
            Locked: "Festgelegte Gegenstände",
            LockedHelp: "Ziehe einen beliebigen Gegenstand in sein Feld, um ihn für die generierten Loadouts festzulegen. Mit Shift + Klick kannst du Gegenstände ignorieren.",
            FilterSets: "Sets filtern",
            AdvancedOptions: "Erweiterte Optionen",
            ProcessingMode: {
              Fast: "Schnelle",
              Full: "Vollständige",
              ProcessingMode: "Berechnung",
              HelpFast: "Nur die beste Ausrüstung wird einbezogen.",
              HelpFull: "Bezieht die ganze Ausrüstung mit ein."
            },
            Scaled: "Skaliertes",
            Current: "Aktuelles",
            LightMode: {
              LightMode: "Lichtlevel",
              HelpScaled: "Berechnet Loadouts, bei denen alle Gegenstände Lichtlevel 350 besitzen.",
              HelpCurrent: "Berechnet Loadouts mit dem aktuellen Lichtlevel der Gegenstände."
            },
            IncludeRare: "Seltene (blaue) Gegenstände einbeziehen",
            Help: "Brauchst du Hilfe?",
            Equip: "Am aktuellen Charakter anlegen.",
            ShowAllConfigs: "Zeige alle Varianten",
            ShowConfigs: "Zeige Varianten",
            HideAllConfigs: "Verstecke alle Varianten",
            HideConfigs: "Verstecke Varianten",
            Loading: "Lade die besten Sets",
            Vendor: "Gegenstände von Händlern einschließen",
            Exclude: "Ignorierte Gegenstände",
            ExcludeHelp: "Benutze Shift + Klick bei einem Gegenstand (oder ziehe ihn in dieses Feld) um Sets ohne diesen Gegenstand zu generieren.",
            LockPerk: "Perk festlegen",
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
            GatherEngramsExceptExotics: "Exotics",
            RestoreAllItems: "Alle Elemente",
            LoadoutName: "Loadout Name...",
            Random: "Zufällig",
            Save: "Speichern",
            SaveAsNew: "Speichern als...",
            Cancel: "Abbrechen",
            ItemsWithIcon: "Gegenstände mit diesem Symbol werden angelegt.",
            ClickToEquip: "Klicke auf einen Gegenstand um das Anlegen zu aktivieren bzw. zu deaktivieren.",
            AppliedAuto: "Automatischer Loadout Builder",
            Applied: "Dein {amount, plural, =1{Ein-Item Loadout} other{Loadout aus # Gegenständen}} wurde zum {store} übertragen.",
            AppliedError: "Keiner der Gegenstände in deinem Loadout konnte übertragen werden.",
            AppliedWarn: "Dein Loadout wurde teilweise angewendet, aber {failed} von {total} Gegenständen waren fehlerhaft."
          },
          Manifest: {
            Build: "Lege Destiny Datenbank an",
            Download: "Lade neueste Daten von Bungie herunter",
            Error: "Fehler beim Laden von Informationen:\n{error}\nApp neu laden, um es nochmals zu versuchen.",
            Outdated: "Veraltete Destiny Infos",
            OutdatedExplanation: "Bungie hat die Destiny Info-Datenbank aktualisiert. Lade DIM erneut, um die neuen Infos zu laden. Beachte, dass einige Dinge in DIM u.U. nicht richtig funktionieren, nachdem Bungie.net Destiny aktualisiert hat, solange die neuen Daten im System verbreiten werden.",
            BungieDown: "Bungie.net hat möglicherweise Probleme.",
            Load: "Lade gespeicherte Daten",
            LoadCharInv: "Lade Destiny Charakter und Inventar",
            Save: "Speichere neueste Daten",
            Unzip: "Entpacke neueste Daten"
          },
          MaterialsExchange: {
            MaterialsExchange: "Materialaustausch",
            CurrentRank: "Aktueller Rang",
            CurrentRep: "Aktueller Ruf",
            OnHand: "Materialien in Besitz",
            FromTrade: "Materialien aus dem Handel",
            NewRank: "Neuer Rang",
            NewRep: "Neuer Ruf"
          },
          Notes: {
            Error: "Fehler! Max 120 Zeichen für Notizen.",
            Help: "Notiz für diesen Artikel"
          },
          Settings: {
            Settings: "Einstellungen",
            Language: "Sprache (lade DIM neu zum Übernehmnen)",
            HideUnfiltered: "Zeige nur die Suchergebnisse beim Filtern",
            HideUnfilteredHelp: "Gegenstände, die nicht zum Filter passen, werden ausgeblendet.",
            AlwaysShowDetails: "Zeige immer Details der Gegenstände",
            AlwaysShowDetailsHelp: "Ein Klick auf einen Gegenstand öffnet ein Popup, welches erweitert werden kann, um Details zu Statistiken und Perks zu zeigen. Diese Option wird immer diese Details zeigen, wenn du auf einen Gegenstand klickst.",
            EnableAdvancedStats: "Aktivieren der erweiterten Statusvergleichsfunktionen",
            EnableAdvancedStatsHelp: "Ermöglicht erweiterte Min/Max-Funktionen im Verschieben-Dialog und aktiviert die Rüstungsvergleichsansicht.",
            ShowOverlay: "Zeige neue Gegenstände mit einem Overlay",
            ShowOverlayHelp: "Zeigt neue Gegenstände mit einem hellen Overlay an.",
            ShowAnimations: "Zeige animiertes Overlay bei neuen Gegenständen an",
            ShowAnimationsHelp: "Zeigt ein animiertes Overlay bei neuen Gegenständen an. Abschalten verringert die CPU Auslastung.",
            ShowElemental: "Zeige Elementarschaden bei Waffen an",
            ShowElementalHelp: "Zeigt den Elementarschaden bei Waffen an.",
            SetSort: "Sortiere Gegenstände nach:",
            SetSortHelp: "Sortieren von Gegenständen nach Seltenheit oder ihrem primären Statuswert.",
            SortPrimary: "Primären Stat",
            SortRarity: "Seltenheit",
            SortRoll: "Stat-Roll Prozent",
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
            CharacterOrderReversed: "Nach zuletzt aktivem Charakter (umgedreht)",
            CharacterOrderFixed: "Fest (Nach Alter des Charakters)",
            ExportSS: "Lade Tabelle herunter",
            ExportSSHelp: "Lade eine CSV-Tabelle von deinen Gegenständen, die leicht mit jedem Tabellenprogramm angezeigt werden kann.",
            DIMPopups: "DIM Info Popups",
            DIMPopupsReset: "Zeige zuvor versteckte Info Tipps"
          },
          Stats: {
            Discipline: "Disziplin",
            Intellect: "Intellekt",
            NoBonus: "Kein Bonus",
            OfMaxRoll: "{range} des max. Rolls",
            PercentHelp: "Klicke für mehr Informationen über Stats Qualitäten.",
            Quality: "Stats Qualität",
            Strength: "Stärke",
            TierProgress: "{progress} für {tier}"
          },
          Tags: {
            TagItem: "Item taggen",
            Favorite: "Favorit",
            Junk: "Trödel",
            Infuse: "Infundieren",
            Keep: "Behalten"
          },
          Vendors: {
            Vendors: "Händler",
            All: "Alle",
            Day: "{numDays, plural, =1{Tag} other{Tage}}",
            VendorsLoad: "Lade Händler",
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
            Flawless: "Flawless"
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
            Super: "Régénération du Super",
            Grenade: "Régénération de Grenade",
            Melee: "Régénération de Mêlée"
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
          ItemSevice: {
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
            ItemsWithIcon: "Les objets avec cet icone seront équipés.",
            ClickToEquip: "Cliquez sur un bouton d'objet pour l'équiper.",
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
            NoBonus: "Pas de Bonus",
            Intellect: "Intelligence",
            Discipline: "Discipline",
            Strength: "Force",
            TierProgress: "{progress} pour {tier}"
          },
          Tags: {
            TagItem: "Tagger Objet",
            Favorite: "Préféré",
            Keep: "Garder",
            Junk: "Camelote",
            Infuse: "Infuser"
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
            Down: "Bungie.net no esta disponible.",
            Difficulties: "La API de Bungie esta teniendo dificultades.",
            NetworkError: "Error de red - {status} {statusText}",
            Throttled: "El límite de saturación de la API de Bungie se ha excedido. Por favor espere un poco y vuelva a intentarlo.",
            NotLoggedIn: "Por favor inicie sesión en Bungie.net para poder usar esta extensión.",
            Maintenance: "Los servidores de Bungie.net se encuentran en mantenimiento.",
            NoAccount: "No se encontró una cuenta de Destiny para esta plataforma. Has elegido la plataforma correcta?",
            NoAccountForPlatform: "No encontramos una cuenta de Destiny para {platform}.",
            NotConnected: "Es posible que no tengas conexión a Internet.",
            Twitter: "Entérate de los estados de actualizaciones",
            ItemUniqueness: "Unicidad de objeto",
            ItemUniquenessExplanation: "Intentáste mover el '{name}' {type} a tu {character} pero ese destino ya cuenta con ese objeto y solo puede tener uno."
          },
          Compare: {
            All: "Comparaciones de {type} ({quantity})",
            Archetype: "Comparaciones de arquetipo ({quantity})",
            Compare: "Comparar",
            Close: "Cerrar",
            Error: {
              Class: "No se puede comparar este objeto ya que no es para {class}.",
              Archetype: "No se puede comparar este objeto ya que no es {type}."
            },
            Splits: "Comparar partes similares ({quantity})"
          },
          Cooldown: {
            Super: "Tiempo para Super",
            Grenade: "Tiempo para Granada",
            Melee: "Tiempo para Cuerpo a cuerpo"
          },
          Debug: {
            Dump: "Tirar información a la consola",
            View: "Ver información de depuración de objeto"
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
            Quickmove: "Movimiento rápido",
            Stop: "Detener"
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
            Drag: "Mantén presionado Shift o pausa sobre la zona de soltar para transferir un montón parcial"
          },
          Hotkey: {
            StartSearch: "Empezar una búsqueda",
            RefreshInventory: "Actualizar inventario",
            ToggleDetails: "Mostrar detalles completos de objeto",
            MarkItemAs: "Marcar objeto como '{tag}'",
            ClearNewItems: "Despejar objetos nuevos"
          },
          ItemService: {
            PercentComplete: "({ percent | percent } Completar)"
          },
          LB: {
            LB: "Creador de equipo",
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
            LoadoutName: "Nombre de equipo...",
            Save: "Guardar",
            SaveAsNew: "Guardar como nuevo",
            Cancel: "Cancelar",
            ItemsWithIcon: "Objetos con éste ícono van a ser equipados.",
            ClickToEquip: "Click en un objeto para equipar.",
            AppliedAuto: "Crear automático de equipo",
            Applied: "Tu equipo de {amount, plural, =1{un objeto ha sido transferido} other{# objetos han sido transferidos}} a tu {store}.",
            AppliedError: "Ninguno de los objetos en tu equipo pudo ser transferido.",
            AppliedWarn: "Tu equipo ha sido parcialmente transferido, pero {failed} de {total} objetos tuvieron errores."
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
          Notes: {
            Error: "Error! Máximo 120 caracteres por notas.",
            Help: "Agregar notas a este artículo"
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
            Intellect: "Intelecto",
            Discipline: "Disciplina",
            NoBonus: "Sin beneficio",
            Strength: "Fuerza",
            TierProgress: "{progress} por {tier}"
          },
          Tags: {
            TagItem: "Elemento de Etiqueta",
            Favorite: "Favorito",
            Keep: "Guardar",
            Junk: "Basura",
            Infuse: "Infundir"
          },
          Vendors: {
            Vendors: "Comerciantes",
            All: "Todo",
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
            Weapons: "武器",
            Armor: "よろい",
            General: "全般",
            Postmaster: "ポストマスター",
            Vault: "装備",
            Unknown: "未知の",
            Vanguard: "バンガード",
            Progress: "進捗",
            Reputation: "評価",
            Show: "ショー{bucket}"
          },
          Header: {
            About: "紹介",
            SupportDIM: "サポート DIM"
          },
          ItemService: {
            PercentComplete: "({ percent | percent } コンプリート)"
          },
          Loadouts: {
            Create: "作る Loadout",
            FromEquipped: "備える",
            Edit: "編集 Loadout",
            Delete: "削除 Loadout",
            ApplySearch: "箇条 = \"{query}\"",
            MaximizeLight: "ライトを最大化",
            ItemLeveling: "アイテムの平準化",
            GatherEngrams: "エングラムを収集",
            GatherEngramsExceptExotics: "エキゾチック",
            RestoreAllItems: "品揃え",
            Random: "ランダム",
            Loadouts: "Loadouts" },
          Notes: {
            Help: "このアイテムにメモを追加"
          },
          Settings: {
            Settings: "設定"
          },
          Stats: {
            Intellect: "知性",
            Discipline: "鍛錬",
            Strength: "腕力"
          },
          Tags: {
            TagItem: "タグアイテム",
            Favorite: "本命",
            Keep: "保つ",
            Junk: "ジャンク",
            Infuse: "煎じる"
          },
          Vendors: {
            Vendors: "ベンダー",
            Day: "{numDays, plural, =1{日} other{日々}}",
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
            Down: "Bungie.net está fora do ar.",
            Difficulties: "A API da Bungie está atualmente passando por dificuldades.",
            NetworkError: "Erro de rede - {status} {statusText}",
            Throttled: "Limite de acesso à API da Bungie API excedido. Por favor, aguarde um pouco e tente novamente.",
            NotLoggedIn: "Por favor, faça seu login no Bungie.net para utilizar esta extensão.",
            Maintenance: "Servidores Bungie.net estão fora do ar para manutenção.",
            NoAccount: "Nenhuma conta de Destiny foi encontrada para esta plataforma. Você selecionou a plataforma correta?",
            NoAccountForPlatform: "Incapaz de encontrar uma conta de Destiny no {platform}.",
            NotConnected: "Você deverá estar sem conexão com a Internet.",
            Twitter: "Veja atualizações em",
            ItemUniqueness: "Unicidade de itens",
            ItemUniquenessExplanation: "Você tentou mover o {type} '{name}' para seu {character} mas o local de destino já possui um item do tipo."
          },
          Compare: {
            All: "Comparações de {type} ({quantity})",
            Archetype: "Comparações de arquétipo ({quantity})",
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
          FarmingMode: {
            FarmingMode: "Modo Farm (mover itens)",
            Desc: "O DIM estará movendo engramas e consumíveis do {store} para o cofre e deixando um espaço livre por item para evitar que seus itens vão para o Chefe dos Correios.",
            Configuration: "Configuração",
            MakeRoom: {
              Desc: "O DIM está movendo apenas engramas e consumíveis do {store} para o cofre ou outros personagens para evitar que eles vão para o Chefe dos Correios.",
              MakeRoom: "Abrir espaço para novos itens movendo equipamentos",
              Tooltip: "Se marcado, o DIM irá mover também armas e armaduras para abrir espaço no cofre para engramas."
            },
            Quickmove: "Mover rapidamente",
            Stop: "Parar"
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
            Drag: "Segure SHIFT ou mantenha o cursor sobre o inventário para mover parcialmente."
          },
          Hotkey: {
            StartSearch: "Iniciar uma busca",
            RefreshInventory: "Atualizar inventário",
            ToggleDetails: "Toggle showing full item details",
            MarkItemAs: "Marcar item como '{tag}'",
            ClearNewItems: "Limpar novos itens"
          },
          ItemService: {
            PercentComplete: "({ percent | percent } Completo)"
          },
          LB: {
            LB: "Construtor de Loadouts",
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
            Loadouts: "Loadouts",
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
            LoadoutName: "Nome do set...",
            Save: "Salvar",
            SaveAsNew: "Salvar como novo",
            Cancel: "Cancelar",
            ItemsWithIcon: "Itens com este ícone serão equipados.",
            ClickToEquip: "Clicar em um item alterna a equipagem.",
            AppliedAuto: "Construtor automático de sets",
            Applied: "Seu set de {amount} itens foi transferido para seu {store}.",
            AppliedError: "Nenhum dos itens do seu set pode ser transferido.",
            AppliedWarn: "Seu set foi parcialmente transferido, mas {failed} de {total} itens retornaram erros."
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
          Notes: {
            Error: "Erro! Anotações devem ter até 120 caracteres.",
            Help: "Adicione anotações à este item"
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
            Strength: "Força",
            TierProgress: "{progress} para {tier}"
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
