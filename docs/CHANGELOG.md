## Next

## 6.26.0 <span className="changelog-date">(2020-08-23)</span>

* Better touchscreen support for drag and drop.
* Wishlists now support Github gists (raw text URLs), so there's no need to set up an entire repository to host them. If you are making wishlists, you can try out changes easier than ever. If you're not making wishlists, hopefully you're using them. If you don't know what wishlists are, [here you go](https://destinyitemmanager.fandom.com/wiki/Wish_Lists)
* Engrams get a more form-fitting outline on mouse hover.
* If you have a search query active, DIM will not automatically reload to update itself.
* The `is:curated` search has been overhauled to better find curated rolls.
* Fixes to how the character headers look in different browsers.
* Fixed the missing armor.csv button on the Organizer.

### Beta Only
* Loadout Optimizer: DIM Beta is now using the new Mod Picker, a separate and improved picker just for armor mods. Try it out and let us know how it feels
* In Beta only, the filter search bar has been upgraded to remember recent searches and let you save your favorite searches.

## 6.25.0 <span className="changelog-date">(2020-08-16)</span>

* Removed `is:reacquireable` as it is inaccurate in its current state
* Removed outline from clicked character headers on iOS
* Adjusted spacing on items in the loadout drawer, so they can fit 3-wide again
* Main (top) search field is now the place to filter items for the Loadout Optimizer
* For real, stat bars should be the right length this time
* Keyboard controls in the Notes field: ESC reverts and leaves editing, ENTER saves the value
* Item notes can now be edited directly in the notes column of the Organizer tab
* Mobile - changes in DIM beta only: different parts of the header now stick with you as you scroll down.
* Armor CSV export appearing properly on the Organizer tab again.

## 6.24.1 <span className="changelog-date">(2020-08-12)</span>

* Updated the character tiles, now uses triple dot instead of chevron
* Solstice of Heroes is back and so is the **Solstice of Heroes** section of the **Progress** tab. Check it out and view your progress toward upgrading armor.

## 6.24.0 <span className="changelog-date">(2020-08-09)</span>

* Configure a custom armor stat per-class in Settings, and it'll show up in item popups, Organizer, Compare, and the new `stat:custom:` search.
* Speed improvements to wishlist processing.
* `is:smg` for if you're as bad at remembering "submachine gun" as.. some of us are.
* No more accidental app reloads when swiping down hard on the page on mobile.
* Spring (Summer?) cleaning in the Item Popup. Some less important elements have been moved or removed, to make room for more functionality and stats.
* Bar-based stat values in the Mod preview menu are no longer extremely large bois.
* Anti-champion damage types are now interpreted in tooltip descriptions.
* Seasonal Artifact is now previewable, but be warned:
  * Some data from the API is wrong, and the Season 11 artifact is incorrectly labeled.
  * It can show seasonal mods you have equipped, but Season 11 mods still aren't in Collections data, so mod unlocks aren't displayed.
* Spreadsheet columns slightly adjusted to get them back to their usual column names.
* Lots going on behind the scenes to clear up errors and get Loadout Optimizer ready for upgrades!

## 6.23.0 <span className="changelog-date">(2020-08-02)</span>

* You can add tags and notes to shaders! Keep track of your favorites and which shaders you could do without.
* Searches now support parentheses for grouping, the "and" keyword, and the "not" keyword. Example: `(is:weapon and is:sniperrifle) or not (is:armor and modslot:arrival)`. "and" has higher precedence than "or", which has higher precedence than just a space (which still means "and").
* Fixed the size of damage type icons in D1.
* Our Content Security Policy is more restrictive now, external and injected scripts may fail but this keeps your account and data safer.

## 6.22.1 <span className="changelog-date">(2020-07-27)</span>

## 6.22.0 <span className="changelog-date">(2020-07-26)</span>

* New: More detailed gear information is available by hovering or clicking the Maximum Gear Power stat in each character's header.
* Improved detection that you need to reauthorize DIM to your Bungie account.
* Fixes to how stat bars display when affected by negative modifiers & perks.
* Clearer errors if DIM is unable to save the item information database.
* Organizer
  * Power Limit column now generates the right filter when Shift-clicked.
  * Traits column content has been narrowed down.
  * Improved top level categories take fewer clicks to reach your items.
* Loadout Optimizer
  * Fixed finding slots for seasonal mods.

## 6.21.0 <span className="changelog-date">(2020-07-19)</span>

* Added support for negative stats on mods. This should be visible in item displays and make loadout optimizer results more accurate.
* Fix quick item picker not remembering your preference for "equip" vs "store".
* Some quests can now be tracked or untracked from DIM.
* Locking or unlocking items from DIM is now reflected immediately on the item tiles.
* Items with the Arrivals mod slot now match the `holdsmod:dawn` search.

## 6.20.0 <span className="changelog-date">(2020-07-12)</span>

* Fix sorting by Power Limit in the compare pane.
* When opening a loadout in the loadout optimizer from the inventory page, the correct character is now selected rather than the last played character.
* Allow masterworks to affect more than one stat
* Exclude subclasses from `is:weapon` filter.
* Fixed Loadout Optimizer not including all the right tiers when tier filtering was in place.

## 6.19.0 <span className="changelog-date">(2020-07-05)</span>

* Loadout Optimizer has been... optimized. It now calculates sets in the background, so you can still interact with it while it works.
* Removed ghosts from loadout optimizer as they don't have enough interesting perks to build into loadouts.
* The filter help button is now always shown in the search bar, even when a search is active.
* The item count in the search bar is now more accurate to what you see on the inventory screen.
* Make it clearer that not having Google Drive set up doesn't matter that much since it's only for importing legacy data.
* Better handling for if the DIM Sync API is down.

## 6.18.0 <span className="changelog-date">(2020-07-02)</span>

* Breaker type is now shown on the item popup and in the Organizer.
* New filter for breaker types on weapons, `breaker:`.
* Fixed another crash on the vendors screen also caused by the Twitch gift sub shader.
* Protect against certain weird cases where DIM can get stuck in a non-working state until you really, thoroughly, clear your cache.

## 6.17.1 <span className="changelog-date">(2020-07-01)</span>

* Fix a crash with the Twitch gift sub shader.

## 6.17.0 <span className="changelog-date">(2020-06-28)</span>

* You can now filter out armor in the Loadout Optimizer by minimum total stats. This narrows down how many items are considered for builds and speeds up the optimizer.
* Renamed the "is:reacquireable" filter to "is:reacquirable"
* Searches like "is:inleftchar" now work with consumables in the postmaster.
* Fixed the inventory screen jumping a bit when the item popup is open on mobile.
* Add a link to the troubleshooting guide to error pages.
* Seasonal mods in the loadout optimizer now force armor to match their element, again.
* The stat in parentheses in a weapon perk tooltip, is the stat matching the masterwork. UI slightly updated to help show this.

## 6.16.1 <span className="changelog-date">(2020-06-22)</span>

* Fix a crash when opening some items in Organizer.

## 6.16.0 <span className="changelog-date">(2020-06-21)</span>

* Remove `is:ikelos` filter
* Loadout Optimizer: Save stat order and "assume masterworked" choices.
* Fixed a bug that caused the inventory view to jump to the top of the screen when items were inspected.
* Add a disclaimer to power limit displays that they may change in the future. Please see https://www.bungie.net/en/Help/Article/49106 for updates
* Save column selection for Ghosts in the Organizer separate from Armor.
* Display how many tags were cleaned up in the DIM Sync audit log.
* Fix a bug where canceling setting a note in the Organizer would wipe notes from selected items.
* Add a pointer cursor on item icons in the Organzier to indicate they're clickable.
* Fix minimum page width when there are fewer than three characters.
* Fix Arrival mods not appearing in the Loadout Optimizer.
* Fix a bug when DIM Sync is off that could repeatedly show a notification that an import had failed. Please consider enabling DIM Sync though, your data WILL get lost if it's disabled.

## 6.15.1 <span className="changelog-date">(2020-06-15)</span>

## 6.15.0 <span className="changelog-date">(2020-06-14)</span>

* Items now show their power limit in the item popup, Compare, and in the Organizer (new column). Keep in mind some power limits may change in upcoming seasons.
* Try the `sunsetsafter:` or `powerlimit:` filters to find things by their power limit.
* Fix the season icon for reissued items.
* Fix not being able to dismiss the item popup on the Organizer in certain cases.
* Remove the 15 second timeout for loading data from Bungie.net.
* Fix umbral engrams showing up weird in the engram row.
* Prevent Chrome on Android from showing a "download this image" prompt when long-pressing on images.
* Fix non-selected perks not showing on old fixed-roll weapons.
* Add Charge Rate and Guard Endurance stat to swords.

## 6.14.0 <span className="changelog-date">(2020-06-07)</span>

* Fixed misdetection of seasonal mods in Compare.
* Work around a Bungie.net issue that could prevent the Destiny info database from loading.
* Improved the experience for users who previously had DIM Sync off.

## 6.13.2 <span className="changelog-date">(2020-06-03)</span>

## 6.13.1 <span className="changelog-date">(2020-06-01)</span>

* Add a banner to support Black Lives Matter.
* Avoid an issue where shift-clicking on empty space near perks in the Organizer can enable a useless filter.

## 6.13.0 <span className="changelog-date">(2020-05-31)</span>

* DIM data (loadouts, tags, settings) can no longer be stored in Google Drive. If you already have things stored there, you can use that data to import into the new storage, but it will no longer be updated. Disabling DIM Sync will now store data locally only.
* The Vault Organizer is now available for D1.
* CSV export will no longer erroneously consider calus as a source and instead output the correct source.
* CSV export will now export the same source information that DIM uses for items that do not have a source in the API.
* Fixed import/export of data - if your backups didn't load before, they should now.
* Fixed Organizer default sorting for stats, and shift-click filtering for modslot.
* Vendors data no longer has to reload every time you visit the page.
* is:dupelower search is stabilized so that tagging items as junk doesn't change what is considered "lower"
* Fixed loadouts with subclasses not fully transferring to the vault.
* Don't display "ms" unit on Charge Time stat for D1 fusion rifles.

## 6.12.0 <span className="changelog-date">(2020-05-24)</span>

* DIM has a new community-driven user guide at https://destinyitemmanager.fandom.com/wiki/Destiny_Item_Manager_Wiki

## 6.11.0 <span className="changelog-date">(2020-05-17)</span>

* Added the Organizer page, which lets you see all your items in a table form, which you can sort and filter (try shift-clicking on a cell!). Add and remove columns and bulk-tag your items to help quickly figure out which items you want to keep and which you can get rid of.
* Fixed stat calculations for special Taken King class items in D1.

## 6.10.0 <span className="changelog-date">(2020-05-10)</span>

## 6.9.0 <span className="changelog-date">(2020-05-03)</span>

* In the Loadout Optimizer, mods have been split into their own menu, separate from perks.
* Fixed a bug where wishlists would ignore settings and load the default wishlist instead.

## 6.8.0 <span className="changelog-date">(2020-04-26)</span>

* Added "armor 2.0" column to spreadsheet exports.
* Fixed a bug that could affect the display of percentage-based objectives.

## 6.7.0 <span className="changelog-date">(2020-04-19)</span>

* Emblems now show a preview of their equipped stat tracker, and show which types of stat tracker the emblem can use.
* Certain stat trackers (under "Metrics" in "Collections") had the wrong display value, like KDA. These have been fixed.
* Loadout Optimizer now allows you to select seasonal mods independent of the gear they go on - it'll try to slot them into any gear.

## 6.6.0 <span className="changelog-date">(2020-04-12)</span>

* Better handling of logging out and into a different Bungie.net account.
* Improved error handling for Bungie.net and DIM Sync issues.

## 6.5.0 <span className="changelog-date">(2020-04-10)</span>

* Improved overall performance and memory usage of DIM - as the game grows, so has DIM's memory usage. If your browser was crashing before, give it a try now.
* Collectibles now show perks.

## 6.4.0 <span className="changelog-date">(2020-04-05)</span>

* Added stat trackers to the Collections page (under "Metrics")
* Improved error handling when Bungie.net is down or something is wrong with your account. Includes helpful tips for D1 users locked out by Twitch-linking bug. If your D1 accounts disappeared, they're in the menu now.
* Accounts in the menu are now always ordered by last-played date.
* DIM will no longer bounce you to a different account if the one you wanted cannot be loaded.
* Fixed some bugs that could cause D1 pages to not display.
* Fix display of collectibles that are tied to one of your alternate characters.
* Fix the levels that reward Bright Engrams after season rank 100.

## 6.3.1 <span className="changelog-date">(2020-03-29)</span>

* Fixed a bug where D1 items could fail to display.
* Fixed a bug where responding "Not now" to the DIM Sync prompt wouldn't cause it to go away forever.
* Make mod slot for Reverie Dawn armor set detect correctly as outlaw.

## 6.3.0 <span className="changelog-date">(2020-03-29)</span>

* Removed duplicate Mods section from the top level of the Collections screen - they're still under the normal collections tree.
* Fixed a missing icon when season rank is over 100.

## 6.2.0 <span className="changelog-date">(2020-03-22)</span>

## 6.1.1 <span className="changelog-date">(2020-03-22)</span>

## 6.1.0 <span className="changelog-date">(2020-03-22)</span>

* Introducing [DIM Sync](https://github.com/DestinyItemManager/DIM/wiki/DIM-Sync-(new-storage-for-tags,-loadouts,-and-settings)), a brand new way for DIM to store your loadouts and tags and sync them between all your devices. This is a big step forward that'll let us build lots of new things and share data between other apps and websites! Plus, you no longer have to log into anything separate, and we should avoid some of the bugs that have in the past led to lost data.
* External wish lists will be checked daily. Settings menu shows last fetched time.
* Seasonal Artifact is no longer considered a weapon or a dupe when searching.
* Event sources for items like Festival of the Lost and Revelry are now under the `source:` search like other sources, instead of `event:`.
* Fixed some recent bugs that prevented editing loadouts.
* Show how much of each material you have next to Spider's vendor info.
* Updated privacy policy with DIM Sync info.
