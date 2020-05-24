## 5.74.0 <span className="changelog-date">(2020-03-15)</span>

* Updated item metadata for Season of the Worthy! Mod slots, sources, ghost perks, etc.
* Fixed a bug where using the colorblindness filters interfered with drag and drop.
* Restyled vendor engrams icons to make them clearer.
* Quest steps now use their questline name as a title, and the quest step as subtitle, just like in game.
* Reorganized some of the search keyword suggestions.
* Add "holdsmod:" search to find armor compatible with a certain season's mods.
* Behind-the-scenes changes to support upcoming DIM Sync storage feature.

## 5.73.0 <span className="changelog-date">(2020-03-08)</span>

* You can now restrict what items get chosen by the random loadout feature by having an active search first. Try typing "tag:favorite" or "is:pulserifle" and then choosing Randomize.
* Improved drag and drop performance on some browsers.
* Removed the Factions section from the Progress page. You can still see faction rank on the Vendors page.

## 5.72.0 <span className="changelog-date">(2020-03-01)</span>

* Worked around a long-standing Bungie.net bug where items would change lock state when moved. One caveat is that DIM will always preserve the lock state as it sees it, so if you've locked/unlocked in game and haven't refreshed DIM, it may revert your lock.

## 5.71.0 <span className="changelog-date">(2020-02-23)</span>

* Removed "Gather Reputation Tokens" feature. You can do the same thing with an "is:reptoken" search.
* Changing language now properly updates the UI language and prompts to reload.
* Update search filters to include 'is:hasornament' and 'is:ornamented'
* Filter autocomplete should now work in increments, and suggest a wider variety of filters.
* Filter autocomplete should now work in increments, and suggest a wider variety of filters
* Farming mode now uses the same logic as regular item moves to choose your lowest-value item to send to the vault when a bucket is full. Favorite/keep your items and they'll stay put!
* Removed the option to move tokens to the vault in farming mode.

## 5.70.0 <span className="changelog-date">(2020-02-16)</span>

* Removed community reviews and ratings functionality. It may return in the future, but it was broken since Shadowkeep.
* Updated Search suggestions to sort "armor" above "armor2.0"
* Fixed ghosts not being draggable in the Loadout Optimizer.
* Fixed the Infusion tool not showing all possible items.

## 5.69.0 <span className="changelog-date">(2020-02-09)</span>

## 5.68.0 <span className="changelog-date">(2020-02-02)</span>

* `wishlistnotes` autocompletes in the search filters now.

## 5.67.0 <span className="changelog-date">(2020-01-26)</span>

## 5.66.0 <span className="changelog-date">(2020-01-19)</span>

## 5.65.0 <span className="changelog-date">(2020-01-12)</span>

* Setting added for DIM to grab wish lists from external source (defaults to voltron.txt). Choose "Clear Wish List" to remove the default.
* Avoid a bug where users who logged in via Stadia would get caught in a login loop. If you are having trouble with login, try using a non-Stadia login linked to your Bungie.net account.
* Remove "Store" buttons from Finishers, Clan Banners, and Seasonal Artifacts.
* Add links to YouTube tutorials for Search and Loadout Optimizer.

## 5.64.0 <span className="changelog-date">(2020-01-05)</span>

* Integrating with vendorengrams.xyz to find at-level vendor drops.
* Wish lists - trash list icon works with ratings turned off.

## 5.63.0 <span className="changelog-date">(2019-12-29)</span>

## 5.62.0 <span className="changelog-date">(2019-12-22)</span>

## 5.61.1 <span className="changelog-date">(2019-12-17)</span>

* Auto refresh is disabled while Bungie.net is under heavy load.

## 5.61.0 <span className="changelog-date">(2019-12-15)</span>

## 5.60.0 <span className="changelog-date">(2019-12-08)</span>

* Bulk tagging no longer erroneously removes notes from selected items.

## 5.59.0 <span className="changelog-date">(2019-12-01)</span>

* Add a link to Seals on the Progress page sidebar.
* Shift click mods in Loadout Optimizer will properly add them to locked mods.
* Fix a bug where auto-refresh could stop working if you drag an item while inventory is refreshing.
* Seasonal Rank now correctly continues past rank 100.
* `maxbasestatvalue` now filters by item slot instead of item type (think masks versus helmets).

## 5.58.0 <span className="changelog-date">(2019-11-24)</span>

* Wish list files now support block notes.
* Option to pretend all Armor 2.0 items are masterworked in the Loadout Optimizer.
* Selecting an Armor 2.0 mod in Loadout Optimizer will recalculate stats as if that mod were already socketed.
* Ignoring stats in Loadout Optimizer re-sorts the loadouts without including the ignored stats in the total.
* Loadout Optimizer is faster.

## 5.57.0 <span className="changelog-date">(2019-11-17)</span>

* Added support for trash list rolls in wish list files - see the documentation for more info.
* Added ability to assume armor 2.0 items are masterworked in the loadout builder.
* Mods now indicate where they can be obtained from.
* Removed the ornament icons setting, as it didn't do anything since Bungie overrides the icon for ornamented items themselves.
* Fix some tricky cases where you might not be able to pull items from Postmaster.
* Restore hover tooltip on mods on desktop. You can still click to see all possible mods.
* Loadout Optimizer allows you to select "Ignore" in the dropdown for each stat - this will not consider that stat in sorting builds.

## 5.56.0 <span className="changelog-date">(2019-11-10)</span>

* Fixed some bugs that had crept into DIM's logic for moving items aside in order to allow move commands to succeed. Now if your vault is full, DIM will move items to less-frequently-used characters and avoid moving items back onto your active character. The logic for what items to move has been tuned to keep things organized.
* Clicking on a mod will bring up a menu that shows all applicable mods for that slot. You can see what each mod will do to stats and how much it costs to apply.
* Perk/mod headers and cosmetic mods are now hidden in Compare and Loadout Optimizer.

## 5.55.1 <span className="changelog-date">(2019-11-04)</span>

* Fix wonky layout and inability to scroll on item popups, item picker, and infuse tool.

## 5.55.0 <span className="changelog-date">(2019-11-04)</span>

## 5.54.0 <span className="changelog-date">(2019-11-04)</span>

## 5.53.0 <span className="changelog-date">(2019-11-04)</span>

* New Archive tag, for those items you just can't bring yourself to dismantle.
* Character and Vault stats glued to the page header for now.
* Catalysts display updated to handle some API changes.
* Fewer surprises on page change: Search field now clears itself so you aren't searching Progress page for masterwork energy weapons.
* Compare popup now features more options for comparing by similar grouped weapons and armor.
* Smarter loadout builder takes your masterworks into account.
* Speaking of masterworks, masterwork stat contribution is now clearly highlighted in Item Popup.
* There's more: class items now show their masterwork and mod stat contributions.
* Armor 2.0 is now correctly considered a random roll. `is:randomroll`
* Grid layouts should display with fewer bugs in older versions of Microsoft Edge.
* `is:hasmod` shows items with a Year 2 mod attached. `is:modded` shows items with any Armor 2.0 mods selected.

## 5.52.1 <span className="changelog-date">(2019-10-28)</span>

## 5.52.0 <span className="changelog-date">(2019-10-27)</span>

* Wish lists support integrating with DTR's item database URLs.
* Stats can be disabled in the Loadout Optimizer.
* Added the ability to search for items that have notes. is:hasnotes
* Armor 2.0 is now correctly considered a random roll. is:randomroll
* New filters for checking stats without mods - basestat: maxbasestatvalue:
* New "any" stat, try basestat:any:>20 for things with mobility>20, or discipline>20, or recovery>20, etc
* New seasonal mod filters, for finding somewhere to put your Hive Armaments - modslot:opulent
* Wishlist features widely updated with clearer labels
* Total stat in the item popup now reflects Mod contribution
* Armor 2.0 stats now integrated into the character header
* Fixes for caching issues and update loops
* Bugfixes, like every week

## 5.51.0 <span className="changelog-date">(2019-10-20)</span>

* Added an option to disable using ornament icons. Even when enabled, ornaments will only show for items where the ornament is specific to that item - not universal ornaments.
* Stats affected by Armor 2.0 mods are highlighted in blue.
* Improvements to Loadout Optimizer that should help when you have too many stat options.
* Made the Loadout Optimizer ignore Armor 2.0 mods when calculating builds. This ensures finding optimal base sets.
* Show element and cost on Mods Collection.
* Fixed search autocomplete behavior.
* Reverse armor groupings when character sort is set to most recent (reversed).
* New search `wishlistnotes:` will find wish list items where the underlying wish list item had the given notes on them.
* New search filters `maxstatloadout`, which finds a set of items to equip for the maximum total value of a specific stat, and `maxstatvalue` which finds items with the best number for a specific stat. Includes all items with the best number.
* New `source:` filters for `vexoffensive` and `seasonpass`
* Improved the styling of popup sheets.
* DIM uses slightly prettier URLs now.

## 5.50.1 <span className="changelog-date">(2019-10-14)</span>

* Made it possible to filter to Tier 0 in Loadout Optimizer.
* Changed max power indicator to break out artifact power from "natural" power.

## 5.50.0 <span className="changelog-date">(2019-10-13)</span>

* It's beginning to feel a lot like Year Three.
* Loadout Optimizer updated for Shadowkeep.
* Max Power Level includes artifact PL.
* Add seasonal rank track to milestones
* Equipped ornaments now show up in your inventory tiles. Your items, your look.
* "dupe" search and item comparison now recognize the sameness of armor, even if one is armor2.0 and the other isn't. Keep in mind that some "dupes" may still require Upgrade Modules to infuse.
* "year" and "season" searches now recognize that armor2.0 versions of old armor, still come from old expansions.
* "is:onwrongclass" filter for armor being carried by a character who can't equip it.
* Ghosts with moon perks are now badged!
* Collections > Mods updated for year 3 style mods.
* Check your Bright Dust levels from the Vault header.
* Multi-interval triumphs now supported.
* Stat displays tuned up. Total stat included, stats rearranged.
* CSV exports include more stats.
* Clarifications for API errors.
* Item popup now features armor Energy capacity.
* Reviews filtered better.
* Emotes, Ghost Projections, Ornaments, and Mods that you own are badged in vendors.
* Added Ghost Projections to Collections.
* Hide objectives for secret triumphs.
* Added a privacy policy (from About DIM).
* Fixed engrams having a number under them.
* Subclass path and super are highlighted on subclass icons.

## 5.49.1 <span className="changelog-date">(2019-10-07)</span>

## 5.49.0 <span className="changelog-date">(2019-10-06)</span>

* Add a link to your current profile on D2Checklist to view milestones, pursuits, clan, etc.
* Fix PC loadouts not transferring over from Blizzard.
* Fix Armor 2.0 showing as masterworked.
* Fix stats for Armor 2.0.
* Fix well rested for Shadowkeep.
* Remove XP and level from character tiles.
* Add year 3 search terms.

## 5.48.2 <span className="changelog-date">(2019-10-02)</span>

## 5.48.1 <span className="changelog-date">(2019-10-01)</span>

* For ratings, platform selection has been updated for Shadowkeep - check the setting page to update your selection.
* Ratings should be more standard across player inventories.
* Happy wish list icon moved into the polaroid strip.

## 5.48.0 <span className="changelog-date">(2019-09-29)</span>

* Our stat calculations are ever so slightly more accurate.
* Collections page now includes equipped/owned Weapon and Armor mods.
* UI fixes for shifting page content, subclasses, and some labels & alert messages.
* Drag and drop on mobile no should longer spawn a context menu.
* Emblems now display their selected variations.
* Filter by season names (i.e. `season:opulence`) and masterwork type (`masterwork:handling`)

## 5.47.0 <span className="changelog-date">(2019-09-22)</span>

* New look and display options under TRIUMPHS: reveal "recommended hidden" triumphs, or hide triumphs you've completed
* BrayTech link on Progress now links to your current character.
* Prevent accounts from overlapping menu on phone landscape mode.
* Show the effects of mods on stat bars.
* Removed the stats comparison with the currently equipped weapon. Use the Compare tool to compare items.
* Dragging and dropping should be smoother.

## 5.46.0 <span className="changelog-date">(2019-09-15)</span>

* The notification for bulk tagging now has an Undo button, in case you didn't mean to tag everything matching a search.
* The postmaster will highlight red when you have only 4 spaces left!
* Firefox for Android is now supported.
* Fixes for stats that could show >100.
* Show all Sword stats!
* The "tag:none" search works again.
* The header won't scroll on very narrow screens.
* The action bar is pinned to the bottom of the screen on mobile.

## 5.45.0 <span className="changelog-date">(2019-09-08)</span>

* Milestones are more compact, like Pursuits (click them to see full details). They now show expiration times and clan engrams are broken out into individual items.
* The item popup for Pursuits will refresh automatically as you play, if you leave one open (this doesn't yet work for Milestones).
* Expiration times only light up red when they have less than an hour left.
* Added a new is:powerfulreward search that searches for powerful rewards.
* Fixed a bug moving certain items like emblems.
* Added a quick-jump sidebar to the settings page.
* Add win streak info to ranks on the Progress page.
* Include the effect of mods and perks on "hidden" stats like zoom, aim assistance, and recoil direction.
* Bonuses from perks and mods shown in their tooltips are now more accurate.
* Loadout Optimizer understands multiple kinds of perks/mods that can enhance an item.
* Recoil Direction's value has been moved next to the pie.
* Searches now ignore accented characters in item names.
* Unique stacked items now show the count, instead of just MAX, when they're full.

## 5.44.2 <span className="changelog-date">(2019-09-02)</span>

* Fix Home Screen app warning for iPad.

## 5.44.1 <span className="changelog-date">(2019-09-02)</span>

* Added upgrade warning for old iOS versions that don't support Home Screen apps.

## 5.44.0 <span className="changelog-date">(2019-09-01)</span>

* Allow loadouts to be equipped without dismissing farming mode.
* Restore info to D1 ghosts.
* Add hotkeys to navigate between major pages (hit "?" to see them all)
* Fix move popup not updating amount on stackables when switching items.
* Remove Solstice of Heroes armor from Progress page.
* Prevent accidentally being able to tag non-taggable items with hotkeys.

## 5.43.1 <span className="changelog-date">(2019-08-26)</span>

* Fix broken ammo icons.

## 5.43.0 <span className="changelog-date">(2019-08-25)</span>

## 5.42.2 <span className="changelog-date">(2019-08-22)</span>

* Fix D1 accounts disappearing when they were folded into a different platform for D2 cross save.

## 5.42.1 <span className="changelog-date">(2019-08-20)</span>

* Changes to support preserving tags/notes data for Blizzard users who migrate to Steam.
* Fix searching Collections.

## 5.42.0 <span className="changelog-date">(2019-08-18)</span>

* Power is yellow again.
* Remove ugly blur behind popups Windows. (It's still a nice blur on other platforms)

## 5.41.1 <span className="changelog-date">(2019-08-16)</span>

* Fix overflowing text on ghosts.
* Fix crash related to wish lists.

## 5.41.0 <span className="changelog-date">(2019-08-11)</span>

* Wish lists now support (optional) title and description.
* New header design. Your accounts are now in the menu.
* Ghosts have labels explaining where they are useful.
* Recoil direction stat is shown as a semicircular range of where shots may travel.
* Search boxes on item picker sheets now autofocus.
* Item counts will properly update when moving partial stacks of stacked items.
* Fix a case where the search autocompleter could hang around.

## 5.40.0 <span className="changelog-date">(2019-08-04)</span>

* Fixed auto-scrolling links in Safari.
* Added the ability to lock items from the Compare tool.
* Add Solstice of Heroes to the Progress page.
* Show Special Orders under the Postmaster.
* Add a splash screen for the iOS app. You may have to delete the icon and re-add it.

## 5.39.0 <span className="changelog-date">(2019-07-28)</span>

* Enabled PWA mode for "Add to Homescreen" in iOS Safari (Requires iOS 12.2 or later). If you already have it on your home screen, delete and re-add it.
* Show the amount of materials you have that Spider is selling for exchange on his vendor page.
* Updates to support Cross Save. The account menu now shows icons instead of text, and can support accounts that are linked to more than one platform.
* Fixed valor resets not showing correctly.

## 5.38.0 <span className="changelog-date">(2019-07-21)</span>

* Add source:calus to highlight weapons which give "Calus-themed armor and weapons" credit in activities.
* Moved search help to an in-screen popup instead of a separate page.
* Added rank resets for the current season to ranks display.
* You can now swipe between characters anywhere in the page on the Progress and Vendors pages.
* Properly invert stat filters when they are prefixed with -.

## 5.37.1 <span className="changelog-date">(2019-07-16)</span>

* Don't show the "not supported" banner for MS Edge.

## 5.37.0 <span className="changelog-date">(2019-07-14)</span>

* Updated progress page pursuits to match in-game styling.
* Updated our shop link to point to our new store with DIM logo clothing and mugs.
* The Weekly Clan Engrams milestone will hide when all rewards have been redeemed.
* Moved raids below quests.
* Pursuits in the progress page now show exact progress numbers if the pursuit only has a single progress bar.
* Show tracked Triumph.
* Mark a wider variety of Chrome-based browsers as supported.
* Added Seals and Badges to Triumphs/Collections.

## 5.36.2 <span className="changelog-date">(2019-07-11)</span>

* Fixed a crash viewing Bad Juju.
* Text search now also searches notes.
* Added new name: and description: searches.
* Subclasses no longer look masterworked.

## 5.36.1 <span className="changelog-date">(2019-07-09)</span>

* Fixed the app on Microsoft Edge.
* Fixed an issue where iOS could see the "Update DIM" message over and over without updating.

## 5.36.0 <span className="changelog-date">(2019-07-07)</span>

* Added raid info to the Progress page.
* Sort bounties and quests with expired at the end, tracked at the beginning.
* Use weapon icons in objective strings instead of text.
* Added perkname: search.
* Charge Time and Draw Time now compare correctly!
* Fixed: Classified items required some finesse.
* Updated is:modded to take into account for activity mods.
* Re-added is:curated as a filter for Bungie curated rolls.
* Bounty expiration timers are more compact.

## 5.35.0 <span className="changelog-date">(2019-06-30)</span>

* Removed is:curated as an alias for is:wishlist.

## 5.34.0 <span className="changelog-date">(2019-06-23)</span>

## 5.33.3 <span className="changelog-date">(2019-06-22)</span>

* Fixed failing to show progress bar for bounty steps.
* Removed inline Item Objectives from the Progress page.

## 5.33.2 <span className="changelog-date">(2019-06-21)</span>

* Fixed failing to show progress bar for bounty steps.

## 5.33.1 <span className="changelog-date">(2019-06-20)</span>

* Fixed issue with item cards and farming mode were under the St Jude overlay.

## 5.33.0 <span className="changelog-date">(2019-06-16)</span>

* The Progress page sports a new layout to help make sense of all the Pursuits we have to juggle. This is the first iteration of the new page - many improvements are still on their way!
* Fixed a bug where weapon mods were causing Banshee-44 wish list items to fail to highlight.
* Fixed a bug with expert mode wish lists and dealing with single digit item categories.
* CSV exports now include item sources. These match the DIM filter you can use to find the item.
* Include more items in the "filter to uncollected" search in Vendors.
* Added shader icons to the item details popup.

## 5.32.0 <span className="changelog-date">(2019-06-09)</span>

* Fixed a crash when expanding catalysts under the progress tab.

## 5.31.0 <span className="changelog-date">(2019-06-02)</span>

* Fix too-large item icons on mobile view in 3 column mode.
* Allow inventory to refresh in the Loadout Optimizer.
* Fix equipping loadouts directly from the Loadout Optimizer.
* Add icons to selected perks in Loadout Optimizer.

## 5.30.2 <span className="changelog-date">(2019-05-31)</span>

* Add St. Jude donation banner.

## 5.30.1 <span className="changelog-date">(2019-05-27)</span>

* Tweaked contrast on search bar.
* Added the ability to select multiple perks from the perk picker in Loadout Optimizer before closing the sheet. On desktop, the "Enter" key will accept your selection.

## 5.30.0 <span className="changelog-date">(2019-05-26)</span>

* Brand new Loadout Optimizer with tons of improvements and fixes.
* Redesigned search bar.
* Updated DIM logos.
* Added Escape hotkey to close open item details dialog.

## 5.29.0 <span className="changelog-date">(2019-05-19)</span>

* Items with notes now have a note icon on them.
* Fixed a bug where the hotkeys for tagging items broke if you clicked directly to another item.
* Removed a stray curly brace character from the item reviews on the item popup.

## 5.28.0 <span className="changelog-date">(2019-05-12)</span>

## 5.27.0 <span className="changelog-date">(2019-05-05)</span>

* Added a link to the About page to see the history of all actions made by DIM or other Destiny apps.
* The navigation menu better respects iPhone X screens.
* Stat values are now shown in the tooltip for perks. They might not be totally accurate...
* Added a hotkey (m) for toggling the menu.

## 5.26.0 <span className="changelog-date">(2019-04-28)</span>

* Restored missing collectibles.

## 5.25.0 <span className="changelog-date">(2019-04-21)</span>

* A redesigned Vendors page is easier to navigate, and includes a feature to show only those items you are missing from your collections. Searching on the vendors page also now searches the vendor names, and hides items that don't match the search.
* Loadout Optimizer on mobile lets you swipe between characters instead of wasting space showing all three at once.
* Xur has been removed from the Progress page.
* Reputation materials for a vendor's faction are now included in the Vendor page.
* Fixed a bug where DIM would cache a lot of data that wasn't needed.

## 5.24.0 <span className="changelog-date">(2019-04-14)</span>

* Progress page changes to utilize more screen real-estate.

## 5.23.2 <span className="changelog-date">(2019-04-09)</span>

* Fix Edge issues.

## 5.23.1 <span className="changelog-date">(2019-04-08)</span>

* Fixed some crashes.

## 5.23.0 <span className="changelog-date">(2019-04-07)</span>

* Loaded Wish Lists now persist between reloads, and will highlight new items as you get them. Use Wish Lists from expert players to find great items!
* Fix an issue where pulling consumables from the postmaster on characters other than the current one could lock up the browser.
* The compare tool's Archetypes feature will now use the intrinsic perk of the item rather than solely relying on the RPM.
* Item sort presets have been removed - you can choose your own sorting preferences by dragging and dropping sorting properties.
* Fixed reloading the page while on the Vendors tab.
* Fix search for blast radius (it was accidentally mapped to velocity).
* The Loadout Optimizer's perk search now updates when you change characters.
* Removed the option to pull from the postmaster into the vault when an item can't be pulled from postmaster at all.
* Removed the (broken) option to split a stack by hovering over the drop target.

## 5.22.0 <span className="changelog-date">(2019-04-01)</span>

* Fix item ratings.
* Fix missing loadouts on PC.

## 5.21.0 <span className="changelog-date">(2019-03-31)</span>

* You can now swipe between pages on the item popup.
* Fixed a bug where reviews failing to load would result in an infinite refresh spinner.
* Actually fixed the bug where Pull from Postmaster with full modulus reports would move all your other consumables to the vault.
* Ratings and reviews are now cached on your device for 24 hours, so they should load much faster after the first time.
* The ratings tab has a cleaned up design.
* All of the stat filters now show up in search autocomplete and the search help page.
* You can now move items from the postmaster directly to the vault or other characters.
* When adding all equipped items to a loadout, the class type for the loadout will be set to the class that can use the armor that's equipped.
* Fixed a rare bug where you could move an item while DIM was refreshing, and the item would pop back to its original location until the next refresh.
* Errors in the Loadout Optimizer now show on the page, instead of just freezing progress.
* Fixed the "Loadout Optimizer" button on the new Loadout editor.
* If you try to move an item in DIM that you've equipped in game but DIM doesn't know about, it'll now try to de-equip it to make it move, instead of throwing an error.


## 5.20.2 <span className="changelog-date">(2019-03-27)</span>

* Fixed Pull from Postmaster.

## 5.20.1 <span className="changelog-date">(2019-03-26)</span>

* Fixed: Pull from Postmaster better handling of unique stacks.
* The vendors page now highlights items that you have already unlocked in Collections.
* Don't try to move all your consumables to the vault if you add one to your loadout and check the "Move other items away" option.

## 5.20.0 <span className="changelog-date">(2019-03-24)</span>

* Items in the postmaster now count towards your max possible light.
* DIM now correctly calculates how much space you have free for items that can't have multiple stacks (like Modulus Reports). This makes pulling from postmaster more reliable.
* The loadout creator/editor has been redesigned to be easier to use. Select items directly from inside the loadout editor, with search. You can still click items in the inventory to add them as well.
* Loadouts can now use an option to move all the items that are not in the loadout to the vault when applying the loadout.
* Made it clearer when inventory and item popups are collapsed.
* The Loadout Optimizer is out of beta! Use it to automatically calculate loadouts that include certain perks or hit your targets for specific stats.

## 5.19.0 <span className="changelog-date">(2019-03-17)</span>

* Fixed: Export mobility value correctly in CSV export.

## 5.18.0 <span className="changelog-date">(2019-03-10)</span>

* Added: is:revelry search.
* Added: source:gambitprime search.
* Fixed engrams wrapping to a second row on mobile in 3-column mode.

## 5.17.0 <span className="changelog-date">(2019-03-03)</span>

* Add stat:handling as a synonym for stat:equipspeed, to match the name shown in displays.
* Remove Exotic Ornaments from Loadout Builder
* Fixed: 'NaN' could appear in Item Popup in certain situations.

## 5.16.0 <span className="changelog-date">(2019-02-24)</span>

## 5.15.0 <span className="changelog-date">(2019-02-17)</span>

* Remember the last direction the infusion fuel finder was left in.
* Remember the last option (equip or store) the "pull item" tool was left in.
* Updated notification style. You can still click the notification to dismiss it.
* Search filter will now show button to add matching filtered items to compare (if they're comparable)

## 5.14.0 <span className="changelog-date">(2019-02-10)</span>

## 5.13.0 <span className="changelog-date">(2019-02-03)</span>

* Fixed search queries that include the word "and".
* Updated inventory style to reduce the visual impact of category headers.
* Added is:reacquirable to show items that can potentially be pulled from your Collection
* Redesigned infusion fuel finder to work better on mobile, and support search filtering.

## 5.12.0 <span className="changelog-date">(2019-01-27)</span>

## 5.11.0 <span className="changelog-date">(2019-01-20)</span>

## 5.10.0 <span className="changelog-date">(2019-01-13)</span>

* Move Random Loadout into the Loadout menu and add a "Random Weapons Only" option.
* Restyle the alternate options in the loadout menu.
* Removed the quick consolidate buttons and engram counter from D1 farming mode.
* Remove the setting to "Show full item details in the item popup". DIM now just remembers the last state of the popup, and you can expand/collapse with the arrow in the top right corner of the popup.
* Fix showing which perks are highly rated by the community.
* Fix for getting stuck on the reviews tab when clicking on items that can't be reviewed.
* Fix highlighting of subclass perks.
* Add source:blackarmory & source:scourge.
* Fix CSV to always include the masterwork column.
* Add id: and hash: searches.
* Improve the performance of the notes field and fix a bug where sometimes a note from another item would show up.
* Fix some cases where the manifest wouldn't load.
* Fix crash when searching is:inloadout with no loadouts.

## 5.9.0 <span className="changelog-date">(2019-01-06)</span>

* Click the plus icon under an equipped item to search for and transfer items in that slot from anywhere in your inventory.
* Import a CSV file of items with tags and notes to bulk update the tags/notes for all of those items.
* CSV - Wrap ID in quotes such that its value is not rounded.

## 5.8.3 <span className="changelog-date">(2019-01-02)</span>

* More fixes to popup swiping on Android.
* Fix perk searching in non-latin languages.
* Added a key for the ratings symbols.

## 5.8.2 <span className="changelog-date">(2019-01-01)</span>

* Make it easier to swipe away the item popup on Android.

## 5.8.1 <span className="changelog-date">(2018-12-31)</span>

* Fix a bug where some Android phones couldn't see weapon details.
* Fix a bug where the wrong item's details would show up in the item popup.
* Show "Make Room for Postmaster" if there's anything in the postmaster, not just if there's pullable items.

## 5.8.0 <span className="changelog-date">(2018-12-30)</span>

* Add the option to sort inventory by tag in custom sort options.
* No longer showing community ratings for ornaments/catalysts.
* Fixed a long-standing bug where you couldn't transfer some stacks to a full inventory.
* Item popup is nicer on mobile.
* Wider item popups on desktop.
* Larger buttons for transfers.
* Wish lists allow you to create and import lists of items or perks that will be highlighted in your inventory.
* Dropped support for iOS 10.
* Prevent the vault from getting really narrow, at the expense of some scrolling.
* Armor in the vault is now organized by class, in the same order as your characters.
* Disabled pull-to-reload on Android.
* Improved treatment of expert mode wish list items.
* Fixed perk searches to keep the whole search term together, so "machine gun reserves" won't match "machine gun scavenger" anymore.

## 5.7.0 <span className="changelog-date">(2018-12-23)</span>

* Show kill trackers for items with in-progress masterwork catalysts.
* You can specify item categories to be specific about your expert wish list items.
* Hide ratings on items with fewer than 3 reviews.
* Fix some DIM functionality in the Edge browser.

## 5.6.0 <span className="changelog-date">(2018-12-17)</span>

* Updated Crucible and Gambit ranks to reflect new multi-stage ranks.
* DIM loads faster and uses less memory.
* Ratings are now displayed on item tiles as an icon indicating whether they are perfect rolls (star), good (arrow up), neutral (dash), or bad (arrow down). The exact rating is still available in the item popup.
* The mobile view now defaults to 4 items across (5 including equipped), which fits more on the screen at once. You can still choose other display options in Settings.
* Masterwork info is now included in the CSV exports.
* Added season info for Dawning items.
* Include non-selected perk options while searching perks.
* Load the new Simplified Chinese Destiny database when that language is selected.
* Show a warning when perks/mods are missing because of a Bungie.net deployment.

## 5.5.2 <span className="changelog-date">(2018-12-10)</span>

* Changed search behavior of perk:. It now tries to match the start of all words.
* Added "expert mode" for more complex wish list expressions.
* Allow selecting text on the progress page.
* Some redacted items now have a picture and some description, pulled from their collection record.

## 5.5.1 <span className="changelog-date">(2018-12-09)</span>

* Fixed display of stackables badges in D1.

## 5.5.0 <span className="changelog-date">(2018-12-09)</span>

* New items, when enabled, now show a red dot instead of an animated shine.
* Fixed center column emblem color on Safari.
* Loadout and compare popups now use a draggable "Sheet" UI.

## 5.4.0 <span className="changelog-date">(2018-12-02)</span>

* Moved is:yearX and is:seasonX searches to year:# and season:#.
* Fixed a bug where Inventory would not appear on mobile for non-current characters.
* On mobile, the search box is now full-width.
* Unopened engrams are shown in a small row similar to how they appear in-game, instead of looking like they are in the postmaster.
* Engrams no longer appear to be pullable from the postmaster.
* Shaders are now sorted by whats defined in the settings.
* Fixed the display of tag dropdowns.
* Support simplified Chinese (for DIM text only - Destiny items are still in Traditional).
* New loading animation.
* New look for the Vault tile.
* Light cap raised to 650 for Season of the Forge.

## 5.3.2 <span className="changelog-date">(2018-11-27)</span>

* Fix crash on Progress page caused by redacted Triumphs.
* Fix URL not updating while navigating.
* Fix display of faction levels.
* Fix The Drifter showing an error because of a redacted item.
* Fix a case where the Google Drive data file would not be created.
* Prevent moving partial stacks of Ghost Fragments, because that doesn't work.
* Fix display of vendor checkmark.
* Fix horizontal scrolling slop on the mobile header.

## 5.3.1 <span className="changelog-date">(2018-11-26)</span>

* Fix some settings that weren't quite working right.

## 5.3.0 <span className="changelog-date">(2018-11-25)</span>

* Remove the ability to set a specific vault width. Vault always takes all remaining space.
* Inventory columns are shaded to match the equipped emblem.
* DIM has been darkened to provide better contrast with the items.
* Fit and finish changes to the new tiles and inventory display.
* Add id and hash column to exported csv for ghosts, armor, and weapons.
* Add event and season column to exported csv for Destiny 2.
* D2 subclasses now show which path, grenade, etc. are chosen.

## 5.2.1 <span className="changelog-date">(2018-11-20)</span>

* Fix comparing masterworks

## 5.2.0 <span className="changelog-date">(2018-11-20)</span>

* New item tiles that show more information and don't hide the picture.
* Updated storage settings to show Google Drive usage and signed in user.
* New D1 Vendors page that resembles the D2 Vendors page.

## 5.1.0 <span className="changelog-date">(2018-11-18)</span>

* Fix display of exotic catalysts in the item popup.
* Restore kill tracker for all items.
* Loadouts now sort by type then name.
* Global loadouts are now indicated by a globe icon in the LoadoutPopup.
* Loadouts of the same type can no longer have a clashing name.
* Add count: filters to search for items you have a certain number (or more or less) of. i.e. count:>3 to find all your Edge Transits.
* Improve display of your Ranks.
* Show progress towards completing cache keys.
* Work around a memory leak bug in MS Edge.
* Update titles on item popups to display closer to what's in game.
* Added community curations (a way to look for god rolls).
