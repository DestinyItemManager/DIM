# Next

* Fixed the logic for deciding which items can be tagged.
* Fix "Make room for postmaster".
* Record books have been moved out of the inventory into their own page. Get a better look at your records, collapse old books, and narrow records down to only those left to complete.
* Fix changing new-item shine, item quality display, and show elemental damage icon preferences. They should apply immediately now, without a reload.x
* Localization updates.
* Fixed objective text in the record book floating above stuff.
* Fixed displaying record objectives that are time-based as time instead of just a number of seconds.
* When pinned to the iOS home screen, DIM now looks more like a regular browser than an app. The upside is you can now actually authorize it when it's pinned!
* Loadouts with a complete set of equipped armor now include a stat bar that will tell you the stat tiers of the equipped loadout pieces.
* Loadouts with non-equipping items now won't *de-equip* those items if they're already equipped. #1567
* The count of items in your loadout is now more accurate.

# v3.17.1

* Fixed a bug with the display of the amount selection controls in the move popup for stackable items.
* Localization updates
* Moved the "VCR" controls for stackable item amount selection to their own row.

# 3.17.0

* Fixed the perk selection in Loadout Builder. #1453
* Fixed the logic for artifact bonuses to compute the right number. #1477
* Restore some missing images from our build system changes.
* Don't allow engrams to be tagged. #1478
* Add home screen icons (and Safari tab icons, and Windows tile icons) for the website.
* Fixed "is:locked" filters to be consistent for engrams. #1489
* The Beta website is now updated automatically for every PR.
* If you're not logged in to the website, we show the login screen.
* Better error messages for when you have the wrong platform selected, plus the error doesn't cover the platform selector.
* Improved website compatibility with Firefox, Safari, and Edge.
* Many style fixes for Safari.
* Drag and drop is now supported on touch devices. Press and hold an item to drag it. #1499
* Armsday packages can no longer be dragged. #1512
* Add tags and notes to items! This has been in Beta forever but now it's official. Hit ? to see the keyboard shortcuts, and use "tag:" searches to find your tagged gear.
* Remove Materials Exchange from the beta.
* Vendors now show where they are, and are sorted better. All the cryptarchs now appear. Engrams waiting to be decrypted aren't shown in the vendor screen.
* Experimental iOS 9 Mobile Safari compatibility. May be removed in the future.
* Style updates to clean up DIM's look and make sure more screen space is being used for items.
* Gained the ability for us to fill in classified items, even if Bungie hasn't unclassified them. You still can't transfer them though.
* The "Hide Unfiltered Items while Filtering" preference now applies to vendor gear too. #1528
* When moving stacks of items through the popup, there are now buttons to max out the amount, and add and remove up to even stacks of items.
* Xur should disappear on Sundays again.

# 3.16.1

* Significantly increased the storage limit for tags and notes. It's still possible to go over (especially with long notes) but it should happen far less frequently - and it should notify you when it happens.

# 3.16.0

* Removed farming option to keep greens since they're disassembled by default now.
* Added stat search, for example: "stat:rof:>= 22"
* Fixed formatting for search loadouts when the search terms contain angle brackets.
* A new "Make room for Postmaster items" auto layout will clear out enough space on your character to pick up all the stuff you've accumulated at the Postmaster.
* Vendor items now explain what you need to do to get them.
* Xur looks like the other vendors, and correctly displays both heavies now.
* Compare tool styling updates.
* Compare tool shows attack/defense.
* In the compare tool, stats that are the same across all items are white instead of blue.
* There's now a picture of each item in the compare tool.
* Clicking the title of an item in the compare tool will scroll to that item and "pop" it so you know which one it is.
* Armor and items that don't match the equipping character will once again transfer in loadouts. You can still put multiple subclasses of the same damage type in a loadout.
* Empty space around talent grids has been eliminated.
* Memory of Felwinter's stat bar no longer overflows its container.

# 3.15.0

* Permit the same damage type of subclass in loadouts (#1067)
* Update record books to properly display time instead of a large number. (#1051)
* Moving an item into a full vault but an empty bucket (such as full General but the vault contains no Consumables) now works.
* Stacks of items are properly accounted for. They'll now combine as things are moved to make space - previously even a stack of 1 consumable would count as taking up the whole slot and would prevent a move of 2 more of that consumable.
* We now catch errors trying to move aside items and retry with a different item. You should see fewer failed moves!
* "Thrashing" in farming mode is fixed. When farming mode can't proceed (because moving anything off the character would result in something else being moved back on, because you're out of space), we now show a friendly info message. This message is throttled to show up no more than once a minute.
* Fixed a bug where a full vault would prevent farming mode from moving things to other characters.
* The move aside logic strongly prefers putting things on characters other than the original item's owner. This makes it much easier to move a bunch of stuff off of a character without other things bouncing right back in.
* Prefer putting engrams in the vault and not taking them out when choosing items to move aside.
* Farming mode now makes room to pick up artifacts, materials, and consumables.
* When making space in the "General" category or in Materials/Consumables buckets, we'll choose to move aside an item that can be combined with another stack somewhere without increasing the total number of stacks. This trends towards consolidation and can help free up a full vault, as well as getting rid of stray stacks.
* We swapped in "special ammo synth" and "primary ammo synth" instead of "motes of light" and "strange coins" for the farming mode quick gather buttons. They seemed more useful in the heat of battle.
* When dequipping an item, we try harder to find a good item to equip in its place. We also prefer replacing exotics with other exotics, and correctly handle The Life Exotic perk.
* Lots of new translations and localized strings.
* Vendors update when you reach a new level in their associated faction, or when you change faction alignment.
* Fixed a too-small perk selection box in the loadout builder, and properly handle when vendors are selling Memory of Felwinter.

# 3.14.1

* Internationaliztion updates.
* Fix for Loadout Class Type bug.

# 3.14.0

* Compare Weapons and Armor side-by-side.
* Added `is:sublime` filter
* Added detailed information to the Trials of Osiris popup card.
* Added more detection for item years.
* The collapse button now no longer takes up the whole bucket height.
* Fixed marking which characters had access to vendor items.
* Fix tracking new items when the new-item shine is disabled.
* Added option to Farming Mode to not move weapons and armor to make space for engrams.
* About and Support pages are now translatable.
* Improved error handling and error messages.
* Vendors are collapsible.
* All vendor items (including duplicates with different rolls) will now show up.
* Added more translations.
* If you have more than one Memory of Felwinter, they are all excluded from loadout builder.
* Export correct quality rating for items in CSV.

# 3.13.0

* The vendors page is back. It'll show all available vendors. It's now a lot faster, and combines vendor inventory across your characters. Consumables and Bounties are now shown. Item stats and quality will hopefully show up on 11/8.
* Loadout builder has option to load from equipped items.
* Added option to farm green engrams or not.
* When moving consumable stacks, you can now choose to fill up one stack's worth.
* Don't sort bounties (the API does not currently provide the in-game order.)
* Fix max-light rounding.
* Fix a bug in the new filters for source.
* Fix incognito mode launching
* More i18n.
* Classified items in the vault are now counted and shown.
* DIM is faster!
* Memory of Felwinter is now excluded from loadout builder by default.

# 3.11.1

* Fixed an issue with farming mode where users without motes, 3oC, coins, or heavy could not use farming mode.
* Fixed an issue where classified items would not show up in the UI.

# 3.11.0

##### New
* Added Quick Move items to farming mode.
* Farming mode now also moves glimmer items to vault.
* Added `is:inloadout` filter
* New filters: is:light, is:hasLight, is:weapon, is:armor, is:cosmetic, is:equipment, is:equippable, is:postmaster, is:inpostmaster, is:equipped, is:transferable, is:movable.
* New filters for items based on where they come from: is:year3, is:fwc, is:do, is:nm, is:speaker, is:variks, is:shipwright, is:vanguard, is:osiris, is:xur, is:shaxx, is:cq, is:eris, is:vanilla, is:trials, is:ib, is:qw, is:cd, is:srl, is:vog, is:ce, is:ttk, is:kf, is:roi, is:wotm, is:poe, is:coe, is:af.
* Added debug mode (ctrl+alt+shift+d) to view an item in the move-popup dialog.
* Added max light value to max light button in dropdown.
* Major loadout builder performance enhancements.
* Support rare (blue) items in loadout builder.

##### Tweaks
* Consumables and materials are now sorted by category.
* All other items in the General Bucket are sorted by Rarity.
* Move ornaments inbetween materials and emblems.
* Link to wiki for stat quality in the move-popup box.
* Full item details are shown in the move popup by default (they can still be turned off in settings).

##### Bugfixes
* Prevent double click to move item if loadout dialog is open.
* [#889](https://github.com/DestinyItemManager/DIM/issues/889) Fixed stats for Iron Banner and Trials of Osiris items.
* Fix infusion finder preview item not changing as you choose different fuel items. Also filter out year 1 items.
* Fix some green boots that would show up with a gold border.
* A bunch of consumables that can't be moved by the API (Treasure Keys, Splicer Keys, Wormsinger Runes, etc) now show up as non-transferable in DIM.
* Husk of the Pit will no longer be equipped by the Item Leveling loadout.
* Fixed equipping loadouts onto the current character from Loadout Builder.
* The default shader no longer counts as a duplicate item.
* DIM no longer tries to equip exotic faction class items where your character isn't aligned with the right faction.
* Fixed more cases where your loadouts wouldn't be applied because you already had an exotic equipped.
* Elemental Icons moved to bottom left to not cover the expansion symbol.
* Loadout builder no longer shows duplicate sets.
* Fix equip loadout builder equip to current character.

# 3.10.6

* The DestinyTracker link in the item popup header now includes your perk rolls and selected perk. Share your roll easily!
* Fixed moving consumables in loadouts. Before, you would frequently get errors applying a loadout that included consumables. We also have a friendlier, more informative error message when you don't have enough of a consumable to fulfill your loadout.
* Fixed a bug where when moving stacks of items, the stack would disappear.
* The progress bar around the reputation diamonds is now more accurate.
* Enabled item quality.
* Item Quality is enabled by default for new installs.
* A new Record Books row in Progress has your Rise of Iron record book.
* Searches now work for all characters and the vault again.
* Can equip loadouts onto the current character from Loadout Builder.
* Added ability to feature toggle items between Beta + Release.

# 3.10.5

* Added Ornaments.

# 3.10.4

* We handle manifest download/cache errors better, by deleting the cached file and letting you retry.
* Date armor ratings end is on 9/20/2016 @ 2AM Pacific.
* Fixed issues with broken images by downloading from Bungie.net with https.
* Loadouts for multi-platform users will now save selected and equipped items for both platforms.  Previously, when switching platforms, loadouts would remove items from the loadout for the opposite platform.

# 3.10.3

* Fixed a "move-canceled" message showing up sometimes when applying loadouts.
* Bugged items like Iron Shell no longer attempt to compute quality. They'll fix themselves when Bungie fixes them.
* Fixed "Aim assist" stat not showing up in CSV (and no stats showing up if your language wasn't English).
* We now catch manifest updates that don't update the manifest version - if you see broken images, try reloading DIM and it should pick up new info.
* Worked around a bug in the manifest data where Ornamenent nodes show up twice.
* DIM won't allow you to move rare Masks, because that'll destroy them.
* The "Random" auto loadout can now be un-done from the loadout menu.
* For non-variable items (emblems, shaders, ships, etc) in a loadout, DIM will use whichever copy is already on a character if it can, rather than moving a specific instance from another character.

# 3.10.2

* Fixed error building talent grid for Hawkmoon.
* Don't attempt to build record books when advisors are not loaded.
* Dragged items now include their border and light level again.
* New-item overlays have been restored (enable in settings).
* Reenable record book progress.
* Better handle errors when record book info isn't available.
* Show an error message if the manifest doesn't load.
* Fix an error when equipping loadouts.
* DIM usage tips will only show up once per session now. You can bring back previously hidden tips with a button in the settings page.

# 3.10.0

* Add ability to create loadouts by selecting sets of perks.
* [#823](https://github.com/DestinyItemManager/DIM/issues/823) Added 'current' property to stores.
* The DIM extension is now much smaller.
* DIM can now display item information in all supported Destiny languages. Choose your language in the settings then reload DIM.
* We now automatically pick up Destiny data updates, so DIM should work after patches without needing an update.
* The Reputation section should match the in-game logos better now.
* Disable new item overlays due to a bug.

# 3.9.2

* [#812](https://github.com/DestinyItemManager/DIM/issues/812) Removed rare masks from the items table used by the random item loadout.

# 3.9.1

* [#801](https://github.com/DestinyItemManager/DIM/issues/801) Resolved error with vendor page character sorting.
* [#792](https://github.com/DestinyItemManager/DIM/pull/792) Warning if user clicks on perks to notify them that they can only be changed in game.
* [#795](https://github.com/DestinyItemManager/DIM/pull/795) Updated strange coin icon for Xur.

# 3.9.0

* New glimmer-based filters, is:glimmeritem, is:glimmerboost, is:glimmersupply
* Add option for new item and its popup to be hidden
* Add ability to exclude items from loadout builder.
* Expand/collapse sections in DIM.
* Double clicking an item will equip it on the current character. 2x click on equipped, dequips.
* Show current vendor items being sold.
* Move popup won't pop up under the header anymore.
* If you have an open loadout, and you click "Create loadout", it switches to the new loadout now instead of leaving the previous loadout open.
* DIM is once again faster.
* The loadout editor won't stay visible when you change platforms.
* Fixed a lot of bugs that would show all your items as new.
* New-ness of items persists across reloads and syncs across your Chrome profile.
* New button to clear all new items. Keyboard shortcut is "x".
* Help dialog for keyboard shortcuts. Triggered with "?".
* When you have two characters of the same class, applying a loadout with a subclass will work all the time now.
* Item class requirements are part of the header ("Hunter Helmet") instead of in the stats area.
* You can search for the opposite of "is:" filters with "not:" filters. For example, "is:helmet not:hunter quality:>90".
* Clicking away from the Xur dialog will close any open item popups.
* Fixed an issue where you could not equip a loadout that included an exotic item when you already had an exotic equipped that was not going to be replaced by the loadout.
* Better handling of items with "The Life Exotic" perk.
* New aliases for rarity filters (is:white, is:green, is:blue, is:purple, is:yellow).
* An alternate option for the "Gather Engrams" loadout can exclude gathering exotic engrams.
* Removed popup notification for new items.
* #798 Keyword searches will now scan perk descriptions.
* #799 Randomize equipped items for current character. Don't look at us if you have to play a match using Thorn.

# 3.8.3

* Fix move popup not closing when drag-moving an item.
* Added ability to and filters for track or untracking quests and bounties.
* Fix issue where some sets would be missing from the loadout builder.
* Fixed #660 where postmaster items would not appear in the Postmaster section of DIM, ie Sterling Treasure after the reset.
* Fixed #697 where loadouts will no longer remove the loadouts for the opposite platform.
* Fix an issue where loadouts will not show any items, or transfer any items.
* Add option to show new item overlay animation

# 3.8.2

* Update filter list to include quality/percentage filters
* Add year column to CSV export scripts
* When you have filtered items with a search, you can select a new search loadout option in the loadout menu to transfer matching items.
* The screen no longer jumps around when clicking on items, and the item details popup should always be visible.
* Dialogs should be sized better now.
* Fix character order in move popup buttons.
* Restored the ability to set a maximum vault size. "Auto" (full width) is still an option, and is the default.
* Armor quality is shown in Xur, loadouts, and the infusion dialog if advanced stats is turned on.
* "Take" stackables works again.

# 3.8.1

* Added steps to Moments of Triumph popup (and other record books.)
* Fixed wobbly refresh icon.
* Fixed single item stat percentages.
* Fixed armor export script.
* Possible fix for loadout builder.

# 3.8.0

* Loadout builder redesign and major performance enchancements.
* Items in the postmaster now have quality ratings, can use the infusion fuel finder, show up in the infusion fuel finder, compare against currently equipped items, etc. They behave just like a normal item except you can't move them and they're in a different spot.
* The vault width preference has been removed - the vault now always takes up all the remaining space on the screen.
* Section headers don't repeat themselves anymore.
* Drop zones for items are larger.
* Returning from the min-max tool no longer greets you with a blank, item-less screen.
* Fixed a bug where loadouts were not properly restricted to the platform they were created for.
* Xur's menu item will properly disappear when he leaves for the week.
* New items are marked with a "shiny" animation, and there are notifications when new items appear.
* The loadout menu may expand to fill the height of the window, but no more. The scrollbar looks nicer too.
* Items can now be made larger (or smaller) in settings. Pick the perfect size for your screen!
* The item info popup has a new header design. Let us know what you think!
* Changing settings is faster.
* You can now download your weapon and armor data as spreadsheets for the true data nerds among us.
* The settings dialog is less spacious.
* Engrams and items in the postmaster can now be locked (and unlocked).
* The buttons on the move item popup are now grouped together by character.
* When the "Hide Unfiltered Items while Filtering" option is on, things look a lot nicer than they did.
* DIM is generally just a little bit snappier, especially when scrolling.
* Clicking the icon to open DIM will now switch to an active DIM tab if it's already running.
* Bungie.net will open in a new tab as a convenience for expired cookies.
* Items in the Postmaster are sorted by the order you got them, so you know what'll get bumped when your postmaster is full.
* Clicking the loadout builder button again, or the DIM logo, will take you back to the main screen.
* You may now order your characters by the reverse of the most recent, so the most recent character is next to the vault.

# 3.7.4

* Removed the option to hide or show the primary stat of items - it's always shown now.
* Add mode selection full/fast for users willing to wait for all best sets.
* Loadout menus are now scrollable for users with over 8 custom loadouts on a single character.
* Changing the character sort order now applies live, rather than requiring a refresh.
* Use most recently logged in player to start with loadout builder.
* Search queries will exclude the token `" and "` as some users were including that when chaining multiple filters.
* Fix UI issue on move popup dialog that had some numbers expanding outside the dialog.
* Consolidate beta icons to the icons folder.

# 3.7.3

* Fix rounding error that prevented some loadout sets from showing up.
* Added filter for quality rating, ex - quality:>90 or percentage:<=94

# 3.7.2

* Always show locked section in loadout builder.
* Fix NaN issue in loadout builder.
* Fix issues with 'create loadout' button in loadout builder.
* For item lvling dont prefer unlvled equiped items on other characters.
* Various Loadout builder bug fixes and performance updates.

# 3.7.1

* Various Loadout builder bug fixes and performance updates.

# 3.7.0

* Added new armor/loadout tier builder.
* Fix for all numbers appearing red in comparison view.
* Updated to latest stat estimation forumla.
* Use directive for percentage width.

# 3.6.5

* Fix an issue where warlocks would see loadouts for all the other classes.

# 3.6.2 & 3.6.3

* Add warning if the lost items section of the postmaster has 20 items.
* Stat bars are more accurately sized.
* Add vendor progress
* Add prestige level with xp bar under characters to replace normal xp bar after level 40.
* It is no longer possible to choose column sizes that cause the vault to disappear.
* The Vault now has a character-style header, and can have loadouts applied to it. Full-ness of each vault is displayed below the vault header.
* New option to restore all the items that were in your inventory before applying a loadout, rather than just the equipped ones.
* You can now undo multiple loadouts, going backwards in time.

# 3.6.1

* Removed the "Only blues" option in the infusion fuel finder, because it wasn't necessary.
* Engram searches and the engram loadout features won't mistake Candy Engrams for real engrams.
* Items in the Postmaster include their type in the move popup, so they're easier to distinguish.
* Sometimes equipping loadouts would fail to equip one of your exotics. No more!
* Add an 'is:infusable' search filter.
* Add 'is:intellect', 'is:discipline', 'is:strength' search filters for armor.
* XP Progress on bar items

# 3.6.0

* Bring back the infusion dialog as an Infusion Fuel Finder. It doesn't do as much as it used to, but now it's optimized for quickly finding eligable infusion items.
* Fix a bug where hovering over a drop zone with a consumable/material stack and waiting for the message to turn green still wouldn't trigger the partial move dialog.
* Added a new "Item Leveling" auto-loadout. This loadout finds items for you to dump XP into. It strongly favors locked items, and won't replace an incomplete item that you have equipped. Otherwise, it goes after items that already have the most XP (closest to completion), preferring exotics and legendaries if they are locked, and rares and legendaries if they're not locked (because you get more materials out of disassembling them that way).
* There's a new setting that will show elemental damage icons on your weapons. Elemental damage icons are now always shown in the title of the item popup.
* Elder's Sigil won't go above 100% completion for the score portion anymore.
* Added roll quality percentage indicator. You can now see how your intellect/discipline/strength stacks up against the maximum stat roll for your armor.
* DIM is smarter about what items it chooses to move aside, or to equip in the place of a dequipped item.
* Added a new "Gather Engrams" loadout that will pull all engrams to your character.

# 3.5.4

* We won't try to equip an item that is too high-level for your character when dequipping items.
* Fix a regression where subclasses wouldn't show up in Loadouts. They're still there, they just show up now!
* Fixed another bug that could prevent item popups from showing up.
* The vault can now be up to 12 items wide.
* Sterling Treasure, Junk Items, and SLR Record Book added to DIM.
* Manifest file updated.

# 3.5.3

* Fixed a bug that would prevent the loading of DIM if Spark of Light was in the postmaster.
* Fixed a bug that prevented the Xur dialog from rendering.

# 3.5.2

* Fix a bug where item details popups would show above the header.
* Fix showing Sterling Treasures in Messages.
* Better error handling when Bungie.net is down.
* Fix a bug where having items in the postmaster would confuse moves of the same item elsewhere.
* Fix a bug where item comparisons no longer worked.
* Added support for the classified shader "Walkabout".

# 3.5.1

* The Infusion Calculator has been removed, now that infusions are much more straightforward.
* Pressing the "i" key on the keyboard will toggle showing item details in the item popup.
* Add a menu item for when Xur is in town. This brings up a panel with Xur's wares, how much everything costs, how many strange coins you have, and lets you show the item details popup plus compare against any version of exotics you might already have to see if there's a better roll.

# 3.5

* DIM will now go to great lengths to make sure your transfer will succeed, even if your target's inventory is full, or the vault is full. It does this by moving stuff aside to make space, automatically.
* Fixed a bug that would cause applying loadouts to fill up the vault and then fail.
* Fixed a bug where DIM would refuse to equip an exotic when dequipping something else, even if the exotic was OK to equip.
* When applying a loadout, DIM will now equip and dequip loadout items all at once, in order to speed up applying the loadout.
* The search box has a new style.
* Item moves and loadouts will now wait for each other, to prevent errors when they would collide. This means if you apply two loadouts, the second will wait for the first to complete before starting.
* Item details are now toggled by clicking the "i" icon on the item popup, rather than just by hovering over it.

# 3.4.1

* Bugfix to address an infinite loop while moving emotes.

# 3.4.0

* Moving and equipping items, especially many at a time (loadouts) is faster.
* When you save a loadout, it is now scoped to the platform it's created on, rather than applying across accounts. Loadouts created on one account used to show on both accounts, but wouldn't work on the wrong account.
* You can now move partial amounts of materials. There's a slider in the move popup, and holding "shift" or hovering over the drop area will pop up a dialog for draggers. You can choose to move more than one stack's worth of an item, up to the total amount on a character.
* New commands for materials to consolidate (move them all to this character) and distribute (divide evenly between all characters).
* Loadouts can now contain materials and consumables. Add or remove 5 at a time by holding shift while clicking. When the loadout is applied, we'll make sure your character has *at least* that much of the consumable.
* Loadouts can now contain 10 weapons or armor of a single type, not just 9.
* When making space for a loadout, we'll prefer putting extra stuff in the vault rather than putting it on other characters. We'll also prefer moving aside non-equipped items of low rarity and light level.
* The is:engram search filter actually works.
* Fixed an error where DIM would not replace an equipped item with an instance of the same item hash. This would cause an error with loadouts and moving items. [448](https://github.com/DestinyItemManager/DIM/issues/448)
* Loadouts can now display more than one line of items, for you mega-loadout lovers.
* Items in the loadout editor are sorted according to your sort preference.

# 3.3.3

* Infusion calculator performance enhancements
* Larger lock icon
* Completed segments of Intelligence, Discipline, and Strength are now colored orange.

# 3.3.2

* If multiple items in the infusion calculator have the same light, but different XP completion percentage, favor suggesting the item with the least XP for infusion.
* Keyword search also searches perks on items.
* New search terms for is:engram, is:sword, is:artifact, is:ghost, is:consumable, is:material, etc.
* Items can be locked and unlocked by clicking the log icon next to their name.
* Display intellect/discipline/strength bars and cooldown for each character
* Loadouts have a "Save as New" button which will let you save your modified loadout as a new loadout without changing the loadout you started editing.
* Autocomplete for search filters.
* Comparing stats for armor now shows red and green better/worse bars correctly.
* Fixed showing magazine stat for weapons in the vault.
* Fixed infusion material cost for Ghosts and Artifacts (they cost motes of light).
* Fix a case where the item properties popup may be cut off above the top of the screen.
* Transfer/equip/dequip actions for edge cases will now succeed as expected without errors.
* Manifest file update.

# 3.3.1

* Updated the manifest file.

# 3.3

* Infusion auto calculator is much faster.
* Items in the infusion calculator don't grey out when a search is active anymore.
* Full cost of infusions is now shown, including exotic shards, weapon parts / armor materials, and glimmer.
* Show a better error message when trying to equip an item for the wrong class. Before it would say you weren't experienced enough.
* Add a button to the infusion calculator that moves the planned items to your character.
* Add a filter to the infusion calculator to limit the search to only rare (blue) items.
* The infusion auto calculator runs automatically, and now presents a list of different attack/defense values for you to choose from. Selecting one will show the best path to get to that light level.
* The infusion calculator greys out items that are already used or are too low light to use, rather than hiding them.
* The item move popup now has an entry for the infusion calculator, to make it easier to find.
* Hold Shift and click on items in the infusion calculator to prevent the calculator from using that item.
* If you have an exotic class item (with "The Life Exotic" perk) equipped, you can now equip another exotic without having the class item get automatically de-equipped. Previously, this worked only if you equipped the non-class-item exotic first.
* Armor, Artifacts, and Ghosts now show the difference in stats with your currently equipped item. Also, magazine/energy between swords and other heavy weapons compares correctly.
* The is:complete, is:incomplete, is:upgraded, is:xpincomplete, and is:xpcomplete search keywords all work again, and their meanings have been tweaked so they are all useful.
* The talent grid for an item are now shown in the item details, just like in the game, including XP per node.
* Subclasses show a talent grid as well!
* The item stats comparison will no longer be cleared if DIM reloads items while an item popup is open.
* Bounties and quests are now separated, and under their own "Progress" heading.
* Bounties, quests, and anything else that can have objectives (like test weapons and runes) now show their objectives and the progress towards them. As a result, completion percentages are also now accurate for those items.
* Descriptions are now shown for all items.
* Include hidden stats "Aim Assist" and "Equip Speed" for all weapons. You can still see all hidden stats by visiting DTR via the link at the top of item details.
* Weapon types are now included in their popup title.
* Removed Crimson Days theme.  It will return.
* Fixed issue at starts up when DIM cannot resolve if the user is logged into Bungie.net.

# 3.2.3

* Updated Crimson Days Theme.
* Removed verge.js

# 3.2.2

* Updated Crimson Days Theme.

# 3.2.1

* Crimson Days theme.
* Weapons and armor now show all activated perks (including scopes, etc), in the same order they are shown in the game.
* Only display the "more info" detail icon if there's something to show.
* If you try to move an item into a full inventory, we'll reload to see if you've already made space in the game, rather than failing the move immediately.
* The Infusion dialog now has a "Maximize Attack/Defense" button that figures out how to get the highest stats with the fewest number of infusions.
* You can now create a loadout based on what you've got equipped by selecting "From Equipped" in the "Create Loadout" menu item.
* After applying a loadout, a new pseudo-loadout called "Before 'Your Loadout'" appears that will put back the items you had equipped.

# 3.2

* In the "Loadouts" dropdown is a new "Maximize Light" auto-loadout that does what it says, pulling items from all your characters and the vault in order to maximize your character's light.
* Lots of performance improvements! Loading DIM, refreshing, moving items, and searching should all be faster.
* DIM will now refresh immediately when you switch back to its tab, or come back from screensaver, etc. It won't automatically update when it's in the background anymore. It still periodically updates itself when it is the focused tab.
* New "is:year1" and "is:year2" search filters.
* Artifacts now have the right class type (hunter, titan, etc).
* The reload and settings icons are easier to hit (remember you can also hit "R" to reload.
* The move popup closes immediately when you select a move, rather than waiting for the move to start.
* New sort option of "rarity, then primary stat".
