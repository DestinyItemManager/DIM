## Next

* Add setting to toggle display of ornaments and view ornaments when hovering over items

## 8.105.0 <span class="changelog-date">(2025-12-28)</span>

* Fix `exactperk/perkname` matching against a perk's type, instead of just its name.
* Added the Synthweave bounty counter to Ada-1's bounty descriptions

## 8.104.0 <span class="changelog-date">(2025-12-21)</span>

* Fix the masterwork socket on crafted and enhanced weapons incorrectly showing a masterwork tier number

## 8.103.1 <span class="changelog-date">(2025-12-16)</span>

## 8.103.0 <span class="changelog-date">(2025-12-14)</span>

* Added heat-related weapon stats.
* Improved mobile view for loadouts.

## 8.102.0 <span class="changelog-date">(2025-12-07)</span>

* DIM should load faster even when it is having trouble loading DIM API data.
* Festival masks will now show up in the Organizer.
* Tiered Engrams in postmaster will now match `is:engrams`
* Fix crash in Loadout Optimizer when changing characters.
* Include more ingame loadout identification info in Triage loadouts list.
* Fixed the well-rested XP calculation being too low for the first 5 levels of the season pass.
* Added a toggle to display vaulted items underneath equipped items in the desktop view.
* Fixed the default shader saying it cannot roll.

## 8.101.1 <span class="changelog-date">(2025-12-02)</span>

* Fixed a crash on the Records page caused by Seasonal Challenges being removed from the game.

## 8.101.0 <span class="changelog-date">(2025-11-30)</span>

* Show weapon frame info on item icons.
* Allow sorting inventory by weapon frame
* support newline escape sequences (\n) in notes

## 8.100.0 <span class="changelog-date">(2025-11-23)</span>

* Fix search/Compare issues with item names containing quotes.

## 8.99.0 <span class="changelog-date">(2025-11-16)</span>

## 8.98.1 <span class="changelog-date">(2025-11-11)</span>

* Display 5 tier pips (instead of none) for bugged Call to Arms Tier 6 holofoil weapons, so there are no misunderstandings.

## 8.98.0 <span class="changelog-date">(2025-11-09)</span>

## 8.97.0 <span class="changelog-date">(2025-11-02)</span>

* Fix being able to remove vendor items individually from Compare.

## 8.96.0 <span class="changelog-date">(2025-10-26)</span>

* Loadout Optimizer allows Festival of the Lost masks to complete a set bonus. You'll still need to plug the right mod in.

## 8.95.0 <span class="changelog-date">(2025-10-19)</span>

* Show a simple ETA countdown for long Loadout Optimizer jobs.
* Added inventory sorting by armor archetype or special modslot.

## 8.94.0 <span class="changelog-date">(2025-10-12)</span>

* Change Organizer to display Tertiary Stat, and Tuning Stats with stat names instead of stat hashes in armor.csv export
* Allowed stripping Combat Flair mods with the Strip Sockets feature.
* Added `tunedstat:unfocused` filter to match items whose tuning stat is not one of the focused stats.
* Removed max light loadout from the Loadouts page because some folks are bothered by it.

## 8.93.0 <span class="changelog-date">(2025-10-05)</span>

* Fixed an issue where loadouts might assign tuning mods in a different order than they were shown in Loadout Optimizer, resulting in different stats.
* Added "Clear all unselected" button to compare menu.
* Added the stat archetype (or mod slot) to the top right corner of armor item tiles.
* Restore progress bars on incomplete D1 items.
* Fixed stat bars in Compare getting squished when the icon size setting is large.
* Restored the setting for how many spaces to clear in Farming Mode.
* Removed the "new item" dot and tracking. This has been gone in Beta for a while now, and the recommendation is to use the Item Feed and tagging to keep tabs on your loot as it drops.
* Fixed a case where some old searches could not be deleted/unsaved.
* Added `is:artifice` filter to find Artifice armor.
* Keep in-game loadouts visible while filtering loadouts

## 8.92.0 <span class="changelog-date">(2025-09-28)</span>

* Reduced the height of the automatic Max Light loadout on the Loadouts page.
* Fix Loadout names being forced to uppercase.
* Add supplied set bonuses to loadouts on the Loadouts page.
* Fixed "Wrong Stat Minimums" showing up on loadouts without stat constraints.

## 8.91.0 <span class="changelog-date">(2025-09-21)</span>

* Updated item tiles to more closely match in-game tiles, with higher quality images.
* Remove armor energy capacity from the item tile. It's just not that interesting these days.
* Added Max power loadout to Loadouts tab
* Items in loadout optimizer sets will now reflect changes like lock/unlock or being masterworked in-game.
* Hide artifact power on its tile since artifact power has been removed.
* Fix tuner mods being automatically assigned in Optimizer even when auto-mods was switched off.
* Removed item Tier pips from engrams.

## 8.90.1 <span class="changelog-date">(2025-09-18)</span>

* Fixed some cases where the enhanced version of perks would not match wishlists that specified the unenhanced version.
* Replaced empty or mismatched mod slot icons with ones that match the activity they're used in.
* Fixed a crash using the Streamdeck plugin.
* `tag:none` no longer selects untaggable objects like materials and abilities

## 8.90.0 <span class="changelog-date">(2025-09-14)</span>

* Updated tuned stat icon.
* `dupe:perks` and `dupe:traits` will ignore perks' enhancement status.
* Fixed icons displaying too large on the gear power tooltip.
* Loadout Optimizer result sets now show which set bonuses they activate.
* Added `tunedstat:primary`, `tunedstat:secondary`, and `tunedstat:tertiary`.
* Distinguish between special and primary ammo sidearms/pulse rifles in `dupe:traits` and `dupe:perks` comparison.

## 8.89.1 <span class="changelog-date">(2025-09-09)</span>

* In Compare and Organizer, there are now separate columns/rows for archetype and perks.
* Added armor masterwork tier, tertiary stat, and tuning stat columns to Organizer and CSV output.
* Reorganized weapons columns in Organizer a bit.
* Added `dupe:traits` for finding weapons with duplicate traits.

## 8.89.0 <span class="changelog-date">(2025-09-07)</span>

* Reduced how much items are dimmed out in the Item Feed when they don't match the current search.
* BETA: Option to compare by base masterworked stats in Compare feature. This allows a fair comparison between Armor 2.0 and Armor 3.0.
* Added a setting to control how many CPU cores can be used by Loadout Optimizer/Analyzer.
* Reorganized the Settings page.
* Loadout Optimizer no longer excludes pieces with the requested Set Bonus, even if their stats are terrible.
* Fix wishlists not properly matching some new enhanced perks
* The perk list vs. grid setting is now saved independently for mobile and desktop views.
* Un-deprecated the `is:infusionfodder` filter.
* Removed redundant holofoil overlay.
* Compare/Organizer sorting now takes Tuning Mods and Artifice armor into account when sorting Totals or Custom Stats.
* Totals and Custom stats in Compare/Organizer have an indicator when Tuners or Artifice mods can contribute.
* Invalid wish list rolls are now shown in Armory with a tooltip that explains them.
* Loadout analyzer is more precise about calling out invalid search queries vs. loadouts whose search query excludes some of its armor.
* Added wishlist title/description and link to source to the Armory page.

## 8.88.0 <span class="changelog-date">(2025-08-31)</span>

* Tuning mods can be chosen manually in the loadout editor, and will be assigned to compatible items when the loadout is applied. The equipped loadout and any snapshotted in-game loadouts will retain their tuning mods.
* Loadout Optimizer will no longer collapse sets with items that have the exact same stats. Now you'll see a separate set for each copy.
* Combine the set bonus tooltips for items of the same set in character status
* Adjust enhanced perk arrow when perk name takes up more than 1 line
* Loadout Optimizer now automatically assigns Tier 5 tuning mods where available. This can make major differences in what stats you can achieve!
* Loadout Optimizer will now utilize multiple CPU cores.
* Bulk locking/unlocking items will skip over items that cannot be locked.
* `is:locked` and `is:unlocked` searches will never match items that cannot be locked.
* Finishers are no longer lockable (Bungie doesn't allow it)
* In Compare and Organizer, when you hold shift and click a column to change its sorting, we now remove the sort entirely on the third click.
* Fixed a case where some old searches could not be unsaved. Remember that you can also *delete* searches from the Search History page or by clicking the X in the autocomplete dropdown.
* Improve autocomplete for the new `dupe:` filter.
* Loadout Optimizer and Compare will only show vendor items that you can actually buy.
* Fixed Progress tab season pass counter double counting levels 101-110

## 8.87.0 <span class="changelog-date">(2025-08-24)</span>

* Fix Xur showing exotic catalysts you have already acquired while "Only show uncollected items" is enabled.
* Add `source:kepler`
* `is:modded` can match items other than armor
* `year:8` now correctly matches Edge of Fate items.
* Fixes well rested XP counter from counting ranks 101-110 as 1 level instead of 5
* Fixed the display of Seasonal Progress and Well-Rested on mobile.
* Include Vanguard Arms Rewards in the items considered in Loadout Optimizer
* Sped up loadout analyzer when loadouts and inventory haven't changed.
* Deprecated `is:dupelower` filter.
* Deprecated `is:infusionfodder` filter.
* Deprecated `is:wishlistdupe` filter. Use `is:dupe is:wishlist` to find dupes with a wishlist match.
* Deprecated `is:crafteddupe` filter. Use `is:dupe is:patternunlocked` to find dupes you may replace with a crafted item.
* A new `dupe:` filter has been added, which can find duplicates of combined factors.
  * Try `dupe:archetype+tertiarystat` to find duplicate armors with the same armor Archetype *and* tertiary stat.
* The `dupe:` filter can look for lower stats *within* a group of similar items.
  * Try `dupe:setbonus+statlower` to look inside each armor set for pieces with worse stats.
  * Try `dupe:setbonus+stats` to look for identical rolls on identical armor.
* Check out Filters Help at the bottom of the search dropdown, for more dupe filter keywords.
* In the future, the `dupe:` filter will replace `is:dupeperks`, `is:statdupe`, `is:statlower`, `is:customstatlower`.
* `dupe:customstatlower` will more accurately narrow matches, checking **all* applicable custom stats against items. `is:customstatlower` is not recommended.
* Add a button to Compare to find all Armor 3.0 with the same 3 non-zero stats, even if they have a different Archetype.
* The loading spinner will always spin when loading vendors.

## 8.86.1 <span class="changelog-date">(2025-08-19)</span>

* Fix Organizer shift-click filter behavior for perks.
* Fixed confusing Tuned Stat symbol placement in the Organizer.

## 8.86.0 <span class="changelog-date">(2025-08-17)</span>

* Added Activatedness information to Set Bonuses on armor held by a character.
* Builds in Loadout Optimizer are now sorted by enabled stats, then each enabled stat in order, then total stats (including disabled stats). Before, they were not sorted by total stats, so if you had some stats disabled you could get very low-stat builds near the top.
* Added `is:statdupe` to find armor with the same base stats.
* Fixed a bug where removing set bonuses by un-clicking them from the set bonus picker could result in a loadout that couldn't be saved.
* Removed outdated power caps info from the Progress page
* Tuning mod stat changes are reflected in the stat bars in the item popup.
* Removed redundant stat effect text in mod tooltip.
* Added holofoil column to organizer
* Worked around a bug in light.gg that caused some links from DIM's Armory to log you out of light.gg.
* Filtered down the list of reputation ranks shown on the Progress page, and included the Crucible reward rank.
* Solstice challenges should appear on the Progress page now.
* Moved season pass rank info to the Ranks section in Progress.
* Fixed "Well Rested" perk detection, moved it to the Ranks section in Progress.

## 8.85.0 <span class="changelog-date">(2025-08-10)</span>

* Improved the responsiveness of draggable lists (Loadout Optimizer stat constraints, inventory sort order, etc.)
* Fixed an issue where the loadout analysis on the Loadouts page treated Armor 2.0 and Armor 3.0 versions of exotics separately.
* BETA ONLY: The new-item dot, `is:new` search, and new-item Organizer column have been removed. You can use the Item Feed to keep track of new drops.
* Adjust text spacing for item popup headers when tier/season banner are present
* Added an `is:holofoil` search.
* Add the bonus to all stats for tier 10 masterwork on new weapons.
* Item icons in the item feed will dim if the items do not match the current search.
* Added a scrollbar to the item feed
* Fix showing default ornament icon for new weapons in Armory
* Added `tunedstat:` filter for finding Tier 5 items with specific tuners.
* Highlighted Archetype and Tuned stats in the item popup.
* The Balanced Tuning mod now correctly applies +1 only to the three lowest armor stats
* Remove repeated stat info in perk descriptions
* Fixed Assume Masterwork for tiered weapons in Compare
* Show the armor masterwork socket for tiered armor
* Correctly calculate the masterwork level for tiered armor
* Add the ability to specify Set Bonuses in the Loadout Optimizer
* Set Bonus names and perks are filterable via `perk:` `exactperk:` or free text search.
* `is:statlower` now knows how to compare all the possible stat arrangements of armor with Tier 5 tuning mods, allowing you to find more strictly-worse items.
* `is:statlower` now compares armor as if it has been masterworked, so an unmasterworked piece won't be considered worse than a masterworked piece if it would actually be better after masterworking.

## 8.84.0 <span class="changelog-date">(2025-08-03)</span>

* Fixed an issue where the Loadout Optimizer would consider Armor 3.0 and Armor 2.0 versions of exotics separately. Now, if you select an exotic, all your copies of that exotic will be considered.
* Updated the order of search suggestions to prioritize `is:` filters.
* Display armor archetypes in Loadout Optimizer.
* Support mid-season season pass track change.
* Stat range searches (e.g. `stat:rpm:<100`) will no longer match items that don't have that stat.
* New Compare button for armor with Archetype-based stats.
* Added a toggle to the Loadout Optimizer that will limit eligible armor to only new or featured gear (the gear that gets bonuses for being new). All this does is add and remove `is:featured` from the search bar.
* Hid the masterwork upgrade socket in the item popup for new armor.
* Added a catalyst icon for the Osteo Striga.
* Removed some uninteresting materials from the material counts display.
* Added stat ordinality armor filters like `primarystat:super` and `tertiarystat:grenade`.
* Add another compare button to highlight Armor 3.0 with the same 3 base stats.
* When you open Loadout Optimizer with the "Equipped" loadout, the loadout parameters you select will now be saved as the default for that class. This was already true if you entered Loadout Optimizer by clicking the "Loadout Optimizer" button. Editing an existing loadout does not save the parameters as a default.
* When we save Loadout Optimizer defaults, we'll save the min/max setting for each stat now, not just whether it's enabled and what order.
* Fix "enhanced" detection to highlight barrels, magazines, etc.

## 8.83.0 <span class="changelog-date">(2025-07-27)</span>

* DIMmit is back, for all your changelog notifications.
* DIM now shows a placeholder and warning when your Silver balance is not available from Bungie.net.
* Updated item tier display in the Item Popup.
* In addition to weapon barrels/magazines/etc., item stat bars now display contributions from perks that provide them.
* Big updates to Material Counts, with more mats and better grouping. Try hovering or clicking the Consumables count under the Vault banner.
* `is:featured` now has a synonym `is:newgear` for looking up which items provide reward/combat bonuses, and can be taken into activities for New Gear only.
* `is:armor3.0` set up for new Edge of Fate Archetype-based armor, and `is:armor2.0` now excludes 3.0 pieces.
* Persistence stat and stat filter added for heavy crossbows.
* Catalysts now show their source on the Records page.
* Increased the contrast of red numbers against a black background.
* Removed empty perks that could appear in the Armory on craftable items.
* Added hover highlighting for the power formula and material counts buttons.
* Possible Set Bonuses are now displayed in the Armor Popup.

## 8.82.2 <span class="changelog-date">(2025-07-22)</span>

* Fix an item inspection crash in D1.

## 8.82.1 <span class="changelog-date">(2025-07-21)</span>

* Bungie.net still shows characters as having one point of Artifact Power. This has been removed.
* Fixed the armor stat total "equation" shown in the Item Popup.
* Fixed Armor 3.0 Exotics displaying their Archetype instead of their Intrinsic power.
* Added `stat:ammogen:` search.

## 8.82.0 <span class="changelog-date">(2025-07-20)</span>

## 8.81.4 <span class="changelog-date">(2025-07-18)</span>

* Added Enhanced arrows to show Enhanced perks in the Item Feed.
* Updated armor intrinsic detection to identify Armor 3.0 Archetypes. It should appear now in Organizer/Item Popup/Compare.
* Improved cramped spacing of stats display in Loadouts.
* Updated Echo of Persistence and other class-conditional fragments to lower the right stat.
* Added archetypes in the Item Feed and adjusted multiple-perk display.
* Added inventory sorting by item Tier.
* Fix masterwork stat numbers in Loadouts/Optimizer.
* Fixed a crash in Loadout Optimizer result sets rendering.
* Stream Deck updates
  * Removed progress metrics (no more available)
  * Added new "append only" mode to append filters to search query from plugin (search action)
  * Now the state sent to the plugin includes also the counters of inventory items grouped by element id (vault action)
  * Restored subclass item pick
  * Added tier to selection/picker action

## 8.81.3 <span class="changelog-date">(2025-07-16)</span>

* Fixed a crash in Loadout Optimizer when using the "+Artifice" Assume Masterwork option.
* Restore season pass info in Progress.
* Manually renamed "Immovable Refit" to "Vexcalibur Catalyst".

## 8.81.2 <span class="changelog-date">(2025-07-16)</span>

* Added tier-level pips to item icons.
* Fixed an issue in Loadout Optimizer that could exclude some valid sets when auto stat mods are off.
* On the Loadouts page, hashtags are now combined if they only differ by case, and are sorted case-insensitively.
* Fixed masterwork bonuses not showing up in orange in the stat bars for new armor.
* Fixed some engrams not looking like engrams.
* Fixed a number of places where class items did not display stats.

## 8.81.1 <span class="changelog-date">(2025-07-15)</span>

* Fixed new Armor 3.0 items not showing any stat bars.
* Fixed Armor 3.0 masterworks applying points to all stats instead of the lowest 3 stats.
* Add an explanatory tooltip to the Anti-Champion icon in the item tooltip, since folks have been confused by it.
* Reposition the season badge on the item tile a bit, to better match in-game.
* Add the stat icon to stat tooltips to help folks learn them.
* Add the season icon to the item popup header.
* Add the item tier as a number under the season icon.
* Add an inventory sort property for "featured". Waiting on "tier" sorting until we show it on the tile somewhere.
* Add Organizer/spreadsheet columns for "featured" and "tier".
* Add `tier:` search to find items by tier.
* Fixed the missing title for "Seasonal Hub" in the Progress page.
* Fixed a crash when using the Stream Deck integration.
* Fixed the display of the power icon in the character power calculation.
* Show the Ammo Generation stat on weapons.
* Prevent a crash in the Loadout Optimizer when auto stat mods is disabled.
* Fixed cramped stat min/max fields in the Loadout Optimizer.
* Changed the Loadout Optimizer min/max stat fields to not update other numbers until you hit Enter or blur the field.

## 8.81.0 <span class="changelog-date">(2025-07-15)</span>

* Improved the Loadout Optimizer algorithm to correctly maximize stats now that it's tierless. Also improved its performance.
* Fix some interactions with the Loadout Optimizer stat constraint editor.
* Add `is:featured` search for the new Featured Items.

## 8.80.0 <span class="changelog-date">(2025-07-13)</span>

* The Loadout Optimizer has been updated to target exact stats (up to 200) instead of tiers. There are lots more changes to Loadout Optimizer after Edge of Fate has released and we are able to adapt to the new way armor and stats works.
* Fixed the D1 Reputation display not showing up on mobile.
* Exotic armor ornaments no longer repeat the class name.
* Fix an occasional crash in the Compare tool.
* Removed `is:hasmod`, `modslot:legacy`, and `holdsmod:` searches as they don't have any use anymore.

## 8.79.0 <span class="changelog-date">(2025-07-06)</span>

* Added an `is:ininventory` filter that will highlight items that you have at least one copy of. This is meant to be used in the Records and Vendors tabs.
* Fixed an issue where community insights on mods are so long that you could not select mods on mobile.

## 8.78.0 <span class="changelog-date">(2025-06-29)</span>

## 8.77.0 <span class="changelog-date">(2025-06-22)</span>

## 8.76.0 <span class="changelog-date">(2025-06-15)</span>

## 8.75.0 <span class="changelog-date">(2025-06-08)</span>

* Removed the "Refresh Wishlist" button and the suggested remote wishlists when using a local wishlist.
y
* D1 inventory now shows emotes, and you can add emotes to D1 loadouts.

## 8.73.0 <span class="changelog-date">(2025-05-25)</span>

## 8.72.1 <span class="changelog-date">(2025-05-19)</span>

* Updated season number filter for some items.
* `source:riteofthenine` filter added.

## 8.72.0 <span class="changelog-date">(2025-05-18)</span>

* Postmaster items now have a warning indicator if DIM is not allowed to pull them.
* Added an "ammo" column, a "perks grid" column, and a "mods" column to the Organizer.
* Slimmed down column labels for some Organizer columns.as

## 8.71.1 <span class="changelog-date">(2025-05-12)</span>

* Fix misaligned stat numbers in Compare box.

## 8.71.0 <span class="changelog-date">(2025-05-11)</span>

* Stats in Organizer are now colored the same as in Compare.
* Fixed the positioning of the item popup when clicking on artifact mods.
* Rite of the Nine shiny weapons now have icon stripes and detect in `is:shiny` filter.

## 8.70.0 <span class="changelog-date">(2025-05-04)</span>

* Warning banner for Destiny 1 accounts when DIM detects the D1 API is still broken.
* Fix for an Armory crash in outdated versions of Firefox.

## 8.69.0 <span class="changelog-date">(2025-04-27)</span>

* The Armory page will now link to alternate versions of an item if they exist, including reissues, shiny versions, adept versions, etc.
* Crafted and enhanced weapons will now show their masterwork stat icon in the same place regular weapons do.

## 8.68.0 <span class="changelog-date">(2025-04-20)</span>

* `is:shiny` now detects Heresy weapons with the bonus Runneth Over Origin Trait.
* Fixed Triage tab generating a very generic search filter for In-Game Loadouts.
* Gave In-Game Loadouts an Edit button in Triage tab.
* Fixed Enhanced Perks on an Enhanced item showing no selected Perks in the Armory.
* Style cleanup for Perks, Weapon Components, Weapon intrinsics/archetypes. If something seems 2 pixels different, you aren't crazy.

## 8.67.0 <span class="changelog-date">(2025-04-13)</span>

* May have finally fixed the issue where DIM sometimes fails to load live data.
* In Compare, you can now sort items by perks, mods, intrinsic, archetype, etc. The mods and perks rows.
* In Compare, the masterworked stat is highlighted with an orange dot.
* Ghosts show all their mods in Compare.
* Removed a duplicate tooltip that showed an item's notes in Compare.
* Restored the colored border for completed D1 items.

## 8.66.0 <span class="changelog-date">(2025-04-06)</span>

## 8.65.0 <span class="changelog-date">(2025-03-30)</span>

## 8.64.0 <span class="changelog-date">(2025-03-23)</span>

## 8.63.1 <span class="changelog-date">(2025-03-19)</span>

* Fix a bug in Chrome for Android 134 and newer where the space reserved for the virtual keyboard would not be reclaimed after the keyboard is dismissed.
* When you update DIM, it will no longer reload other tabs if you have a sheet up or are on the Loadout Optimizer. DIM may fail to load some pages until you refresh, though.
* Fixed an issue where vigorous scrolling in a sheet (like the mod picker) can dismiss the sheet and its parent, losing progress in things like the loadout editor.
* Attempt to prevent an issue where DIM loads fresh data from Bungie but doesn't update the view of inventory.

## 8.63.0 <span class="changelog-date">(2025-03-16)</span>

* Fixed a bug where the Organizer wouldn't show all the items if your screen was very tall or zoomed out.
* Added a sortable name label to the Compare view.

## 8.62.0 <span class="changelog-date">(2025-03-09)</span>

## 8.61.0 <span class="changelog-date">(2025-03-02)</span>

* `is:harmonizable` fixed to ignore bugged weapons with a Deepsight option that shouldn't be there.
* `is:accountmaxpower` added to show your highest Power Level gear, determining the level of new drops.
* `is:origintrait` added to find weapons with Origin Traits.
* Fixed styling missing sometimes on the tooltip for Artifact Power.

## 8.60.0 <span class="changelog-date">(2025-02-23)</span>

* Added `source:sundereddoctrine` for the new dungeon.
* Updated the color scale used for stats in Compare - there is now greater separation between the worst (red) and the best (green, with blue for the best stat).

## 8.59.1 <span class="changelog-date">(2025-02-16)</span>

* Added Pathfinder reward info.

## 8.59.0 <span class="changelog-date">(2025-02-16)</span>

* Fix a bug that could prevent removing wishlists if the wishlist no longer exists.
* Fix D1 showing a yellow border around completed items.

## 8.58.0 <span class="changelog-date">(2025-02-09)</span>

* Energy upgrade tooltips now show the material cost to upgrade.

## 8.57.3 <span class="changelog-date">(2025-02-05)</span>

* Also fixed armor not showing up in Organizer due to the Bungie data bug that had all armor as "unknown" class instead of Hunter/Titan/Warlock.

## 8.57.2 <span class="changelog-date">(2025-02-05)</span>

* Worked around a bug in the Bungie data that had all armor as "unknown" class instead of Hunter/Titan/Warlock.

## 8.57.1 <span class="changelog-date">(2025-02-03)</span>

* DIM Sync data is now loaded incrementally, instead of being completely refreshed every time. This should result in faster updates, but otherwise nothing should be different. If you notice things are out of sync, you can click the "Reload remote data from DIM sync" button in Settings, but please let us know if you needed to do that.

## 8.57.0 <span class="changelog-date">(2025-02-02)</span>

* DIM now coordinates in a limited way between different tabs/windows. Only one tab will load data at a time, and when it does, all other tabs will refresh immediately. Item moves are also reflected immediately across tabs. This should help prevent tabs from getting out of sync with each other.

## 8.56.0 <span class="changelog-date">(2025-01-26)</span>

* Removed the 15 second timer on being able to check for new data from Bungie.net.

## 8.55.0 <span class="changelog-date">(2025-01-19)</span>

* Restored a workaround for laggy dragging in Chrome on Windows when using some high-DPI and/or Logitech mice.
* DIM now recognizes exotic weapons that grant intrinsic breaker abilities through a perk.
* Logging out now properly "forgets" the page you were on, so when you log in again it doesn't try to go back to that page.
* Loadout names and vendor names in the sidebar are no longer uppercased.
* Double-clicking on items in the search results page will pull them to your active character.
* The text in the search history page is selectable.

## 8.54.0 <span class="changelog-date">(2025-01-12)</span>

## 8.53.0 <span class="changelog-date">(2025-01-05)</span>

* Added `is:enhancementready` search that finds weapons which have reached level thresholds to enhance perks
  * For crafted weapons, this looks at the level thresholds of the enhanced versions of the weapon's current perks
  * For enhanced weapons, this looks at whether the next tier of enhancement is selectable on the weapon
* Updated `enhancedperk` search to allow `is:enhancedperk` to find any weapons with already-enhanced perk columns
* Farming mode will no longer make room for Ghosts.

## 8.52.0 <span class="changelog-date">(2024-12-22)</span>

* Minimum browser version for DIM has been raised to Chrome 126+ (or equivalent Chromium-based browsers) and iOS 16.4+. DIM may not load at all on older browsers. Firefox and Desktop Safari are still only supported on their most recent two versions. Note that Firefox 115 ESR is not supported, but may work if you're stuck on Windows 7.

## 8.51.0 <span class="changelog-date">(2024-12-15)</span>

* Added a wishlist refresh button in Settings to help with wishlist development. Note that GitHub can take upwards of 10min to actually reflect your changes. Refreshing won't speed up GitHub.
* Having a broken wish list in your settings will no longer prevent removing other wish lists.

## 8.50.1 <span class="changelog-date">(2024-12-12)</span>

* Notes now appear in the tooltips on item tiles.
* Fixed vendor items showing wishlist thumbs up icons when they didn't match a wishlist roll.
* Fixed a bug that could cause DIM to infinitely redirect to invalid pages.

## 8.50.0 <span class="changelog-date">(2024-12-08)</span>

* Stat bars in the Item Popup now show more detailed information about contributing factors. Stat bar tooltips are easier to hover/hold-tap, and list weapon parts and stat contributions.
* Some backlogged translations have been added to the app.
* Destiny 2's item/game definitions are now more spread out in browser storage, to prevent Firefox from hitting a storage limit.
* The "Traits" column for weapons in the Organizer now separates perks into two columns.
* You can no longer tag catalysts for sale from vendors.
* Vendor items will no longer complain about missing sockets.

## 8.49.0 <span class="changelog-date">(2024-12-01)</span>

* Corrected a misleading error banner and improved handling when DIM needs a fresh Bungie.net login.
* Fixed some issues with search saving and DIM Syncing.

## 8.48.0 <span class="changelog-date">(2024-11-24)</span>

* Fixed a crash happening with a Guardian Games stat tracker.

## 8.47.1 <span class="changelog-date">(2024-11-18)</span>

* Fix gigantic vault engrams in single-character mode.

## 8.47.0 <span class="changelog-date">(2024-11-17)</span>

* #Tag suggestions now use your most popular existing capitalization.
* Fixed character engram inventory wrapping on mobile.
* Fixed autocomplete not doing its job after a colon.
* Fixed checkboxes not clickable in the item sorting editor.

## 8.46.0 <span class="changelog-date">(2024-11-10)</span>

## 8.45.1 <span class="changelog-date">(2024-11-04)</span>

* Fixed an issue with Destiny 1 inventory not loading.
* Fixed an issue with some hover text not appearing on PC.
* Fixed an issue with some exotics not appearing in Collectibles.
* Fixed an issue where invalid searches looked saved if they were close to a saved search.
* Progress > Ranks
  * Now highlights maxed ranks.
  * Competitive Division no longer shows it can be reset.

## 8.45.0 <span class="changelog-date">(2024-11-03)</span>

* If you click "Edit Copy" on a loadout, then click "Optimize Armor", then save the loadout from Loadout Optimizer, it will now save the copy, not the original loadout.
* Tonics in the Tonic Capsule now show what their rewards or what artifact perk they affect is.
* Added Clan Reputation, Engram Ensiders, and Xûr Rank to the Progress page.
* Slimmed down Bungie's Destiny database to fit within Firefox's storage limits.
* Stream Deck selection now relies on buttons, not drag and drop.
* Masks are now counted as helmets properly in Compare.

## 8.44.0 <span class="changelog-date">(2024-10-27)</span>

* Allow dragging Item Feed items to any slot, removing the need to scroll to a specific item slot to drag them to a character. They will automatically go to the correct slot on the given character (in the same way Postmaster items function).

## 8.43.0 <span class="changelog-date">(2024-10-20)</span>

## 8.42.0 <span class="changelog-date">(2024-10-13)</span>

## 8.41.1 <span class="changelog-date">(2024-10-09)</span>

* Show the new pathfinders on the Progress page.
* Add Accessories (Tonic Capsule) to the inventory screen.

## 8.41.0 <span class="changelog-date">(2024-10-08)</span>

* Updated for Episode: Revenant.
* Make room for always-on scrollbars in Organizer to avoid extra weird scrolling.
* Fix vendor finishers offering the "Lock" action, and D1 vendor items offering "tag".

## 8.40.0 <span class="changelog-date">(2024-10-06)</span>

## 8.39.0 <span class="changelog-date">(2024-09-29)</span>

* Add `breaker:intrinsic` search that highlights items that have an intrinsic breaker ability (i.e. not granted by the seasonal artifact).
* Breaker type granted by the seasonal artifact now has a green box around it, reminiscent of the artifact mod that grants it.

## 8.38.0 <span class="changelog-date">(2024-09-22)</span>

* Renamed `is:class` to `is:subclass`.
* Fixed D1 item category searches such as `is:primary` and `is:horn`. Now they're up to parity with the D2 categories.

## 8.37.0 <span class="changelog-date">(2024-09-15)</span>

## 8.36.1 <span class="changelog-date">(2024-09-12)</span>

* Fixed stat bar display for mods that conditionally apply stats.
* Fix breaker type showing up on D1 items, and some crashes in D1 inventories.
* `is:dupeperks` no longer compares armor from different classes.
* Updated the list of breaker-granting artifact mods.

## 8.36.0 <span class="changelog-date">(2024-09-08)</span>

* In the item picker, you can long-press or shift-click an item to see its item details. A regular click still pulls that item.
* `breaker:` searches now match items that can have that breaker type granted by this season's artifact (whether or not the correct artifact mods are enabled). The effective breaker type from artifact mods also now shows up on item tiles and in the Armory.
* Add Enhancement tier to weapon level bar.
* Update `enhanced` search keyword to allow range of values (0/1/2/3). Old `is:enhanced` behavior is now `enhanced:3`.
* Update `is:enhanceable` search keyword to exclude Tier 3 Enhanced items.
* Added `is:dupeperks` search that shows items that either are a duplicate of another item's perks, or a subset of another item's perks (taking into account which column perks appear in).
* Added a Loadouts CSV export, accessible from the Settings page.
* Improved how conditional stats for perks are calculated, including fixups for exotic catalyst stats, Enhanced Bipod, and more.
* The notes text area now has a maximum editable size of 1024 characters, up from 120.
* Added a tooltip with information about the selected super on the Loadouts page.
* Clicking on the subclass on the loadouts page will open its item popup, with the correct aspects/fragments previewed.

## 8.35.1 <span class="changelog-date">(2024-09-01)</span>

* Fix the "track record" button not appearing on hover.

## 8.35.0 <span class="changelog-date">(2024-09-01)</span>

* Fix Organizer sorting behavior for notes, tags, and wishlist notes so that empty values sort along with other values.
* In Compare, you can now shift-click on stats to sort by multiple stats at once (e.g. sort by recovery, then by resilience).
* Hover state only applies on supported devices.

## 8.34.1 <span class="changelog-date">(2024-08-27)</span>

* Exotic class item perks will now show up in Compare suggestions
* Compare view's suggestion buttons will now use the leftmost item's perks instead of an arbitrary item if the initial compare item is removed

## 8.34.0 <span class="changelog-date">(2024-08-25)</span>

## 8.33.1 <span class="changelog-date">(2024-08-20)</span>

* Fixed the symbol picker displaying in the wrong part of the screen.

## 8.33.0 <span class="changelog-date">(2024-08-18)</span>

* Fixed the `:solar:` icon not showing up in the symbol picker.
* Shift-clicking on a cell full of perks in Organizer, but not on a specific perk within that cell, will now add all the perks to the search, instead of adding an invalid search term.

## 8.32.0 <span class="changelog-date">(2024-08-11)</span>

* Fixed character sorting on the Loadouts page.
* Dropdown no longer flickers on Firefox.
* Thumbs-up icon is no longer near-invisible on the Europa theme.
* Replaced Crafted icon with Enhanced icon for enhanced weapons.
* Added setting to separate armor on different lines by class.
* Replaced red background with dotted circle for perks that no longer roll on weapons.

## 8.31.0 <span class="changelog-date">(2024-08-04)</span>

* Improved item move logic to do a better job of making room for transfers between characters.
* Fixed single-character mode hiding cosmetic items (ghosts, etc) that are equipped on other characters. Now they are properly shown as being in the "vault".
* The Planetary Piston Hammer item now shows the number of charges.

## 8.30.0 <span class="changelog-date">(2024-07-28)</span>

* Remove damage mods and empty memento sockets from item popups.
* A bunch of changes to Vault Organizer:
  * Sorting now uses a local-sensitive comparator by default.
  * You can sort perk columns - they sort by the name of the first perk, and then the name of the second perk, and so on. This should help with exotic class items.
  * Broke out armor intrinsics, cosmetics (shaders/ornaments), and weapon origin traits into their own columns.
  * Now that everything has its own column, the plain "perks" column is now restricted to perks/mods that don't appear in other columns.
  * For the deepsight harmonizer column, replaced the checkmark with the deepsight harmonizer icon.
  * Fixed shift-clicking on breaker to fill in a breaker: search.
  * Widened the "Enabled Columns" menu to multiple columns so it no longer has to scroll.
  * Perks columns fit their contents instead of having a hardcoded width.
  * The item type selector no longer scrolls away horizontally.
  * Selecting "Weapons" now shows all weapons by default. Feel free compare sidearms to rocket launchers if that's your thing.

## 8.29.0 <span class="changelog-date">(2024-07-21)</span>

* Fixed a case where invalid loadouts would be repeatedly rejected by DIM Sync. Now they'll be rejected once and be removed.
* Re-added Xûr vendor armor to Loadout Optimizer.
* Fix light.gg and D2Foundry links to avoid certain circumstances where perks weren't selected (or, where D2Foundry crashed).
* Armor intrinsics once again show up in Organizer's perks column.

## 8.28.0 <span class="changelog-date">(2024-07-14)</span>

* Fixed a case where recently saved tags or loadouts might not appear if DIM Sync is down, even though they were still saved.

## 8.27.0 <span class="changelog-date">(2024-07-07)</span>

* Fixed the order of pathfinder objectives.
* Fixed `modslot:artifice` matching every exotic.
* Fix loadout apply trying to socket the empty artifice plug.
* Make the prismatic symbol pink.

## 8.26.0 <span class="changelog-date">(2024-06-30)</span>

* The progress page shows the Ritual Pathfinder and Pale Heart Pathfinder.
* Improved how we detect which rewards and challenges are available for Milestones on the Progress page.
* Prismatic subclasses now show the currently-equipped super overlayed on them.
* Restored wish-list-ability to all weapons, and actually made exotic class items wishlistable.
* Manually filled in the possible perks that exotic class items can roll with in the Armory page.
* A new `is:wishlistable` search highlights items that can be added to a wish list.
* Made the vendor-item icon on Loadout Optimizer items a bit brighter.
* Fully removed the concept of sunset weapons. The `is:sunset` search no longer does anything.
* Added `modslot:salvationsedge` search.
* Exotic class items now show all of their intrinsic perks.
* Show the intrinsic perk for Ergo Sum and crafted exotics in Item Feed.
* Fixed a case where multiple custom stats would overflow in the Item Feed.
* Removed the stats line from class items in the Item Feed.
* Fixed missing yellow stat bars from masterworked weapons.
* Fixed some bizarre behavior in the symbols picker.

## 8.25.0 <span class="changelog-date">(2024-06-23)</span>

* Greatly expanded the set of symbols available for use in loadout names/notes and item notes.
* Fixed the calculation of stat effects from enhanced stats.
* The compare sheet now highlights which of the quick-filter buttons is currently active.
* Changed the way we rate-limit Bungie.net calls, which may result in snappier item moves and loadout application.
* Added a "compare" button to item feed tiles, since it's such a common action when evaluating new gear.
* In the item feed, perks in the same column now have a bar on the left to indicate they are together.
* Engram bonuses in the Milestones section are now relative to your "drop power", not your "character power".
* The name of the nightfall and crucible labs playlist is included in their Milestone titles.
* Manually corrected the engram power level for several Milestones.
* Worked around a bug in the Bungie data that showed duplicate perks in some weapons.
* Any item with randomized perks can now be wishlisted, which includes random-perk armor.

## 8.24.0 <span class="changelog-date">(2024-06-16)</span>
* Fix issue where light level displayed in the Loadouts views was calculated using all weapons and armor in the loadout, instead of just the weapons and armor to be equipped.
* Add `light:` filter to the Loadouts search. Only works with loadouts that equip an item for all weapon and armor slots.
* DIM now calculates Account Power level, which uses all items from all characters, and determines their "current power level" for the purposes of new item drops.
  * This number can be found in the header for Vault
  * Details can be found by clicking any character's gear Power level, below their header/dropdown.
* Cleaned up armor upgrade slots and inactive Artifice slots showing up in the Item Popup.
* Loadout Optimizer no longer tries to pair Exotics and Class Item Exotics in the same loadout.
* Fixed issue where Enhanced BRAVE Mountaintop did not appear to be masterworked.
* Fixed issue where Enhanced weapons could have perks that showed as not rollable.
* `is:crafted` matches only crafted weapons, not Enhanced weapons.
* Max stack size of consumables is now shown in the Item Popup when viewing their details.
* Add some new materials and remove some old, from material/consumable counts in the Vault header.

## 8.23.0 <span class="changelog-date">(2024-06-09)</span>

* `is:enhanceable` and `is:enhanced` filters for non-crafted weapons whose perks can be enhanced.
* Cleaned up extra weapon upgrade slots showing up in the Item Popup.
* Shiny BRAVE weapons now have corner stripes.
* Preliminary support for Exotic Artifice armor in the Loadout Optimizer
  * DIM can now assign these mods and automatically suggest them to according to your preferences.
  * A `+ Artifice` option allows DIM to treat regular Exotic Armor as Artifice, letting us plan out the best stat tiers for you.
* Sheets no longer adjust up when the horizontal scrollbar is visible
* `is:light` and `is:dark` filters for finding light (arc, solar, and void) and dark (stasis and strand)
 damage weapons.

## 8.22.0 <span class="changelog-date">(2024-06-02)</span>

* Pressing "Escape" when an input in a sheet is focused now closes the sheet.

## 8.21.1 <span class="changelog-date">(2024-05-27)</span>

* Fixed an issue where DIM clients might not see search history when using only local settings storage.

## 8.21.0 <span class="changelog-date">(2024-05-26)</span>

* The search suggestions dropdown now shows more results, based on the size of your screen.
* Added an overload to the `inloadout:` search which allows searching items based on how many loadouts they are in, for example `inloadout:>2`.
* Loadout searches now save in your search history and can be saved.
* Added `is:fashiononly` and `is:modsonly` search keywords to loadouts search.
* Pages such as "About" and "Settings" now respect device safe areas when the device is in landscape mode.
* You can now edit a copy of a Loadout directly, with no risk of overwriting the existing loadout.
* Fixed some bounties showing as "Arc" that were not, in fact, Arc.
* Fixed the too-narrow width of the sidebar on the Loadout Optimizer on app.destinyitemmanager.com.
* Fixed distorted icons for owned mods in collections.
* Due to a change in how Bungie.net works, DIM now loads vendor information one at a time, which may mean it takes longer to see accurate vendor items.
* Minor clarifications to the privacy policy.

## 8.20.0 <span class="changelog-date">(2024-05-19)</span>

## 8.19.2 <span class="changelog-date">(2024-05-15)</span>

## 8.19.1 <span class="changelog-date">(2024-05-12)</span>

* Loadouts now have their own search language that you can use from the Loadouts page or character emblem dropdown. This works the same as item search, but the search keywords are different and loadout-specific. We'll add more search keywords over time.
* When you change language, DIM immediately loads the item database for that language - you no longer need to reload.
* DIM now loads new item database after content updates without requiring a reload, as long as there's an item in your inventory from that new content.
* Fixed the icon for "Material Counts" in the vault dropdown on mobile.
* Removed some useless search suggestions like `exactname:gauntlets`.
* Fixed some crashes when Google Translate is enabled. Please don't use Google Translate on DIM though, use our language settings.
* Added a grace period before DIM stops auto-refreshing because you're not playing. This should prevent DIM from giving up on auto refresh when you change characters.
* Added some new protections against losing tags when Bungie.net is misbehaving, though it still may not be able to handle some weirdness.
* Fixed the filter help not showing up in some circumstances.

## 8.19.0 <span class="changelog-date">(2024-05-05)</span>

* Minimum browser version for DIM has been raised to Chrome 109+ (or equivalent Chromium-based browsers) and iOS 16+.
* Add a warning for Samsung Internet users to explain why dark mode is making DIM too dark.

## 8.18.1 <span class="changelog-date">(2024-04-30)</span>

* Fix vault tile display on mobile.

## 8.18.0 <span class="changelog-date">(2024-04-28)</span>

* Restore per-stat quality ratings to D1 armor popups.

## 8.17.0 <span class="changelog-date">(2024-04-21)</span>

* Fixed max stat constraints sometimes being not shown in Loadout parameters.
* `is:shiny` filter to find limited-edition BRAVE weapons.

## 8.16.0 <span class="changelog-date">(2024-04-14)</span>

* Loadouts with only armor mods, or only fashion (shaders & ornaments), now display a symbol in the equip dropdown, and can be filtered from among other loadouts.
* BRAVE bounties now display correct rewards instead of all possible rewards.

## 8.15.0 <span class="changelog-date">(2024-04-07)</span>

* The Item Popup now correctly shows stat contributions from universal ornaments.
* Item slots on characters now look a bit more normal when no item at all is equipped.

## 8.14.0 <span class="changelog-date">(2024-03-31)</span>

* Long equipped character Titles no longer push the Power Level out of view.

## 8.13.0 <span class="changelog-date">(2024-03-24)</span>

## 8.12.0 <span class="changelog-date">(2024-03-17)</span>

## 8.11.1 <span class="changelog-date">(2024-03-13)</span>

* Updates for new game content, including Wild Style detection as a breech-loaded grenade launcher.

## 8.11.0 <span class="changelog-date">(2024-03-10)</span>

## 8.10.0 <span class="changelog-date">(2024-03-03)</span>

## 8.9.0 <span class="changelog-date">(2024-02-25)</span>

## 8.8.0 <span class="changelog-date">(2024-02-18)</span>

## 8.7.0 <span class="changelog-date">(2024-02-11)</span>

* Loadout Optimizer now considers exotics sold by Mara Sov for Wish Tokens and includes them in suggested builds.

## 8.6.0 <span class="changelog-date">(2024-02-04)</span>

## 8.5.0 <span class="changelog-date">(2024-01-28)</span>

## 8.4.0 <span class="changelog-date">(2024-01-21)</span>

* Added an `exactname` filter to match items by their exact name, such that `exactname:truth` won't find Truthteller.
* Updated Game2Give 2023 banner.

## 8.3.0 <span class="changelog-date">(2024-01-14)</span>

* Loadout Optimizer once again allows you to set a maximum stat tier, by Shift-clicking on a stat number (this is the only way to do it, for now). Unlike the previous stat max setting, this does not exclude builds that meet all your other requirements but need to put points in a maxed stat, resulting in more optimal builds overall.
* Show more information about quest lines, even if steps are classified.

## 8.2.0 <span class="changelog-date">(2024-01-07)</span>

* Support the newest version of the DIM StreamDeck plugin.

## 8.1.0 <span class="changelog-date">(2023-12-31)</span>

* In the mod picker, we now show just "Stackable" or "Unstackable" instead of the full requirements for the mod (like its exact stackability or what raid it belongs to).
* Several improvements to how the mod picker and subclass editor look and work, in hopes of making it easier to use.
* Individual wish lists can be toggled on and off and the Just Another Team wishlist is available as a suggested option.
* Catalysts can be searched for on the Records page using search terms that would match their associated item.
* Clicking a catalyst on the Records page shows the item popup for its associated collections item.
* Loadout Optimizer's "Pin Items" and "Excluded Items" sections have been slightly redesigned, and now both have clear-all buttons.
* You can choose to show weapon groups in the vault inline instead of row-by-row.
* The Seasonal Artifact details page now shows how many points used and resets.

## 7.99.0 <span class="changelog-date">(2023-12-17)</span>

## 7.98.0 <span class="changelog-date">(2023-12-10)</span>

* You can no longer select multiple copies of mods that are unstackable (they do not provide a benefit when there are multiple copies of them).

## 7.97.1 <span class="changelog-date">(2023-12-04)</span>

* Fixed infinite reload / "Operation is insecure" issue introduced in the last release.

## 7.97.0 <span class="changelog-date">(2023-12-03)</span>

* Fixed error showing titles after Season of the Wish launched.
* Updated data for new season.
* Loadout optimizer stat constraints now have a clear button, randomize option, and sync from equipped option.
* Tooltips will reliably disappear when you move your mouse off their triggering element, even if you move the mouse onto the tooltip.
* Fixed the `is:smg` search.

## 7.96.0 <span class="changelog-date">(2023-11-26)</span>

* Added `is:vendor` search that is useful for excluding vendor items from Loadout Optimizer (enter `-is:vendor` in the search box).
* You are now prevented from selecting multiple copies of fragments or aspects in the subclass selector.
* Slightly improved Loadout Optimizer's algorithm for finding optimal sets.
* Single-character mode now shows the postmaster items and unclaimed engrams from other characters.
* The records page has a menu on the mobile version for easily jumping to the right section.

## 7.95.0 <span class="changelog-date">(2023-11-19)</span>

* Added an `exactperk:` search that matches a perk name exactly. No more mixing up "Frenzy" with "Feeding Frenzy".
* Fixed a bug where in-game loadouts would be marked as matching a DIM loadout incorrectly.

## 7.94.1 <span class="changelog-date">(2023-11-13)</span>

* Fixed an edge case where Loadout Optimizer's "Strict Upgrades Only" mode from clicking Optimize Armor on the Loadouts page could result in too few sets.

## 7.94.0 <span class="changelog-date">(2023-11-12)</span>

* There is now an option in settings to group items in your vault by Item Type, Rarity, Ammo Type, Tag, or Damage Type.
* On the Loadouts page, DIM now runs the Loadout Optimizer in the background to find out which of your loadouts could have better stats by swapping armor.
* Loadout optimizer has a new stat tier editor which allows you to set your minimum stat tiers more intuitively. It is no longer possible to explicitly set maximum stat tiers - make sure you've added your subclass and mod configuration, set stat order, and ignore stats you don't want DIM to optimize, and you'll get the best possible sets.
* In the loadout editor, replacing a missing item works even if you have 10 items in that slot.
* Links in notes can no longer result in spurious hashtags.
* Moving items from a search can once again move consumables/materials.
* In Loadout Optimizer and the Loadout Editor, you can now choose a subclass with a single click.
* Revamped the Exotic Armor selector in Loadout Optimizer.
* Added an inline explanation of the Assume Masterwork option in Loadout Optimizer.
* Vendor items are always included in Loadout Optimizer - the setting has been removed.
* There is now a per-loadout option to include the effects of "Font of ..." mods' stats as if they were active or not. This helps the Loadout Optimzier make the right choices.
* In Loadout Optimizer and the Loadout Editor, the selected subclass' super is now folded into the subclass icon rather than being shown separately.

## 7.93.0 <span class="changelog-date">(2023-11-05)</span>

* The Loadouts page will now analyze your Loadouts in more depth, show filter pills for analysis findings, and note them in individual Loadouts too.
  * Examples are Loadouts where the mods don't fit on the armor, Loadouts that rely on seasonal mods, or Loadouts where armor needs to be upgraded to accommodate mods or reach target stats.
* Loadout optimizer will now use an effective energy of 9 for items that it is not assuming masterworked stats for. Before, it used an effective energy of 7, but enhancement prisms are easier to come by these days.
* Fixed a case where vendor items could show as owned when they were not.
* Fixed the platform icon not showing for Destiny accounts that were only associated with a single platform.
* Fixed accidentally showing the kill tracker perk column on the item popup.
* Fixed subclass mod sockets size on the in-game loadout details popup.

### Beta Only

* A preview of a new stat constraint editing widget for Loadout Optimizer! Let us know how you like it and how it helps (or hurts) your ability to make top tier builds.
* The Loadouts page will note "Better Stats Available" if we've found that a Loadout could use different armor or stat mods to reach strictly higher stat tiers.

## 7.92.0 <span class="changelog-date">(2023-10-29)</span>

* Fixed a bug that could delete recent tags/notes when loading DIM on a different device than the one where you set the notes.
* Added a hotkey (T) to switch between the overview and triage tabs on the item popup.
* The item popup remembers which tab you were last on.
* Incomplete seals are now shown greyed out on the Records page.
* Gilded seals show their gilding count on the Records page.
* The Loadout Optimizer is better at calculating the max possible tier given your chosen stat constraints.
* Fix FotL pages sometimes being shown as all owned.
* Fixed the D1 organizer page to display perks nicely.
* Fixed the Organizer not showing the armor CSV download button.
* Organizer will now show exotic catalysts and empty catalyst sockets if a catalyst exists.
* Organizer will no longer duplicate the exotic perk between the archetype column and the traits column.
* CSV export will no longer include all kill tracker options, as they're very unreliable.
* CSV export will no longer include some junk like armor upgrade sockets

## 7.91.1 <span class="changelog-date">(2023-10-23)</span>

* Fixed search menu showing behind items in some sheets.

## 7.91.0 <span class="changelog-date">(2023-10-22)</span>

* Added `source:ghostsofthedeep` search term.
* Fixed some cases where hitting "Esc" would not close a nested sheet.
* In Loadout Optimizer, prevent opening an empty mod picker when clicking general mod slots when auto stat mods are enabled.
* Removed outdated reference to Google Drive in our privacy policy - DIM has not used Google Drive for storage for many years.
* Fixed the search field in the character menu not having a background on the default theme.
* If your language is set to Japanese, Korean, or Traditional Chinese, you may notice that fonts display smaller since upgrading to Chrome/Edge 118. [This is a change in Chrome](https://discord.com/channels/316217202766512130/1052623849197404241/1164636684646887434), and it makes the fonts in DIM (and everywhere else!) look the same as they do for other languages. Consider zooming the page or adjusting the item tile size if the fonts are now too small for you.
* Fixed a bug where classified items would show "undefined" as their power level.
* Removed link to Destiny Tracker from the Armory page.

## 7.90.0 <span class="changelog-date">(2023-10-15)</span>

* Removed tooltip from the text portion of exotic perks / archetypes since the text already includes those details.

## 7.89.0 <span class="changelog-date">(2023-10-08)</span>

* "Hide completed triumphs" on the Records page now also hides sections and seals where all triumphs have been completed, not only the triumphs themselves.
* The Vendors page should now more reliably indicate whether armor sold by Ada-1 is unlocked in collections.
* Comparing a legendary armor piece now starts the Compare view with similar armor based on intrinsic perk and activity mod slot.
* Removed links to DIM's inactive Mastodon account.

## 7.88.0 <span class="changelog-date">(2023-10-01)</span>

* Added a Universal Ornaments section to the Records page showing which legendary armor pieces you have unlocked as Transmog ornaments and which ones you could turn into ornaments.
* "Only show uncollected items" now correctly identifies some shaders that it missed before.
* Removed Stadia from the list of accounts shown in the accounts list, and moved the Cross-Save primary platform to the front of the list.
* Fixed a bug that prevented DIM from loading when offline.
* Fix tooltips getting stuck open if you scroll in Compare while they're shown.
* The mod selection menu now shows you how many of each type of mod you've chosen, and what the limit is.
* Removed links to Twitter, and the Twitter embedded timelines, because Twitter no longer allows un-logged-in users from viewing feeds. BungieHelp info now comes from the unofficial mirror to Mastodon.
* Fixed D1 Farming Mode to no longer try to move your equipped items, and to no longer move emblems at all.
* Fixed the color of the title bar when DIM is installed to the dock from Safari in macOS Sonoma.
* Cleaned up the list of materials shown on Rahool's vendor section.
* Removed the loadout optimizer progress popup and replaced it with an inline progress indicator.
* Added some debugging information in case DIM fails very early in its startup.

## 7.87.0 <span class="changelog-date">(2023-09-24)</span>

* Fixed the "Any Class" Loadout toggle not removing class-specific items.
* The tabs (Overview/Triage) in the item popup no longer scroll with their contents.
* Hide the duplicate activity socket on some ghosts.
* Loadouts now show which problems they have (e.g. deprecated mods) on the loadout itself, not just in the filter pills.
* Improved the drag-to-dismiss behavior of sheets on mobile. There's more work to do there though.
* The pattern progress bar in the item popup now shows a harmonizer icon when a deepsight harmonizer could be used on that item to unlock pattern progress.

## 7.86.0 <span class="changelog-date">(2023-09-17)</span>

* Restored `is:dupelower` to prioritize power when choosing lower dupes.

## 7.85.0 <span class="changelog-date">(2023-09-10)</span>

* Adding a subclass to a Loadout or selecting a subclass in Loadout Optimizer will now copy all currently equipped Aspects and Fragments too.
* The sort order for loadout names has been changed to better respect different languages, and to understand numbers in names. It should now match the way you see files sorted in File Explorer / Finder.

## 7.84.1 <span class="changelog-date">(2023-09-06)</span>

* Fixed the character menu scrolling the page to the top.
* The "Sort triumphs by completion" toggle on the Records page now maintains the order of triumphs with identical completion progress.

## 7.84.0 <span class="changelog-date">(2023-09-03)</span>

* The order of vendor items should now much more accurately match the in-game order.
* Filters and toggles on the Vendors page now consider focusing/decoding subvendors. E.g. the "Only show uncollected items" toggle will now show focusing subvendors if they allow focusing items you don't have collected.
* Loadout editor menus now have a "Sync from equipped" option that replaces the loadout's items with your equipped items. The "Fill in using equipped" option is also disabled when there's no spaces to fill.
* When loadouts are sorted by edit time, they are now grouped under headers showing which season they were last edited in.
* The character menu no longer displays behind sheets.
* "Fill in using non-equipped" will no longer attempt to add items for the wrong character class.
* The Loadout Optimizer now uses the same editors as the Loadout Editor for subclass and mods, and has all the same options.

## 7.83.1 <span class="changelog-date">(2023-08-29)</span>

* Fixed another case where you might not get bounced to the login page when you need to re-login.
* Fixed the search autocomplete menu showing behind search results on mobile.
* Unsightly long text in the mod picker now wraps instead of escaping its box.
* Fixed a few minor visual issues in sheets.

## 7.83.0 <span class="changelog-date">(2023-08-27)</span>

* You can choose between a number of different themes for DIM's interface in settings.
* The Vendors page now has a toggle to hide all items sold for Silver.
* Clicking on sub-vendors on the vendors page now opens them in a sheet, instead of taking you to a new page.
* Vendor reputation is now displayed with all the same info as the ranks on the Progress page.
* The "strip sockets" tool now has an option to remove only discounted-cost mods.
* Fixed a bug where Loadout Optimizer would sometimes interpret a search query too literally and require that all items match it, even if a slot doesn't have any items that match the query.
* Removed the ability to favorite finishers - this functionality has been removed from the game.
* Fixed the color of search bars in sheets.
* Fixed the ordering of popups, sheets, and tooltips so they won't display behind things anymore.
* Fixed loadouts including last season's artifact unlocks.
* Remove transmat effects from Rahool's currencies list.
* Fixed display of character headers on mobile.
* While In-Game Loadouts are disabled, their section of the Loadouts page will not appear.

## 7.82.1 <span class="changelog-date">(2023-08-22)</span>

## 7.82.0 <span class="changelog-date">(2023-08-20)</span>

* Again fixed unsaving previously saved, now invalid search queries.
* The "Titles" section on the Records page now shows the corresponding title instead of the seal name (e.g. Dredgen and Rivensbane instead of "Gambit" and "Raids").
* Added vendor engrams to the materials tooltip/sheet accessible through or near the vault emblem.
* The "Search History" table can now be sorted by its columns (times used, last used) just like the Organizer.
* DIM now detects the Clarity browser extension and recommends uninstalling it. Clarity is no longer developed by its authors and it causes excessive system resource usage.
* Emblem backgrounds in the character headers should be a bit more crisp and won't scale as weirdly.

## 7.81.0 <span class="changelog-date">(2023-08-13)</span>

## 7.80.0 <span class="changelog-date">(2023-08-06)</span>

* Fixed "Fill in using equipped" in a Loadout's subclass section failing to copy Aspects and Fragments.

## 7.79.0 <span class="changelog-date">(2023-07-30)</span>

* You can now search for Emotes and Ghost Projections on the Records page.
* Added button to sort triumphs by completion.
* Greatly expanded the "Randomize Loadout" feature. You can now randomize a Loadout's subclass and its configuration, weapons, armor, cosmetics, and armor mods.
  * Randomize them individually through the three dots in a Loadout section.
  * Randomize the entire Loadout using the "Randomize" button at the bottom of the Loadout drawer.
  * The existing "Randomize Loadout" button to immediately generate and apply a random Loadout now allows you to choose which parts of your current loadout to randomize
  * If you have an active search query, weapons and armor will be restricted to those matching the query.
* DIM should automatically log you out if you need to log back in manually at Bungie.net, rather than just not working.
* The "Optimize Armor" button on loadouts changes to "Pick Armor" when you don't have a complete armor set.
* In Armory and Collections, un-rollable perks are sorted to the bottom, and we no longer show enhanced options for uncraftable perks.
* Tier 1 Powerful Exotic engrams are now counted as Powerful rewards on the Progress page.
* The Quests section on the Progress page now has filtering pills that match the quest categories in game (e.g. Exotics, Lightfall, The Past).
* Artifact unlocks on loadouts no longer show a "1" in the corner.

## 7.78.0 <span class="changelog-date">(2023-07-23)</span>

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

* The [DIM User Guide](https://guide.dim.gg) has moved back to GitHub from Fandom, so you can read about DIM without intrusive ads.
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
