## Next

* Removed "Color Blind Mode" setting. This didn't help with DIM's accessibility - it just put a filter over the page to *simulate what it would be like* if you had various forms of color blindness.
* Added `hunt` as valid season synonym.
* Clicking on the energy track or element for armor can now let you preview how much it'd cost in total to upgrade energy or change element.
* Redesigned weapon perks/mods to more clearly call out archetype and key stats.
* Improved the buttons that show in the item popup for items in postmaster. For stacked items you can now take just one, or all of the item.
* Some items that DIM couldn't pull from postmaster before, can be pulled now.
* Fixed the display of stat trackers for raid speed runs.
* Hide the "kill tracker" perk column on masterworked weapons.

## 6.36.1 <span className="changelog-date">(2020-10-26)</span>

* Some more tweaks to the sidecar layout.
* Put back automatically showing dupes when launching compare.
* The item popup now closes when you start dragging an item.

## 6.36.0 <span className="changelog-date">(2020-10-25)</span>

* Rearranged equip/move buttons on sidecar to be horizontal icons instead of menu items.
* On mobile, you can switch characters in either direction, in a loop.
* Added cooldown and effect values to stat tooltips.
* Added stat tooltips to the Loadout Optimizer.
* Fixed descriptions for mod effects in the Loadout Optimizer's mod picker.
* New keyboard shortcuts for pull item (P), vault item (V), lock/unlock item (L), expand/collapse sidecar (K), and clear tag (Shift+0). Remember, you must click an item before being able to use shortcuts.
* Made the item popup a bit thinner.
* Collapsing sections now animate open and closed.

### Beta Only

* We're experimenting with a new "Search Results" sheet that shows all the items matching your search in one place.

## 6.35.0 <span className="changelog-date">(2020-10-18)</span>

* Added the "sidecar" for item popup actions on desktop. This lets us have more actions, and they're easier to understand. If you always use drag and drop, you can collapse the sidecar down into a smaller version.
* On mobile, press and hold on an item to access a quick actions menu, then drag your finger to an option and release to execute it. Move items faster than ever before!
* Added buttons to the settings page to restore the default wish list URL.
* Tweaked the Loadout Optimizer to make it easier to understand, and more clearly highlight that stats can be dragged to reorder them.
* In Loadout Optimizer, Compare Loadout can now compare with your currently equipped gear. Also, clicking "Save Loadout" will prompt you for whether you want to overwrite the loadout you're comparing with.
* Fixed an issue where you couldn't directly edit the minimum power field in Loadout Optimizer.
* D1 items can no longer incorrectly offer the ability to pull from postmaster.
* Tuned the search autocomplete algorithm a bit to prefer shorter matches.
* Fixed multi-stat masterworked exotics messing up the CSV export.
* Darkened the keyboard shortcut help overlay (accessed via the ? key).
* Removed tagging keyboard shortcut tips from places where they wouldn't work.

## 6.34.0 <span className="changelog-date">(2020-10-11)</span>

* Replaced the tagging dropdown with a nicer one that shows the icon and keyboard shortcut hints.
* Made the farming mode popup on mobile not overlap the category selector, and made it smaller.
* Secretly started recording which mods you selected in Loadout Optimizer when you create a loadout, for future use.
* In the Organizer, the selected perk for multi-option perks is now bold.
* Updated the style and tooltip for wishlist perks to match the thumb icon shown on tiles.
* Fix some display of masterworked exotics in the CSV export.

## 6.33.0 <span className="changelog-date">(2020-10-04)</span>

* The Organizer's buttons now show you how many items you have in each category. These counts update when you use a search too!
* On mobile, the search bar appears below the header, instead of on top of it.
* Changed the effect when hovering over character headers.
* Hitting Tab while in the search bar will only autocomplete when the menu is open.
* Fixed the "custom stat" setting not being editable from Safari.
* Consumables may no longer be added to loadouts for D2.
* The Loadout Optimizer lock item picker will show items that are in the Postmaster.

### Beta Only

* Removed the ability to move a specific amount of a stacked consumable item.
* Continued updates to our new background style and desktop item actions menu.

## 6.32.2 <span className="changelog-date">(2020-09-29)</span>

* Actually fixed "Store" buttons not showing for items in Postmaster.
* Fix wishlists not highlighting the right rolls.

## 6.32.1 <span className="changelog-date">(2020-09-29)</span>

* Fixed "Store" buttons not showing for items in Postmaster.
* Fixed masterwork stats for Exotics not displaying correctly.
* Fixed character stats only displaying the current character's stats on mobile.
* Fixed Postmaster not appearing on D1 for mobile.

## 6.32.0 <span className="changelog-date">(2020-09-27)</span>

* In Compare, you can click on perks to see what the new stats would look like if you chose another option.
* When the item popup is open, hitting the "c" key will open Compare.
* Your subclass has been moved below weapons and armor (it's been this way in Beta for a while).
* On mobile, instead of showing all your items at once, there's now a category selection bar that lets you quickly swap between weapons, armor, etc. The postmaster is under "inventory".
* Transferring items is just a touch snappier.
* The tag and compare button on the search bar have been replaced with a dropdown menu (three dots) with a lot more options for things you can do with the items that match your search.
* On mobile, your equipped emblem no longer affects the color of your screen.
* Loadout Optimizer has a nicer layout on mobile and narrower screens.
* Fix some masterwork stats not showing.
* Fix some issues with how mods got auto-assigned in Loadout Optimizer.
* Fix masterwork stats not always highlighting.
* Fix masterwork tier for some items.
* Fix an issue where searching for "ote" wouldn't suggest "note:"
* The Organizer shows up in the mobile menu, but it just tells you to turn your phone.

### Beta Only

* We're experimenting with moving the item action buttons to the side of the item popup on desktop - we call it the "sidecar". It moves the actions closer to the mouse, allows room to have clearer labels, and gives more room to add more commands. Plus generally people have screens that are wider than they are tall, so this reduces the height of the popup which could previously put buttons off screen. We'll be tweaking this for a while before it launches fully.
* Beta now has an early preview of a new theme for DIM.

## 6.31.2 <span className="changelog-date">(2020-09-22)</span>

* Fix an issue where moving Exotic Cipher to vault with DIM would cause your characters to be filled up with items from your vault.

## 6.31.1 <span className="changelog-date">(2020-09-21)</span>

* Loadout Optimizer highlights loadouts you've already saved.
* Add new searches `kills:`, `kills:pvp:`, and `kills:pve:` for Masterwork kill trackers.
* Fixed: "Source" was not being set for all items.
* Fixed: Item type searches (e.g. is:pulserifle) not working for D1.
* Fixed: Spreadsheets missing power cap.

## 6.31.0 <span className="changelog-date">(2020-09-20)</span>

* Added a link to the DIM User Guide to the hamburger menu.
* "Clear new items" has been moved into the Settings page instead of being a floating button. The "X" keyboard shortcut no longer clears new items.
* Linear Fusion rifles are technically Fusion Rifles, but they won't show up in Organizer or in searches under Fusion Rifle anymore.
* While API performance is ultimately up to Bungie, we've changed things around in DIM to hopefully make item transfers snappier. Note that these changes mean you may see outdated information in DIM if you've deleted or vaulted items in-game and haven't clicked the refresh button in DIM.
* Improved the autocomplete for `sunsetsafter:` searches.
* Fix the `is:new` search.
* The D1 Activities page now shows Challenge of the Elders completion.
* Fixed buttons not showing up on tablets for track/untrack triumphs.
* Invalid searches are no longer saved to your search history.
* The "Filter Help" page is now searchable, and clicking on search terms applies them to your current search.
* Added a Search History page accessible from "Filter Help" and Settings so you can review and delete old searches.
* Shift+Delete while highlighting a past search in the search dropdown will delete it from your history.
* Fixed the `masterwork:` filters.
* Fixed the icon for "Take" on the item popup for stackable items.
* Removed the ability to restore old backups from Google Drive, or backups created from versions of DIM pre-6.0 (when DIM Sync was introduced).
* Armor 1.0 mods and Elemental Affinities removed from the perk picker in Loadout Optimizer.
* Improved search performance.
* Items in collections now show their power cap.
* Character stats now scroll with items on mobile, instead of always being visible. Max power is still shown in the character header.
* Added "Location" column to the Organizer to show what character the item is on.
* When "Base Stats" is checked in the Compare tool, clicking on stats will sort by base stat, not actual stat.

### Beta Only

* On mobile, there is now a bar to quickly swap between different item categories on the inventory screen.

## 6.30.0 <span className="changelog-date">(2020-09-13)</span>

* Compare loadouts in Loadout Optimizer to your existing loadout by clicking the "Compare Loadout" button next to a build.
* Improvements to search performance, and search autocomplete suggestions.
* Fix cases where some odd stats would show up as kill trackers.
* Sword-specific stats now show up in `stat:` filters.

## 6.29.1 <span className="changelog-date">(2020-09-11)</span>

* Improved performance of item transfers. We're still limited by how fast Bungie.net's API can go, though.
* Fixed a couple of the legacy triumphs that indicated the wrong triumph was being retired.
* Completed legacy triumph categories, and collections categories, now show the "completed" yellow background.
* is:seasonaldupe now correctly pays attention to the season of the item.
* Fixed a bug where notes wouldn't be saved if you clicked another item before dismissing the item popup.
* Tweaks to the display of legacy triumphs.
* Reduce the number of situations in which we autoscroll the triumph category you clicked into view.

## 6.29.0 <span className="changelog-date">(2020-09-10)</span>

* Legacy Triumphs are now indicated on the Records page and have their own checklist section. Legacy Triumphs are triumphs that will not be possible to complete after Beyond Light releases. The list of which Triumphs are Legacy Triumphs was provided by Bungie.
* Mods in the Loadout Optimizer mod picker are now split up by season.
* The number of selected items is now shown on the Organizer page.
* Empty mod slot tooltips spell out which season they're from.
* Locking/unlocking items in D1 works again.

## 6.28.1 <span className="changelog-date">(2020-09-06)</span>

* Actually release the Records page

## 6.28.0 <span className="changelog-date">(2020-09-06)</span>

* Triumphs, Collections, and Stat Trackers are now all together in the new Records page.
* You can track triumphs in DIM - tracked triumphs are stored and synced with DIM Sync. These show up on both the Progress and Records pages.
* Everything on the Records page responds to search - search through your Collections, Triumphs, and Stat Trackers all at once!
* Unredeemed triumphs show their rewards
* Compare sheet now offers a Base Stat option for armor, so you can directly compare your stat rolls
* Mod costs now shown in Loadout Optimizer results
* Vendors can now track some "pluggable" items like emotes & ghost projections, to filter by whether you already own them
* Clearing the search input no longer re-opens the search dropdown
* Mod slot column in the Organizer now shows all supported mod types (i.e. season 10 armor will show seasons 9,10,11)
* Support for `mod:` and `modname:` filters to parallel the `perk:` and `perkname:` ones
* Use the dark theme for Twitter widget

## 6.27.0 <span className="changelog-date">(2020-08-30)</span>

* The new armor 2.0 mod workflow is available in the Loadout Optimizer, this includes:
  * A new Mod Picker component to let you choose armor 2.0 mods to lock.
  * The mod sockets shown in the optimiser are now the locked mods, rather than the mods currently equipped on the item.
  * Clicking on a mod socket will open the picker to show available mods for that slot. Note that locking a mod from this won't guarantee it gets locked to the item specifically.
  * Items have different levels of grouping depending on the requirements of the locked mods. Locking no mods keeps the previous grouping behaviour.
  * The mods stat contributions are now shown in the picker.
  * The Mod Picker can now filter for items from a specific season, just filter by the season number directly e.g. "11" for arrivals.
* The search bar now remembers your past searches and allows you to save your favorite searches. These saved and recent searches are synced between devices using DIM Sync.
* The quick item picker (plus icon) menu no longer has an option to equip the selected item. Instead it will always just move the item - very few users selected "Equip" and it won't ever work in game activities.
* Added background colors for items and characters before their images load in, which should reduce the "pop-in" effect.
* Shaders can be tagged from the Collections page and the tags/notes show up there as well.
* Shift+Click on the Notes field in Organizer while in edit mode no longer applies a search.
* For pages with sidebars (like Progress), scrollbars appearing will no longer cover content.
* Add character stats to loadout sheet if full armor set is added.

### Beta Only

* Long-pressing on an item in mobile mode will bring up a quick actions menu - drag and release on a button to apply the action to the item you pressed on.
* Move Sub-class out of Weapons to the General category

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
* Phone/mobile resolutions will now show a mini-popup to make inspecting and moving items much easier.

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
