## Next

* The "Clear other items" setting in Loadouts has been split into a separate option for clearing weapons and clearing armor.

### Beta Only

* We've now got some experimental new themes for DIM - you can choose one in settings. These aren't final designs but they show off what can be changed.

## 7.77.3 <span class="changelog-date">(2023-07-18)</span>

## 7.77.2 <span class="changelog-date">(2023-07-17)</span>

* Slow down updates to the Bungie Day Giving Festival Banner.

## 7.77.1 <span class="changelog-date">(2023-07-17)</span>

* Moved the Bungie Day Giving Festival Banner.

## 7.77.0 <span class="changelog-date">(2023-07-16)</span>

* Fixed Harmonic mods ex. "Harmonic Siphon" from having no description
* DIM now considers breech-loaded (special) Grenade Launchers and Heavy Grenade Launchers completely separate item types. This means Special Grenade Launchers now have their own Organizer tab, Triage for Heavy Grenade Launchers will no longer show "similar" Special Grenade Launchers, and Compare will not include them when comparing Heavy Grenade Launchers.
* When opening the Compare view from the Triage tab of a Vendor item, this Vendor item will now be included in the compared items.
* New versions of the Last Wish weapons now appear in collections.
* Added Bungie Day Giving Festival Banner.

## 7.76.0 <span class="changelog-date">(2023-07-09)</span>

* Fixed Fashion Loadouts being unable to store an Ornament for the Titan exotic Loreley Splendor Helm.

## 7.75.0 <span class="changelog-date">(2023-07-02)</span>

* Organizer's "Loadouts" column now sorts items by the number of Loadouts using them.
* Added `memento:none` filter to highlight weapons with an empty memento socket.
* `deepsight:harmonizable` highlights weapons where Deepsight Resonance can be activated using a Deepsight Harmonizer.

## 7.74.0 <span class="changelog-date">(2023-06-25)</span>

* You may now include vendors' items in loadout optimizer, in case they have a better roll available than what you have.

## 7.73.0 <span class="changelog-date">(2023-06-18)</span>

* DIM should no longer show a popup to enable DIM Sync before you've logged in.
* Fixed drag and drop on Android.
* Fixed scroll bar behaving weirdly on the sidebar of certain pages.

## 7.72.0 <span class="changelog-date">(2023-06-11)</span>

* Fixed showing the item under your finger while you're dragging it on iOS/iPadOS. As a reminder, on touchscreen devices you need to press the item for a little bit to "pick it up". And as a reminder for everyone, any time you see an item in DIM, pretty much wherever it is, you can drag it around to move the item or add it to a Loadout you're editing. This works from the Inventory, Item Feed, Loadouts screen, etc.
* The Loadouts page now has a filter pill to find Loadouts with empty Fragment sockets.
* The popup shown on the refresh button when Bungie.net is down no longer has buttons you can't click, and no longer exceeds the width of the screen on mobile.
* DIM will not update itself in the background if you're in the middle of editing a loadout or doing many other tasks.
* Removed references to Reddit.
* Improved performance of viewing lots of loadouts, especially on iOS. The Loadouts page should no longer hang on load on iOS.
* The tab title includes the name of the current page you're on.
* Fixed the keyboard automatically appearing on the iOS App Store version.
* Removed support for old Loadout Optimizer share links.
* Fixed showing catalyst perk descriptions.

## 7.71.0 <span class="changelog-date">(2023-06-04)</span>

* Added Community Insights for the impact of various stat tiers on ability cooldowns, etc. This takes into account your current subclass config and equipped exotic. For loadouts, it uses the subclass config and exotic that are saved in the loadout to display details. This information comes from the Clarity database, and like all Community Insights is sourced from lots of manual investigation.
* Automatic stat mods in Loadout Optimizer have graduated from Beta! We now remember this setting, and we ignore any manually chosen stat mods when auto stat mods are on. Enabling auto stat mods allows Loadout Optimizer to automatically assign stat mods to potential loadouts in order to hit the stats you've requested, in the priority order that you've chosen.
* Fixed an issue where DIM might not properly force you to re-login with Bungie.net, and would instead continually throw errors trying to talk to Bungie.net.
* The loadout dropdown in the "Compare Loadouts" sheet from Loadout Optimizer can no longer be taller than the screen.
* Added `is:iningameloadout` search to find items that are in an in-game loadout.
* In-game loadouts now appear above the "Max Power" loadout in the loadouts menu.
* Fixed an issue with farming mode where it would show a bunch of error notifications.
* `is:inloadout:` searches now autocomplete hashtags in loadout names and descriptions.
* Fixed plugging Harmonic Resonance mods when using a Strand subclass.
* You can now drag and drop subclasses into the loadout editor, including from other loadouts.
* When DIM is installed as a PWA on desktop, you can now choose to hide the title bar.
* Removed loadout sharing buttons from Loadout Optimizer. You can share from the Loadouts screen.
* Hid the Artifact Unlocks section from loadouts until Bungie.net starts returning artifact info again.
* Improved highlighting and selection styles for item perks.
* Improved layout for mods in the Compare drawer - they stay in a line now.
* Vendors will now show your current count of Engrams and other resources needed for focusing in their currencies section.
* Added `is:focusable` search to find items that can be focused at a vendor.
* Fixed DIM not showing Leviathan's Breath catalyst progress in the item popup.
* Cleaned up the design of Loadout Optimizer stats, mod picker, exotic picker, and subclass editor.
* Weapon patterns are now sorted by completion %.

## 7.70.0 <span class="changelog-date">(2023-05-28)</span>

* Fixed an issue where equipping classified titles (e.g. Ghoul), or ornaments would crash DIM.
* Fixed the sizing and spacing of abilities in the subclass picker.
* Fixed the display of the "Fishing Tackle" item to show current values and not show an ugly placeholder icon.
* Updated information used to detect which season an item is from, after changes in the Bungie.net data since Season of the Deep.
* Improved the hover indication for the search field buttons.
* Fixed tracking crafted date for loadouts - they were not saving crafted date for items as intended, and were thus losing crafted items when they got reshaped.

## 7.69.0 <span class="changelog-date">(2023-05-21)</span>

## 7.68.0 <span class="changelog-date">(2023-05-14)</span>

* Item tiles for armor on the Vendors page will now show their stat total instead of power level.
* Refreshing your profile data no longer blocks item moves.
* DIM now correctly handles mods that have mutually exclusive rules - e.g. you can't have multiple finisher mods on your class item.

## 7.67.0 <span class="changelog-date">(2023-05-07)</span>

* Fixed an issue where sometimes the stat bonuses shown on perks was wrong.

## 7.66.0 <span class="changelog-date">(2023-04-30)</span>

* Changed the wording when you need to visit a postmaster to pull an item.
* Added an `is:adept` search filter. This allows you to find weapons which can equip Adept mods.
* `:` and `-` are now allowed in hashtags.

## 7.65.1 <span class="changelog-date">(2023-04-28)</span>

* Enhanced adept weapons from Root of Nightmares should now show with correct stats.

## 7.65.0 <span class="changelog-date">(2023-04-23)</span>

* Fixed Adept Draw Time marking the draw time stat as negatively affected (red) instead of positively affected (blue).
* Loadout Optimizer and Loadouts now consistently allow you to choose not yet unlocked Fragments and Aspects. Previously this was only working for some characters.
* Fixed an issue where the DIM Loadout apply notification was sometimes not showing that it performed changes to subclass abilities.

## 7.64.1 <span class="changelog-date">(2023-04-16)</span>

* In-Game Loadouts are now represented as save slots. Click them for details on which items and selections they contain.
  * Change icon/name/color, save as a DIM loadout, clear the save slot, and more, from the dropdown menu or the slot's details popup.
  * The overview In-Game Loadouts strip now shows whether each slot matches a DIM loadout, is equipped, or is equippable.
  * Loadouts have a Prepare Equip button, to move items to a character and ensure clicking the in-game equip button succeeds.
  * If you're in orbit or a social space, or offline, the Equip button can move items appropriately, then apply the in-game loadout.
* Fixed issue where selected mods would not scroll on mobile in the mod sheet.
* Items can now be dragged and dropped from within the loadout edit screen.
* Loadout Optimizer and Loadouts now include Armor Charge-based "Font of ..." mods in stat calculations. For example, if you are using the Font of Focus armor mod, Loadout Optimizer will assume the +30 points to Discipline when holding Armor Charge are active and not waste stat points on exceeding T10 Discipline.

## 7.64.0 <span class="changelog-date">(2023-04-09)</span>

* Updated DIM's Smart Moves logic for how to choose which items to move when a bucket is full.
* The bulk note tool has gotten a major upgrade and now allows adding and removing to existing notes.
* Undo and redo in loadout editor and loadout optimizer have the keyboard shortcuts you'd expect.
* Added some extra information to the randomize popup to explain how to use it with searches.
* Fixed the "L" hotkey inadvertantly working in Compare and when items should not be lockable.
* Added new hotkeys for opening Armory (A) and Infusion Fuel Finder (I) from the item popup.
* Added a "Compare" button to the Organizer to allow focused comparison of selected items.
* Added hotkeys to organizer - bulk tag, note, compare, or move selected items easily.
* Added a new "N" hotkey for editing notes on an item.

## 7.63.3 <span class="changelog-date">(2023-04-06)</span>

* Fixed equipping in game loadouts
* DIM now tries to keep your device from sleeping while an item is moving or a loadout is applying.

## 7.63.2 <span class="changelog-date">(2023-04-03)</span>

## 7.63.1 <span class="changelog-date">(2023-04-03)</span>

## 7.63.0 <span class="changelog-date">(2023-04-02)</span>

* The "Show Mod Placement" sheet will now show the required armor energy capacity upgrades to make all mods fit (and the total upgrade costs).
* Loadout Optimizer sets will now show energy capacity bars below armor pieces, similar to the "Show Mod Placement" sheet.
* Loadouts created before Lightfall with deprecated stat mods now have their stat mods restored.
* Mods in the loadout mods picker are now more logically ordered by matching the in-game order.
* Autocompletion in the search bar now succeeds for terms with umlauts even if you didn't enter any (suggests "jötunn" when typing "jot...").
* Fixed the `modslot:any`/`modslot:none` filters.
* Fixed an issue where some subclass fragments and armor mods would be missing descriptions in Loadout Optimizer and the Loadout editor.
* The minor boosts to all stats that enhanced crafted and masterworked adept weapons have are now ignored in Organizer's "Masterwork Stat" column and by the `masterwork:statname` filter. Only the primary +10 boost is considered.
* Sharing build settings directly from Loadout Optimizer will now also include subclass configuration.
* DIM now saves Artifact configuration in Loadouts. Note that DIM cannot reconfigure your artifact automatically, but you can use this information to keep track of which artifact unlocks are important for a Loadout.
* Search autocomplete should be smarter, with the ability to complete item and perk names even when you type multiple words.
* In-game loadouts' icon, color, and name can now be changed through DIM.
* You can create an in-game loadout from your currently equipped items through DIM.
* Added quick clear buttons to each section of the loadout editor.

## 7.62.0 <span class="changelog-date">(2023-03-26)</span>

* Items in the "Focused Decoding" and "Legacy Gear" screens within the Vendors page will now correctly show collection and inventory checkmarks.
* The current power caps and power floor are now displayed on the Milestones section of the Progress screen.
* Display the current and max Postmaster count at all times.
* Armor mods descriptions now include their stacking behavior.
* Added tooltips for the loadout optimizer settings shown on saved loadouts.
* The "mod assignment" screen displays better on mobile.
* The icons for weapon slots have been changed to reflect how they work in game. What was the "kinetic" slot now shows kinetic, stasis, and strand icons while the "energy" slot shows solar, arc, and void icons.
* On mobile, you can no longer accidentally scroll the whole page while viewing search results.
* Clicking "Manage Loadouts" from the character menu will bring you to the Loadouts screen for that character instead of your active character.

## 7.61.0 <span class="changelog-date">(2023-03-19)</span>

* Hashtags for items and loadouts can now contain emoji.
* Removed # from loadout filter pills.
* Overloaded range filters (e.g. season:>outlaw) now autocomplete.
* Stat effects for mods/aspects in the mod picker are now both more accurate and more attractive.
* Fixed the color of Strand movement and class abilities on Loadouts screen.
* Fixed an issue where DIM Sync data might not be available when Bungie.net is down.
* Added `source:rootofnightmares`/`source:ron` and `modslot:rootofnightmares` searches.
* DIM now correctly allows you to unsave previously saved queries that later became invalid.
* Fixed the `is:curated` filter never matching weapons without an equipped kill tracker.

## 7.60.1 <span class="changelog-date">(2023-03-14)</span>

* Custom stat fixes
  * Fixed the `stat`/`basestat` filters for weapon stats.
  * Fixed custom stat columns unchecking themselves in Organizer.
* Loadout Optimizer improvements:
  * The tooltip for stat mods now explains when a mod was picked automatically.
  * Mins/Maxes displayed in the stat tier picker now better match the stat rangees found in results.

## 7.60.0 <span class="changelog-date">(2023-03-12)</span>

* Fixed deepsight border showing up for weapons whose pattern has already been unlocked.
* DIM now correctly handles reduced mod costs via artifact unlocks.
* Support added for named and multiple custom total stats. Sort and judge your your armor pieces by multiple situations, like a PVE and PVP stat. Sort by these values in Compare and Organizer, and search by them with stat filters like `stat:pve:>40`.
* Fixed powerful and pinnacle reward calculations.

## 7.59.0 <span class="changelog-date">(2023-03-05)</span>

## 7.58.1 <span class="changelog-date">(2023-03-02)</span>

* DIM supports displaying and equipping in-game loadouts.
* Triage tab is now available outside of DIM Beta. This feature provides information to help quickly compare and judge a new (or old) item.
  * Whether am armor piece is high or low among your others, or is completely better or worse than another.
  * How many other similar weapons you have, and weapon Wishlist status.
  * Whether an item is included in loadouts, and which.
* Bright Dust and XP have been added to the filter pills on bounties and seasonal challenges.
* `is:statlower` knows about the new artifice armor rules and will consider the artifice +3 stat boost in a single stat when comparing against other armor.
* Sorting in the Organizer is a bit more reliable.
* DIM should be more resistant to being logged out during API maintenance.
* Loadout Optimizer will now automatically use Artifice mod slots to improve build stats, and the arrows point the right way.
* The tooltip for enhanced intrinsics or adept masterworks will now only show the stat boosts actually relevant to the item.
* The materials popup has been updated for Lightfall.
* Deepsight weapons once again appear with a red border. The deepsight search terms have been collapsed into just `is:deepsight` as there is no longer deepsight progress on items.
* Removed useless energy indicators on armor.

### Beta Only

* Loadout Optimizer's toggle to include required stat mods has been changed to optimize all builds using as many stat mods as possible. This is a consequence of the artifice changes.

## 7.58.0 <span class="changelog-date">(2023-02-26)</span>

* The `inloadout` filter now finds hashtags in Loadout notes.
* Support for non-English hashtags.
* Added a popup on crafted weapons that shows all their kill tracker stats at once.
* Switched D2Gunsmith link to D2Foundry.

## 7.57.0 <span class="changelog-date">(2023-02-19)</span>

* Add `is:retiredperk` search that highlights items that have a perk which can no longer drop for that item.
* You can now click a Loadout name in Organizer's Loadouts column to quickly bring up this loadout for editing.
* When hovering over subclass Aspects in Loadouts and Loadout Optimizer, the tooltip will now show the number of Fragment slots granted.
* You can now bring up the Armory page for a weapon directly from the search bar by typing a weapon name there and clicking the corresponding entry.
* Improved the logic for choosing what item to equip when de-equipping an item. DIM will now generally avoid equipping exotics as replacements, and will pay attention to the type of item and your tags.

## 7.56.0 <span class="changelog-date">(2023-02-12)</span>

* Fixed the Compare tool for items with quotation marks in their name.

## 7.55.0 <span class="changelog-date">(2023-02-05)</span>

## 7.54.0 <span class="changelog-date">(2023-01-29)</span>

## 7.53.0 <span class="changelog-date">(2023-01-22)</span>

* On the Records and Armory pages, perks only shown on the collections/"curated" roll will now correctly be marked as unavailable on randomly rolled versions.
* Added a `crafteddupe` search filter. This allows you to find duplicate weapons where at least one of the duplicates is crafted.
* Added shaped date to the organizer, and a shaped overlay to more easily pick out shaped weapons.
* DIM will remember where you were linked to when you log in - you no longer have to log in then open that loadout link again.
* Bounties and seasonal challenges now show their base XP value (before any bonuses). This is community sourced data which may not remain accurate with subsequent game updates.

## 7.52.0 <span class="changelog-date">(2023-01-15)</span>

* Loadout hashtags are now auto-completed in the Loadout name and notes fields. Type `#` to suggest tags used in other Loadouts.
* Destiny symbols are now available in Loadout names and notes, and item notes. Type `:` for symbol suggestions or use the symbols picker in the text fields.
* The "Sync item lock state with tag" setting now excludes crafted weapons, as DIM would otherwise re-lock crafted weapons during reshaping.
* In accordance with all standard armor mods being unlocked in-game, DIM now also considers these mods unlocked.

## 7.51.0 <span class="changelog-date">(2023-01-08)</span>

* If you add hashtags to your loadouts' names or notes, DIM will show buttons for quickly filtering down to loadouts that include that hashtag.
* Fixed a bug where the "Show Older Items" button in the Item Feed would not permanently show all old items.
* The Armor and Weapons CSV export in Organizer and Settings now includes a Loadouts column.
* Fixed universal ornament unlock detection.
* Opening the Armory view from a Vendor focusing item now shows the correct weapon with all available perks, not a dummy item.

## 7.50.3 <span class="changelog-date">(2023-01-04)</span>

## 7.50.2 <span class="changelog-date">(2023-01-04)</span>

## 7.50.1 <span class="changelog-date">(2023-01-03)</span>

* Removed the "2x" tag on Crucible rank.

## 7.50.0 <span class="changelog-date">(2023-01-01)</span>

* DIM now loads a saved copy of your inventory even when it is offline or Bungie.net is down. The saved copy is whatever information Bungie.net last successfully provided on that device.
  * The refresh button now has a tooltip showing how recently DIM was able to load your inventory from Bungie.net. This can help identify when DIM's view is out of date, relative to the in-game state.
* If DIM Sync is down, the Export Backup button will save a copy of your local data instead of just failing.
* DIM can now automatically sync an item's log state to its tag - favorite, keep, and archive tags auto lock the item, and junk or infuse tags unlock the item. This option needs to be enabled in settings, and when it's on the item tile will no longer show the lock icon for tagged items.
* Crafted items will no longer lose their tags/notes or be missing from loadouts after being reshaped. This only affects items that are newly tagged or added to loadouts - crafted weapons that were already tagged or in loadouts will not be preserved when reshaping them.
* Worked around an issue where class item mods from the fourth artifact column would be missing for some players.

### Beta Only

* If you add hashtags to your loadouts' names or notes, DIM will show buttons for quickly filtering down to loadouts that include that hashtag.

## 7.49.0 <span class="changelog-date">(2022-12-25)</span>

* The filter help menu item is now keyboard accessible.
* Fixed a bug where opening a loadout link could result in the loadout reopening later.
* DIM should be better at ignoring when Bungie.net sends back outdated inventory data.

## 7.48.0 <span class="changelog-date">(2022-12-18)</span>

* Using the "Import Loadout" button on the Loadouts page, you can now paste loadout share links (like `dim.gg` links or links generated by other community sites) to open these loadouts directly in DIM.
  * This should make it easier to open shared loadouts where you're using DIM instead of opening those loadouts in a new browser tab every time.
* Added a "Clear Feed" button to the Item Feed.

## 7.47.0 <span class="changelog-date">(2022-12-11)</span>

## 7.46.1 <span class="changelog-date">(2022-12-07)</span>

* Fix an error preventing Collections from being displayed.

## 7.46.0 <span class="changelog-date">(2022-12-04)</span>

## 7.45.0 <span class="changelog-date">(2022-11-27)</span>

## 7.44.1 <span class="changelog-date">(2022-11-22)</span>

* A Rising Tide community event: Updates for new declassified items, and support for new dynamic values in the titles of Items and Vendor Categories.

## 7.44.0 <span class="changelog-date">(2022-11-20)</span>

* When using the Compare tool with weapons, enabling the "Assume Masterworked" toggle will show weapon stats as if their masterwork was upgraded to T10.

## 7.43.0 <span class="changelog-date">(2022-11-13)</span>

* Gilding Triumphs for Seals are now denoted with a background, darker colors, and label text.
* Loadout Optimizer now has Undo/Redo buttons covering all configuration options.
* When Loadout Optimizer can't find any builds, it will now recommend configuration changes that could allow it to find builds.

## 7.42.3 <span class="changelog-date">(2022-11-10)</span>

* Telesto has been reprimanded.

## 7.42.2 <span class="changelog-date">(2022-11-09)</span>

## 7.42.1 <span class="changelog-date">(2022-11-09)</span>

* Fixed an issue where DIM Sync data (loadouts, tags, etc) could appear missing for 10 minutes after loading DIM.

## 7.42.0 <span class="changelog-date">(2022-11-06)</span>

* Applying a Loadout with subclass configuration should now avoid pointless reordering of Aspects and Fragments in their slots.
* When selecting a subclass in Loadout Optimizer, it will now start configured with your currently equipped super and abilities (but not aspects or fragments).
* Fixed Compare drawer closing when clicking the button to compare all of a certain weapon type.
* The Materials menu now includes Transmog currencies (Synthweave Bolts/Straps/Plates).

## 7.41.0 <span class="changelog-date">(2022-10-30)</span>

* On first visit, DIM will prompt you to select a platform instead of automatically selecting the most recently played one. Also, DIM will no longer fall back to your D1 account when Bungie.net is down.
* Invalid search queries are now detected more reliably and DIM will not show search results if the query is invalid.
* Loadout Optimizer will now remember stat priorities and enabled stats per Guardian class.

## 7.40.0 <span class="changelog-date">(2022-10-23)</span>

* Catalyst progress shows up in the item popup for exotic weapons that still need their catalyst finished.
* Firefox users should notice fewer cases where their data is out of sync with the game.
* DIM will warn you if you have DIM Sync off and try to save Loadouts or Tags that could be lost without DIM Sync.

## 7.39.1 <span class="changelog-date">(2022-10-18)</span>

* You can now undo and redo changes to loadouts while editing them.
* Fix for an error displaying new vendor inventories when definitions are still old.
* Fix the Progress page's event section to properly detect the new Festival of the Lost event card.
* Removed a now-unnecessary workaround for incorrect subclass ability colors.

## 7.39.0 <span class="changelog-date">(2022-10-16)</span>

* Added `is:armorintrinsic` to find Artifice Armor, armor with seasonal perks, etc.
* Compare suggestion buttons now offer comparison to similar armor intrinsics.
* Added perks to Light.gg links. See your weapon's popularity rating without having to reselect its perks.
* Vendor items now show pattern unlock progress.
* Removed the "streak" boxes from Trials rank.
* Added browser info on the About page

## 7.38.0 <span class="changelog-date">(2022-10-09)</span>

### Beta Only

* Added an experimental Loadout Optimizer setting that automatically adds +10 and +5 stat mods to hit specified stat minimums.

## 7.37.0 <span class="changelog-date">(2022-10-02)</span>

* Add `foundry` search term. Try `foundry:hakke` for all your items brought to you by Hakke.

## 7.36.0 <span class="changelog-date">(2022-09-25)</span>

## 7.35.0 <span class="changelog-date">(2022-09-18)</span>

* Fixed an issue where emblems that were not transferrable across characters were being shown in the loadout drawer.
* DIM now identifies more intrinsic breakers, added `breaker:any`

## 7.34.0 <span class="changelog-date">(2022-09-11)</span>

* Season of Plunder Star Chart upgrades are now shown in the right order on the Vendors page.

## 7.33.0 <span class="changelog-date">(2022-09-04)</span>

* Progress page now correctly classifies the Star Chart weekly challenge as a powerful reward source instead of a pinnacle.
* Visual adjustments to power level tooltips.
* Loadout Optimizer is now aware of King's Fall mods.
* Deprecated mods no longer appear in the Seasonal Artifact preview.
* Made an experimental change to how we sequence Bungie.net API calls that may make their performance more consistent.

## 7.32.0 <span class="changelog-date">(2022-08-28)</span>

* If the DIM API is down and you have pending updates, DIM will load correctly instead of spinning forever. We also do a better job of keeping changes you make while the API is down.
* If the DIM API is not returning some info (e.g. searches), we'll fall back to your locally cached data instead of wiping it out.
* Updating/overwriting a Loadout using Loadout Optimizer's "Compare Loadout" button will now correctly remove the placeholders for armor equipped in the Loadout that no longer exists.
* The item sort for Weapon Damage Type and Armor Element Type are now separate.
* Epic Games accounts should display properly in the menu.
* The loadout name editor will no longer offer system autocomplete.
* Fixed the subclass colors for arc subclass mods.

## 7.31.1 <span class="changelog-date">(2022-08-23)</span>

## 7.31.0 <span class="changelog-date">(2022-08-21)</span>

* Fixed Loadouts trying to clear Solstice sockets and Strip Sockets trying to remove Festival of the Lost helmet ornaments.
* Tooltips have been adjusted further. They now have more spacing around content, rounded corners and improved contrast.

## 7.30.0 <span class="changelog-date">(2022-08-14)</span>

* Tooltips have been redesigned:
  * They now use a darker color scheme that fits in better with the rest of DIM.
  * Perk and mod tooltips for enhanced weapon traits and Exotic catalysts have unique styles to help them stand out.
  * The energy cost of armor mods is displayed within tooltips.
* Fixed an issue where the energy meter on Ghosts was not displaying the amount of energy that had been used by inserted mods.
* Solar class ability and jump icons have had their colors adjusted to match other solar abilities (we couldn't handle it anymore).

## 7.29.1 <span class="changelog-date">(2022-08-07)</span>

* Fix a bug where you couldn't edit a search query from the middle.

## 7.29.0 <span class="changelog-date">(2022-08-07)</span>

* Fixed Armory perk grid showing arbitrary wish list thumbs, and fixed Collections offering wish list notes for unrelated weapons.
* Collections items will now be recognized as craftable. Try the search filter `is:craftable -is:patternunlocked` on the Records page to list craftable weapons you still need to unlock the pattern for, and click the weapons to see your pattern progress.
* When prioritizing where to place other Arc armor mods, DIM Loadout Mod assignment will now try to activate the secondary perks of all types of Arc Charged With Light mods.
* Fixed the "Remove other mods" toggle in Loadouts resetting when saving the Loadout as "Any Class".
* Fixed missing element icons in the Triage pane.
* Added a "Strip Sockets" search action to remove shaders, ornaments, weapon, armor, and artifact mods. This is available from the advanced actions dropdown to the right of the search field. Search for targeted items first, then choose what to remove.
* Eliminated an unnecessary 10 second pause when loading DIM if the DIM Sync service is down.
* Fixed search filter string disappearing when rotating or majorly resizing the DIM window.
* Integration for the [DIM Stream Deck extension](https://dim-stream-deck.netlify.app/) is now available outside DIM Beta.
* Fixed an issue with saving/syncing the Farming Mode slot count setting.
* Fixed a crash and improved the accuracy of the Loadout Optimizer's mod assignment behavior.

### Beta Only

* Added warnings about potential data loss when you save tags, notes, and loadouts but have DIM Sync off.
* Added an info bar when DIM Sync is not able to talk to the server.

## 7.28.0 <span class="changelog-date">(2022-07-31)</span>

* Hid Solstice armor rerolling sockets from Loadout Optimizer too.

## 7.27.0 <span class="changelog-date">(2022-07-24)</span>

## 7.26.1 <span class="changelog-date">(2022-07-23)</span>

* Added Solstice event challenges to the Progress page.

## 7.26.0 <span class="changelog-date">(2022-07-17)</span>

* Worked around a Bungie.net API bug where Vanguard reset count was reported under Strange Favor (Dares of Eternity) instead.
* DIM now has direct support for the [DIM Stream Deck extension](https://dim-stream-deck.netlify.app/). If you have a Stream Deck you can install this plugin and then enable the connection from DIM's settings to control DIM from your Stream Deck. Please note that the plugin is neither written by nor supported by the DIM team.

## 7.25.0 <span class="changelog-date">(2022-07-10)</span>

## 7.24.0 <span class="changelog-date">(2022-07-03)</span>

* Weapon perks now include community-sourced weapon and armor perk descriptions courtesy of [Clarity](https://d2clarity.page.link/websiteDIM) and [Pip1n's Destiny Data Compendium](https://docs.google.com/spreadsheets/d/1WaxvbLx7UoSZaBqdFr1u32F2uWVLo-CJunJB4nlGUE4/htmlview?pru=AAABe9E7ngw*TxEsfbPsk5ukmr0FbZfK8w#). These can be disabled in settings.
* DIM will now auto refresh while you're playing the game. You'll see a green dot when DIM notices you're online - if you're online and it doesn't notice, try refreshing manually by clicking the refresh icon or hitting the R key.
* If you have a title equipped on your character, it will replace your character's race in the character headers.
* Fixed a crash when trying to assign deprecated Combat Style mods.
* The "Move other items away" loadout toggle no longer clears ghosts, ships, or sparrows.
* Added filter for enhanced perks.

### Beta Only

* We have enabled experimental direct support for the [DIM Stream Deck extension](https://dim-stream-deck.netlify.app/). If you have a Stream Deck you can install this plugin and then enable the connection from DIM's settings to control DIM from your Stream Deck. Please note that the plugin is neither written by nor supported by the DIM team. **If you had installed the old Stream Deck Chrome extension, you need to uninstall it, or DIM will act weird (popups closing, etc).**

## 7.23.2 <span class="changelog-date">(2022-06-29)</span>

* Fixed an issue where fashion mods would not display in loadouts.
* Fixed the element icon displaying below the energy number in Compare.
* Somewhat worked around an issue with Bungie.net where on refresh you would see an older version of your inventory.
* Fixed the crafted weapon level progress bar going missing with some Operating System languages.
* Perk and mod tooltips should contain fewer duplicate lines of text.
* Exotic catalyst requirements are now hidden on tooltips if the catalyst is complete.
* Fixed an issue where stat modifications from Exotic catalysts were being displayed when the catalyst was incomplete.

### Beta Only

* Community-sourced perk descriptions have been made more visually distinct.

## 7.23.1 <span class="changelog-date">(2022-06-27)</span>

* Fix missing icons in the subclass and mod menus.

## 7.23.0 <span class="changelog-date">(2022-06-26)</span>

* The links on the top of the page will now show for narrower screens. All links are always available in the menu.
* Improved performance of switching characters and opening item picker or search results on iOS. Something had gotten slower with Safari in one of the recent iOS updates, so we had to do a lot of work to get back to a responsive UI.
* Fixed the tooltip in the mod assignment page not showing the correct energy usage.

## 7.22.0 <span class="changelog-date">(2022-06-19)</span>

* Fixed a rare edge case where Loadout Optimizer would miss certain valid elemental mod assignments with locked armor energy types.
* When moving multiple items, DIM will transfer them in a more consistent order e.g. Kinetic weapons are moved before Heavy weapons, helmets before chest armor etc.
* Fixed Organizer redundantly showing enhanced weapon intrinsics in multiple columns.
* Vendor items once again show wish list thumbsup icons.
* Weapon attunement and leveling progress now shows a single digit of additional precision.

## 7.21.0 <span class="changelog-date">(2022-06-12)</span>

* The [DIM User Guide](https://github.com/DestinyItemManager/DIM/wiki) has moved back to GitHub from Fandom, so you can read about DIM without intrusive ads.
* When making automatic moves, DIM will always avoid filling in your last open Consumables slot. An item can still be manually moved into your character's pockets as the 50th consumable.
* Loadout Optimizer will now suggest class items with an elemental affinity matching the mods even when allowing changes to elemental affinity.
* Fixed an issue where the item popup could appear partly offscreen.
* Items sorted by tag will re-sort themselves immediately after their tag changes.
* DIM now loads full inventory information on load and doesn't require an inventory refresh for certain info including crafting status.

### Beta Only

* Weapon perks now include community-sourced weapon and armor perk descriptions courtesy of [Clarity](https://d2clarity.page.link/websiteDIM) and [Pip1n's Destiny Data Compendium](https://docs.google.com/spreadsheets/d/1WaxvbLx7UoSZaBqdFr1u32F2uWVLo-CJunJB4nlGUE4/htmlview?pru=AAABe9E7ngw*TxEsfbPsk5ukmr0FbZfK8w#). These can be disabled in settings.

## 7.20.1 <span class="changelog-date">(2022-06-06)</span>

* Fixed some items showing the wrong popup.

## 7.20.0 <span class="changelog-date">(2022-06-05)</span>

* The top level comment of a saved search filter is now displayed separately from the filter query.
* Support for new loot: `source:duality` and `source:haunted`.
* Little clearer warning when you have hidden a major section of your inventory.
* Moved the currencies (glimmer, legendary shards, etc) from the "Armor" tab to the "Inventory" tab on mobile, and also included them in the material counts sheet (accessible from Vault header dropdown).

## 7.19.0 <span class="changelog-date">(2022-05-29)</span>

* Enhanced intrinsics on crafted weapons are now treated as a masterwork internally. As a result, you can use e.g. `is:crafted -masterwork:any` to find crafted weapons without an enhanced intrinsic. The golden border additionally requires two enhanced traits, just like in-game.
* Resonant Element search filters such as `deepsight:ruinous` have been removed as these currencies are now deprecated.
* Selected Super ability is now displayed on Solar subclass icons.
* Features around managing crafting patterns:
  * Items that have a pattern to unlock will show the progress to that pattern in the item popup - even on items that do not have deepsight resonance.
  * Items that can be attuned to make progress in unlocking a pattern have a little triangle on the bottom right of their tile to set them apart.
  * Search filter `deepsight:pattern` finds those items.
  * The search `is:patternunlocked` finds items where the pattern for that item has already been unlocked (whether or not that item is crafted).
  * Don't forget that `is:craftable` highlights any items that can be crafted.
* Fixed Triage tab's similar items search for slug Shotguns.

## 7.18.1 <span class="changelog-date">(2022-05-24)</span>

* Added seasonal info for Season of the Haunted and fixed some bugs with new items.
* Loadouts with a Solar subclass will automatically be upgraded to Solar 3.0.
* Show Airborne Effectiveness stat on weapons.

## 7.18.0 <span class="changelog-date">(2022-05-22)</span>

* In Loadout Optimizer, the option to lock Masterworked armor to its current element has been replaced with an option to lock the element on armor equipped in other DIM Loadouts.
  * The Witch Queen had reduced the cost of changing the element on a fully masterworked armor piece to 10,000-20,000 Glimmer and one Upgrade Module, making it cheaper than changing the element on a not fully masterworked armor piece.
  * Selecting this option means Loadout Optimizer will suggest changes to armor elements as needed but avoid breaking other Loadouts where mod assignments rely on particular elements.
  * Clicking the "Optimize Armor" button in a Loadout to open Loadout Optimizer excludes this Loadout from consideration because you're actually looking to make changes to this Loadout.
* Loadouts list opened from Vault emblem now won't erroneously warn that Loadouts with subclasses or emblems are missing items.

## 7.17.0 <span class="changelog-date">(2022-05-15)</span>

* Fixed Organizer not showing some legendary armor intrinsic perks.
* Fixed a glitch in Loadout Optimizer where legendary armor intrinsic perks could be clicked to lock that piece as an exotic.
* Fixed double zeroes on armor in Compare.
* Fixed bad stat coloring in Compare when stats are more than 100 points apart (this only really affected power level).
* Popups and tooltips are a bit snappier.
* The close button in the Armory view (click an item's title) no longer overlaps the scrollbar.
* Inventory size stat no longer shows on any item - it used to show on Bows only.

## 7.16.1 <span class="changelog-date">(2022-05-09)</span>

* Fix "lower is better" stats not being masterworked gold in the item popup.

## 7.16.0 <span class="changelog-date">(2022-05-08)</span>

* Stat bonuses granted to crafted weapons by an enhanced intrinsic are now distinguished in the stat bars similarly to masterwork effects.
* Make sure DIM displays the scoring thresholds on the Shoot To Score quest.
* The recoil direction stat has been tweaked to show a much wider spread as the recoil stat value decreases.

## 7.15.0 <span class="changelog-date">(2022-05-01)</span>

## 7.14.1 <span class="changelog-date">(2022-04-26)</span>

* Reverted Deepsight workaround, so weapon attunement displays correctly.

### Beta Only

* Enabled the Triage tab of the item popup. Find some information here to help decide if an item is worth keeping. Let us know what helps and what could help more!

## 7.14.0 <span class="changelog-date">(2022-04-24)</span>

* Work around an issue where Bungie.net is not highlighting completed Deepsight weapons.

## 7.13.0 <span class="changelog-date">(2022-04-17)</span>

* If an armor piece doesn't have enough mod slots to fit the requested mods (e.g. three resist mods but no artifice chest piece), DIM will notice this earlier and show them as unassigned in the Show Mod Placement menu.
* Added text labels to "icon-only" columns (lock icon, power icon, etc.) in dropdowns on the Organizer page. Only show label in dropdowns, columns show icon only.
* Echo of Persistence Void Fragment now indicates that it has a stat penalty depending on the Guardian class.
* We no longer auto-refresh inventory if you "overfill" a bucket, as refreshing too quickly was returning out-of-date info from Bungie.net and making items appear to "revert" to an earlier location. Make sure to refresh manually if DIM is getting out of sync with the game state.
* Using the Mod Picker to edit loadout mods should now correctly show all picked mods.
* Selecting a different weapon masterwork tier for previewing should now correctly preview the final value of the changed stat in the masterwork picker.
* Fixed a case where the "Gift of the Lighthouse" item might be in your inventory but not show up in DIM. Allowed some items with missing names to appear in your inventory.

## 7.12.0 <span class="changelog-date">(2022-04-10)</span>

* If a wish list contains only non-enhanced perks, DIM will mark a roll as matching if it has the Enhanced versions of those perks.
* Fixed a rare edge case where Loadout Optimizer would not consider legendary armor if you own an exotic with strictly better stats.
* Glaive symbol now shows up in bounties, challenges, etc.
* `is:extraperk` filter finds weapons with additional toggleable perks, from pinnacle activities and Umbral Focusing.
* Fixed perk grouping for some perk-only wish lists.
* Armory wish list view now shows perks, magazines, barrels, etc. in a similar order to the in-game view.
* Re-added the D2Gunsmith link to the weapons armory page.
* `memento:any`, `memento:nightfall` etc. filters find crafted weapons with a memento inserted.

## 7.11.0 <span class="changelog-date">(2022-04-03)</span>

* The Item Popup's header now opens the Armory view when clicked, and has some cursor/link styling as a reminder.
* Deprecated Black Armory Radiance slots are now hidden, to make space for other weapon data.
* Material Counts tooltip now fits onscreen better on desktop. On mobile, it's available under the banner dropdown of the Vault inventory page.
* Wishlist combinations now collapse themselves into manageable groups in the Armory view.
* Enhanced Elemental Capacitor no longer adds all its stat bonuses to weapons on which it's selected.
* Fynch rank is now showing the correct number on the Vendors page.
* Fixed loadouts with Void 3.0 subclasses accidentally including empty fragment or aspect sockets.
* Fixed loadouts failing to remove mods from some armor or inadvertently changing the Aeon sect mod.
* Invalid search terms no longer cause the entire search to match every item.
* Searches do better with quoted strings, and allow for escaping quotes in strings (e.g. `"My \"Cool\" Loadout"`)
* Item moves are better about allowing a move if you really have space on a character, even if DIM hasn't refreshed its view of inventory. That said, DIM will always work best when its view of your inventory is up to date, so continue to refresh data after deleting items in game. DIM will now refresh automatically if we "overfill" a bucket because clearly we're out of date in that circumstance.
* Mod Picker will now properly register Shadowkeep Nightmare Mods as activity mods.
* Selected Super ability is now displayed on Void and Stasis subclass icons.
* Mod position selector avoids invalid sockets a little better.

## 7.10.0 <span class="changelog-date">(2022-03-27)</span>

* Dragging horizontally on items in Compare will scroll the list - even on iOS.
* Mobile users can now access Material Counts under the banner dropdown of the Vault inventory page.
* In the Armory and Collection views, craftable weapons now show their required Weapon Level in their tooltip.
* DIM should no longer get visually mangled by Android's auto-dark-mode.
* Fixed an incorrect item count in non-English inventory searches.
* Try a little harder to re-fetch item definitions data, if Bungie.net sends back an invalid response.
* Searches that can't be saved (because they're too long, or invalid) won't show a save ⭐️ button.
* Search filters can contain comments. Only the top level comment gets saved. e.g. `/* My Cool Search */ is:handcannon perkname:firefly`.
* Loadouts
  * The loadout search field has been moved to the top of the loadout menu, which should prevent iOS from going crazy. Filtering loadouts hides the other buttons as well.
  * Sharing a loadout now shows an explanation of what's being shared.
  * Fixed the loadout drawer not opening when "+ Create Loadout" is selected from the vault.
  * Fixed "Fill from Equipped" going a little overboard on what it tried to add to the loadout, and spamming notifications.

## 7.9.0 <span class="changelog-date">(2022-03-20)</span>

* When loading your inventory, DIM now alerts you if your items might be misplaced, affecting your drops' Power Level.
* New inventory sorting options. Check [Settings](/settings) to view and rearrange your sort strategy.
  * Reverse the order of any individual sorting method.
  * Sort items by whether they are crafted, and whether they have Deepsight Attunement available.
* Fix organizer stats header alignment
* Added Vow of the Disciple raid mods to Loadout Optimizer and search filters.
* Deepsight weapons' attunement progress is now shown on the item popup. Tap and hold, or hover the progress bar to see extractable Resonant Elements.
* Fixed some weird spacing in the item popup perk list when a gun could but doesn't have an origin perk.
* The Progress page properly distinguishes between +1 and +2 pinnacles.

## 7.8.3 <span class="changelog-date">(2022-03-15)</span>

* Fixed loadout search filter to include notes

## 7.8.2 <span class="changelog-date">(2022-03-14)</span>

## 7.8.1 <span class="changelog-date">(2022-03-14)</span>

## 7.8.1 <span class="changelog-date">(2022-03-14)</span>

* Fixed D1 loadout editor not appearing.
* Fixed loadout editor not disappearing after saving/deleting.

## 7.8.1 <span class="changelog-date">(2022-03-13)</span>

* Assume armor masterwork and lock armor energy options will now be saved correctly when saving a loadout from the Loadout Optimizer and loaded correctly when Optimizing Armor.
* Obsolete consumable mods hidden in the Vault are now detected. They should show up on the Inventory page, and DIM should count vault space more accurately.
* Prevent iOS from popping up the keyboard automatically so often.
* Prevent crafting socket from showing up in the Armory.
* Clearer, prettier Enhanced Perk icons.
* Raid crafting materials are now included in the currency counter. Tap and hold, or hover, the consumables count in the vault header to check them.
* Many fixes for how classified items show up, and how they count toward the power level of each Guardian class. Can't see these fixes now, but maybe next time there's a new Raid.
* New search support for `source:vow` (Vow of the Disciple) and `source:grasp` (Grasp of Avarice) and `season:16`.

## 7.8.0 <span class="changelog-date">(2022-03-06)</span>

### Changes

* The "Pull From Postmaster" button no longer requires a second tap to confirm. For those who dislike this button, it may be removed entirely via a setting in the Settings page.
* Removed D2Gunsmith link from the item details popup while they work on revamping the site for all the new changes.
* Removed the `level:` filter for D2 accounts, as Guardians no longer have a Level and items no longer require one.
* Season of the Risen War Table Upgrades are now in the right order and show their acquired status.
* Loadout Optimizer Mod picker will now correctly update when switching between mod slots without closing Mod Picker.
* Loadout Optimizer now correctly takes Echo of Persistence's class-specific stat reductions into account when generating sets.
* The "Kinetic Slot" icon in Compare sheet now looks different from the "Kinetic Damage" icon.
* Added `catalyst:` filter which accepts the following parameters `missing`, `complete`, and `incomplete`.

### Features

* `is:wishlistunknown` highlights items that have no rolls in the currently loaded wishlist.
* When you have 10 or more loadouts, a search box will appear in the Inventory page loadout dropdown, allowing you to search names just like on the Loadouts page.
* The Item Feed is available on both desktop and mobile. It shows your gear in the order it dropped, and gives you quick controls to tag incoming loot. Click on the item tile to get the full item popup.
  * Item Feed also got better at identifying relevant weapon perks.
  * Tagging an item from the Item Feed also marks it as not-new.
  * Items can be dragged out of the feed into inventory locations (or into the loadout editor).
* We have brand new Loadout Editor! Check it out from the character menu or the Loadouts page.
  * The layout mirrors the Loadout page's new design which has clear areas for different types of items. Each section also has a menu of additional actions like re-syncing from your currently equipped items, or clearing out a whole section.
  * As part of this change, we're removing support for "multi-class" loadouts. Loadouts will either be tied to one class, or can be toggled to "Any Class". "Any Class" loadouts cannot contain Subclass, Armor, or Fashion. If you edit an existing "Any Class" loadout and save it, those items will be removed unless you turn off "Any Class".
  * Double-click items to toggle between equipped and unequipped instead of single clicking. We'll be continuing to improve how you choose items and specify whether they're equipped in the future.
  * A new setting allows you to clear out all other mods from your armor when applying a loadout. This works even if you've chosen no mods in your loadout, so you can make a "Reset mods" loadout.
  * With this new design we have space to add even more loadout editing tools over the next few seasons.
  * The loadout editor stays open if you navigate to the Inventory or Loadouts screen while it's already open.
  * The new Loadout Editor is not available for D1.

### Witch Queen updates

* Crafted and Deepsight weapons are now more in line with how they look in-game.
* Old loadouts containing void subclasses will upgrade automatically to the new Void 3.0 version, instead of telling you the loadout is missing an item.
* Enhanced perks are now visually distinct in the Item Popup.
* The Organizer page now includes a selector for Glaives.
* Glaives now show their Shield Duration stat.
* New search filters:
  * `deepsight:complete` and `deepsight:incomplete` to check the status of weapons' Deepsight attunement.
  * `deepsight:ruinous`, `deepsight:adroit`, `deepsight:mutable` and `deepsight:energetic` to identify Deepsight Resonance weapons that can provide specific Resonant Elements.
  * `is:craftable` for any weapons which could be crafted at the Relic.
  * `weaponlevel:` to filter by a crafted weapon's level.
  * `is:glaive` ... finds Glaives!

## 7.7.0 <span class="changelog-date">(2022-02-28)</span>

* Increased the strings we search through when filtering by mods/perks.
* Crafted weapons' levels and level progress are now shown on the item popup.
* Added `is:crafted` and `is:deepsight` filters.
* Crafting materials are now included in the currency counter. Tap and hold, or hover, the consumables count in the vault header to check them.
* Fixed a bug where "Use Equipped" would not update fashion in existing loadout.

## 7.6.0 <span class="changelog-date">(2022-02-21)</span>

* Fix applying D1 loadouts.
* `inloadout:` filter now matches partial loadout names -- use `inloadout:"pvp"` for items in loadouts where "pvp" is in the loadout's name.
* If your loadout includes ornaments, items are shown as if they had the loadout applied in the loadout page and loadout editor.
* You can now change the Aeon sect mod through the item popup.
* You can now edit your equipped Emotes from DIM. You can't add them to loadouts... yet.
* Fix issue where Loadout Optimizer armor upgrade settings were not being migrated from existing loadouts.
* Clan Banners are no longer shown in DIM.
* Weapon compare sheet now includes a button to compare with other legendary weapons of the same category, excluding exotics.
* Armor in collections now displays its collections stat roll.
* Fix issues with button text wrapping in some languages.
* Fix potential element blurriness in Edge browser.
* Fix for Loadout Optimizer suggesting armor with insufficient energy.
* Fix a clash between `power:1234` and `is:power` filters.
* Loadout Optimizer is now a little more thorough in preventing an item from being both pinned and excluded.

### Witch Queen updates

* There's a good chance crafted items will display correctly in DIM. No promises though.
* Prepare Records page for a new section featuring craftable items.

### Beta Only

* Loadout Editor
  * Fix issue where subclasses were counted as general items when dropping into a loadout or filling general from equipped.
  * Allow removal of a single mod through the editor display.

## 7.5.1 <span class="changelog-date">(2022-02-14)</span>

### Beta Only

* We're testing a brand new Loadout Editor. Check it out from the character menu or the Loadouts page.
  * The layout mirrors the Loadout page's new design which has clear areas for different types of items. Each section also has a menu of additional actions like re-syncing from your currently equipped items, or clearing out a whole section.
  * As part of this change, we're removing support for "multi-class" loadouts. Loadouts will either be tied to one class, or can be toggled to "Any Class". "Any Class" loadouts cannot contain Subclass, Armor, or Fashion. If you edit an existing "Any Class" loadout and save it, those items will be removed unless you turn off "Any Class".
  * Double-click items to toggle between equipped and unequipped instead of single clicking. We'll be continuing to improve how you choose items and specify whether they're equipped in the future.
  * A new setting allows you to clear out all other mods from your armor when applying a loadout. This works even if you've chosen no mods in your loadout, so you can make a "Reset mods" loadout.
  * With this new design we have space to add even more loadout editing tools over the next few seasons.
  * The loadout editor stays open if you navigate to the Inventory or Loadouts screen while it's already open.
  * The new Loadout Editor is not available for D1.

## 7.5.0 <span class="changelog-date">(2022-02-13)</span>

* Collect Postmaster now requires an additional click to confirm.
* Transferring ships via search query should now reliably transfer all selected items.
* Filters Help now groups stat comparison operators for a more compact page.
* Milestones are grouped by how much power bonus their rewards can provide.
* On the Loadouts page, you can now drag existing items on the page, into the current Loadout Editor, just like you can on the Inventory page. Use it to grab a couple of your favorite pieces from another loadout!
* Loadout armor stat tiers now include the total tier.
* Changed the Loadout Optimizer's Armor Upgrade options for Assume Masterwork and Lock Element options. All armor will now have an assumed minimum energy capacity of 7. The new settings have the following options,
  * Assumed Masterwork
    * None - Armor will use their current stats.
    * Legendary - Only legendary armor will have assumed masterwork stats and energy capacity
    * All - Legendary and exotic armor will have masterwork stats and energy capacity
  * Lock Element
    * None - No armor will have its element locked
    * Masterworked - Only armor that is already masterworked will have their element locked
    * All - All armor will have element locked

## 7.4.0 <span class="changelog-date">(2022-02-06)</span>

* Masterwork picker now only shows higher tiers of the current masterwork and full masterworks compatible with the weapon type.
* Sharing a build from the Loadouts page or Loadout Optimizer now uses our dim.gg links which are easier to share and show a preview.
* If you prefer reduced motion (in your operating system preferences), sheets like the compare and loadout dialogs now appear and disappear instantly.
* Clearer feedback when uploading a wishlist file.
* Expanded Organizer categories to account for Fusions and LFRs in unusual weapon slots.
* Visual fixes for Organizer categories and Vendor page toggles.

## 7.3.0 <span class="changelog-date">(2022-01-30)</span>

* Organizer drill-down buttons now show a more accurate armor count.
* Delete Loadout button now looks more warning-ish, and asks for confirmation without using a popup.
* DIM will now try to recover from a state where the browser has a corrupted storage database.
* DIM will now try to avoid overwriting shaders you don't own and thus couldn't apply back.
* Removing subclass from loadout will now enable "Add Equipped" button.
* "Add Equipped" button will no longer cause multiple items in the same slot to be listed as equipped.
* Widened and reorganized the Loadouts menu.
  * Pull from Postmaster (and its lesser known cousin, Make room for Postmaster) are removed in favor of the button next to your Postmaster items.
  * Randomize loadout is now at the end of the list of loadouts.

## 7.2.0 <span class="changelog-date">(2022-01-23)</span>

* Weapons CSV download now includes a Zoom stat column.
* Shaders, ornaments, and mods can now be searched in their choosers.
* Trials passages now show the number of rounds won and the progress of completion is now tied to the number of wins.

## 7.1.0 <span class="changelog-date">(2022-01-16)</span>

* Applying a loadout *without* fashion will no longer remove shaders and ornaments from your armor.
* The shader picker now filters invalid shaders more consistently and won't call shaders "mods".
* Fixed Records page sometimes duplicating Triumphs or Seals section while missing Collections.
* When provided multiple wish lists, Settings page now shows info about all loaded wish lists, not just the first one.
* Compare Drawer should no longer refuse valid requests to add an item to comparison.

## v6 CHANGELOG

* v6 CHANGELOG available [here](https://github.com/DestinyItemManager/DIM/blob/master/docs/OLD_CHANGELOG/OLD_CHANGELOG_6.X.X.md)
