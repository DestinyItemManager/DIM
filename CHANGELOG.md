# Next

* You can now mark items as "favorite", "keep" or "delete". There are corresponding search filters. There are also keyboard shortcuts - press "?" to see them.
* Fixed a "move-canceled" message showing up sometimes when applying loadouts.
* Bugged items like Iron Shell no longer attempt to compute quality. They'll fix themselves when Bungie fixes them.

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
