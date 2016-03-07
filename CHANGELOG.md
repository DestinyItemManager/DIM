# Next

# 3.3.3

* Infusion calculator performance enhancements
* Larger lock icon
* Completed segments of Intelligence, Discipline, and Strength are now colored orange.
* New loadouts are now scoped to the platform they're created on, rather than applying across accounts.

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
