## Next

* When you have 10 or more loadouts, a search box will appear in the Inventory page loadout dropdown, allowing you to search names just like on the Loadouts page.
* Old loadouts with void subclasses in them will upgrade automatically to the new version with fragments and aspects, instead of telling you the loadout is missing an item.
* Removed D2Gunsmith link from the item details popup while they work on revamping the site for all the new changes.
* The Item Feed is available on both desktop and mobile. It shows your gear in the order it dropped, and gives you quick controls to tag incoming loot. Click on the item tile to get the full item popup.
  * Item Feed also got better at identifying relevant weapon perks.
  * Tagging an item from the Item Feed also marks it as not-new.
* Added `deepsight:complete` and `deepsight:incomplete` filters.
* Added `is:craftable` filter.
* Loadout Optimizer Mod picker will now correctly update when switching between mod slots without closing Mod Picker.

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

## 6.99.1 <span class="changelog-date">(2022-01-10)</span>

* The Loadouts page is a bit cleaner and more compact in the mobile view.
* You can once again click within the Compare sheet to close an item popup.
* Loadouts don't fail when they contain an ornament that can't be slotted into the current armor.
* Sharing loadout builds includes fashion.

## 6.99.0 <span class="changelog-date">(2022-01-09)</span>

* You can now add Fashion (shaders and ornaments) to loadouts. Creating a loadout from equipped automatically adds in the current shaders and ornaments, and you can edit them manually from the Loadouts editor.
* Fixed an issue where the progress bar for exotic weapons were clipping into other page elements.
* Fixed an issue that could make moving searches containing stacks of items to fail.
* Added Spoils of Conquest to the currencies hover menu.
* Fixed an issue where the Loadout Optimizer would let you pin items from other classes.
* Fixed an issue where the universal ornament picker would show too many ornaments as unlocked.
* Shader picker now hides unavailable, unobtainable shaders.
* "Preview Artifact Contents" in artifact popup now shows unlocked mods from the perspective of the owning character, not the current character.
* Creating a loadout now defaults the class to whichever character you had selected.

## 6.98.0 <span class="changelog-date">(2022-01-02)</span>

* Consumables can now be pulled from postmasters other than the active character's.
* Vendors page now correctly recognizes owned bounties per character and is more accurate about mods ownership.
* Fixed an issue that could make moving searches containing stacks of items to fail.
* Fixes for display on iPhones with rounded corners and a notch.
* Transmog Ornaments menu now correctly shows whether ornament has been unlocked or not.
* Happy New Year

## 6.97.3 <span class="changelog-date">(2021-12-30)</span>

* Fixed an issue for some users where Stasis Aspects were not shown when selecting Stasis subclass options.
  * This works around a Bungie API issue, and will allow users to select and try equipping Stasis Aspects they have not unlocked, which may result in failures applying loadouts, if the aspects are not unlocked.

## 6.97.2 <span class="changelog-date">(2021-12-30)</span>

* Improved the press-to-view tooltips on mobile. It should now be much easier to select perks on mobile.
* Removed notification when loading/updating a wish list. Go to the wish list section of the settings menu if you want to see details.
* The progress notification for applying a loadout now shows each item and mod as it's being applied.
* Mod picker now correctly names inserted thing (e.g Fragment, Shader).
* Dares of Eternity now shows streak information under Progress > Ranks
* Ignore outdated/removed artifact mods still attached to armor.
* You can now select Stasis subclasses in the Loadout Optimizer and use the stat effects from fragments.
* When determining mod assignments, DIM will now consider in game mod placement and attempt to use the same position if possible.
* Tracked Triumphs are now grouped together with similar records.
* Starting the Compare view from a single armor piece now includes other elements in initial comparison.
* Inventory items can now be sorted by Element.
* Prevent plugging some invalid ornaments.

## 6.97.1 <span class="changelog-date">(2021-12-26)</span>

* Transmog Ornaments menu once again *incorrectly* shows whether an ornament has been unlocked or not, but fixed a bug where an artifact mod, once slotted on your active gear, would show up as not unlocked.

## 6.97.0 <span class="changelog-date">(2021-12-26)</span>

* Transmog Ornaments menu now correctly shows whether ornament has been unlocked or not.
* The stat bars shown in Compare are more accurately sized, relative to each other.
* Fix an issue where mods might get plugged in too fast and bump into the armor's max Energy.
* Update some error messages for when equipping items fails.
* Added new filter `is:stackfull` to show items that are at max stack size.
* Searching by perk now works on languages that use accented characters.
* Tooltips for Mods, Fragments, Aspects, etc. now show information about their type.
* Fix Subclasses sometimes showing a progress badge on their icon.
* Fix cases where an item might inappropriately show with a wishlist thumbs-up.
* Loadouts/Loadout Optimizer
  * When re-Optimizing a loadout, the Loadout Optimizer's Compare button will now initially select the original loadout from the loadout page.
  * If you open an existing loadout in Loadout Optimizer and the loadout has an exotic equipped, that exotic will be pre-selected in the LO settings.
  * Armor set stats in Loadout Optimizer or Loadout Details will now show stat tiers exceeding T10 or going below T0.
  * Radiant Light and Powerful Friends' activation conditions will now be accounted for when showing mod placements and applying mods to a loadout. If possible they will be assigned to an item so that their conditional perks are active.
  * The option to view Mod Assignments for a loadout is now available outside of Beta.
  * Loadout notes now retain whitespace formatting.
  * On the Loadouts page, missing items show up dimmed-out instead of not at all.
  * The Loadouts page can be filtered from the search bar in the header.
  * Selecting toggleable subclass abilities like jumps and grenades now works more smoothly.
  * Fixed an error when applying mod loadouts to armor too old to have mod energy.

### Beta Only

* We're trying out a new tool for the desktop inventory screen called "Item Feed". Click the tab on the right to pop out a feed of your item drops with quick buttons to tag them. By default tagged items disappear from the view so you can focus on new stuff.

## 6.96.0 <span class="changelog-date">(2021-12-19)</span>

* Loadouts now show correct stats for subclass, item, and mod selections. All mods are accounted for whether they actually will fit or not.
* Equipping a generated loadout in the Loadout Optimizer will now apply the selected mods.
* Improved the time taken to apply a loadout with mods.
* Stasis subclass can also be applied in the Loadouts page.
* Fixed showing the amount of Dawning Spirit in the holiday oven popup.
* Add energy bar displays to the Mod Assignments view.
* Fixed the 5th slot on Artifice Armor not showing up in Loadout Optimizer if no mod was plugged in.

## 6.95.1 <span class="changelog-date">(2021-12-14)</span>

* Fixed issue where selecting mods from the Mod Picker, opened from an item socket, would clear other mod selections.
* Added the ability to favorite finishers

## 6.95.0 <span class="changelog-date">(2021-12-12)</span>

* Fix image paths for D1 perks.
* Strange Favor rank now correctly shows remaining reset count, when you hover the icon.
* Ability Cooldown times are no longer shown for stat tooltips. This may return but at the moment, they were incorrect.
* Added 'source:30th' for items coming from the Bungie 30th Anniversary.

### Loadouts
* Stasis subclass abilities, aspects, and fragments are now displayed in the loadouts page.
* When displaying mod placement in Loadouts, if an armor slot has no item in the loadout, the character's current armor piece will be used.
* Removed the "Max Power" loadout from the loadouts page. You can still apply it from the loadout menu on the inventory screen.
* If loadouts have notes, those notes are now displayed in the hover text on the loadout dropdown
* Artifice Armor mod slots are now handled in Loadouts and the Loadout Optimizer.
* Hitting +Equipped in the loadout editor will add current mods.
* Creating a new loadout from equipped items will also save your subclass configuration.
* Creating a new loadout from equipped, or hitting +Equipped in the loadout editor, will now also include your current emblem, ship, and sparrow.
* Added more visual distinction between loadouts on the loadouts page.
* Some repeat text and unnecessary instructions were removed from mods and Stasis Fragments, in the mod picker.

### Loadout Optimizer
* Fix an error that can occur when loading a shared build link.
* Fix issue where Optimizer throws an error when selecting a raid or combat mod.
* Fix an issue where energy swaps in the Optimizer where not displaying the correct resulting energy.

### Mod Plugging Capabilities
* Bungie has enabled the API capabilities to apply armor mods, toggle weapon perks, and perform other plugging-in type operations. So now you can take advantage of these features of DIM!
  * This works from the item popup, and when applying loadouts that contain mods.
  * DIM can apply weapon perks, armor mods, shaders, weapon & exotic ornaments, and Stasis Aspects and Fragments.
  * It cannot apply weapon mods, which still cost glimmer in the game.
  * It can't yet apply transmog/Synthesis ornaments, but Bungie is working on addressing this.
  * Swapping Stasis aspects & fragments via loadouts is coming soon.

### Mods in Loadouts
* When you apply a loadout with armor mods, DIM will automatically assign these among armor pieces.
* If there's no armor in the loadout, it will apply these mods to your character's current pieces.
* More specific/custom placement options are in the works.
* DIM will not clear off existing mods except to make room for requested ones.

### Plugging-Related Fixes
* Fix a bug that prevented applying shaders or ornaments from the item popup.
* Fix emblems and subclasses not applying from loadouts.
* The mod picker launched from the item popup or Loadout Optimizer will now correctly show the mods unlocked by the applicable character, rather than across all characters. This helps a lot with artifact mods where you may have different ones unlocked on different characters. Note that this also means opening the mod picker for items in the vault will show no artifact mods unlocked - move the item to a character if you want to apply that mod.
* Vendor items no longer offer to apply perks.

## 6.94.0 <span class="changelog-date">(2021-12-05)</span>

* You can change perks and slot zero-cost mods from the item Popup.
* Loadouts can now apply mods. See [Mods in Loadouts](https://destinyitemmanager.fandom.com/wiki/Mods_in_Loadouts) for details. Some things to keep in mind:
  * This will not work until the 30th Anniversary patch.
  * Applying mods will also strip off any mods that aren't in your loadout from your equipped armor.
  * Mods will be placed on your equipped armor whether that armor came from your loadout or not.
* Loadouts can now have notes.
* Share loadout build settings (mods, notes, loadout optimizer settings) from the Loadouts page.
* Loadouts can now save stasis subclass abilities, aspects, and fragments. These do not yet get applied when applying a loadout.
* We made several bugfixes to how loadouts are applied that should fix some issues where not all items got equipped or failures were shown when nothing failed.
* The "Create Loadout" button on the Loadouts page defaults the loadout to match the class of the selected character.
* The menu for pinning or excluding an item in Loadout Optimizer now only shows items that match the overall search filter.
* Stat searches support keywords like "highest" and "secondhighest" in stat total/mean expressions. e.g. basestat:highest&secondhighest:>=17.5

## 6.93.0 <span class="changelog-date">(2021-11-28)</span>

* Steam browser is officially unsupported, and we now show a banner explaining that.
* However, we have managed to fix DIM so it doesn't crash loop in the Steam overlay. Until the next time Steam updates...
* Loadout Optimizer performance has been improved significantly - so much so that we now always look at all possible combinations of armor. Previously we trimmed some items out to get below an a number that we could process in time. This means that your LO builds are now guaranteed to be optimal, and the "Max" range shown in the stat tiles will always be accurate.
* We no longer cap stats in the Loadout Optimizer's tooltips so you can see how far over 100 a stat goes.
* Fixed a bug where Loadout Optimizer would only show one set.
* Cryptolith Lure and Firewall Data Fragment have been moved from "Quests" to "Quest Items".
* We've launched a new Loadouts page that makes it easy to browse through your loadouts. The Loadout Optimizer is accessible from that page. Also, loadouts are now by default sorted by when they were last edited, rather than their name. You can change this on the Loadouts page or in settings.
* Some perks in the Armory view that showed as not rolling on the current version of an item now correctly show that they can roll.

## 6.92.1 <span class="changelog-date">(2021-11-23)</span>

* Fixed "Optimize Armor" button (formerly "Open in Loadout Optimizer") in the loadout drawer.

## 6.92.0 <span class="changelog-date">(2021-11-21)</span>

* Show bars next to armor stats in Compare.
* At long last, found and fixed a bug that could lead to tags and notes getting wiped if you switched accounts while another account's data was loading. Many apologies to anyone who lost their tags and notes from this bug, and we hope it's gone for good.
* Remove bright engram rewards from prestige season pass rewards as these were guesses and not quite right.

### Beta Only

* We're testing out a new Loadouts page that makes it easy to browse through your loadouts. The Loadout Optimizer is accessible from that page. Also, loadouts are now by default sorted by when they were last edited, rather than their name. You can change this on the Loadouts page or in settings. Let us know what you think, and how it can be made more useful!

## 6.91.2 <span class="changelog-date">(2021-11-16)</span>

* Put back the full item tile in Compare.

## 6.91.1 <span class="changelog-date">(2021-11-16)</span>

* Fix issue in Loadout Optimizer where only one set would show when using Safari or iOS apps.

## 6.91.0 <span class="changelog-date">(2021-11-14)</span>

* The link to D2Gunsmith from the Armory view is now shown on mobile.
* Currency counts won't get squished anymore
* Simplified item tiles in the Compare view since a lot of the tile info was redundant.

## 6.90.1 <span class="changelog-date">(2021-11-08)</span>

* Mod costs now show in Firefox.
* Fixed search transfer not moving items that aren't equippable on the selected character.

## 6.90.0 <span class="changelog-date">(2021-11-07)</span>

* If a loadout has items for multiple character classes in it, applying it to a character behaves as if only the items that can be equipped on that character are in the loadout.
* Fixed an issue where the Loadout Optimizer would allow masterworked items to have their energy changed when using the Ascendant Shard (not exotic) armor upgrade option.
* Fixed an issue where clicking a mod icon in the Loadout Optimizer would select more than one of the mod.

## 6.89.0 <span class="changelog-date">(2021-10-31)</span>

## 6.88.1 <span class="changelog-date">(2021-10-28)</span>

* `modslot:activity` now identifies Armor 2.0 items that have a modslot related to an activity (currently, a raid or a Nightmare mod slot).
* Fix an issue where an invalid query is passed to the Loadout Optimizer when you click a mod socket.

### Beta Only

* Loadouts can now show you an assignment strategy for mods. It optimizes for the least number of unassigned mods.

## 6.88.0 <span class="changelog-date">(2021-10-24)</span>

* DIM will now display Shaders if they were leftover in your Vault after the transmog conversion.
* The item popup has a toggle to choose between list-style perks (easier to read!) and grid-style perks (matches in game). No, we will not add an option to change the order of the list-style perks.
* List-style perks in the item popup have a hover tooltip on desktop so you don't have to click them if you don't want to.
* The item popup has a button to select all the wishlisted perks if they aren't already the active perks, so you can preview the wishlisted version of the item quickly.
* Added a "is:statlower" search that shows armor that has strictly worse stats than another piece of armor of the same type. This does not take into account special mod slots, element, or masterworked-ness. "is:customstatlower" is the same thing but only pays attention to the stats in each class' custom total stat.
* Stat bars now correctly subtract the value of mods from the base segment.

## 6.87.0 <span class="changelog-date">(2021-10-17)</span>

* Moved "Tracked Triumphs" section to the top of the Progress page.
* You can now track and untrack Seasonal Challenges from the Progress page.
* Loadout Optimizer now correctly handles nightmare mods.
* Loadout Optimizer makes a better attempt at assigning mods to compared loadouts.
* Added `is:infusionfodder` search to show items where a lower-power version of the same item exists. Use `tag:junk is:infusionfodder` to check your trash for its potential to infuse!
* Loadout Optimizer will warn you if you try to load a build that's for a character class you don't have.
* If your D1 account had disappeared from DIM, it's back now.
* Aeon exotic armor pieces now show mod slots again.
* In Loadout Optimizer, the Select Exotic menu now lets you select "No Exotic" and "Any Exotic". "No Exotic" is the same as searching "not:exotic" before, and "Any Exotic" makes sure each set has an exotic, but doesn't care which one.

## 6.86.0 <span class="changelog-date">(2021-10-10)</span>

* Clicking a perk in the item popup now previews the stat changes from switching to that perk.
* Clicking a perk in the Organizer view also previews the stats for that perk.
* Changes to the Armory view (bring up Armory by clicking an item's name in the item popup):
  * Armory highlights which perks cannot roll on new copies of the weapon.
  * Armory highlights the perks rolled on the item you clicked.
  * Clicking other perk option previews their stat effects.
  * You can click the "DIM" link to open the item info on its own, and share a roll with others.
  * Clicking modslots lets you change mods.
  * Selecting different ornaments shows what the ornament looks like on the item.
  * Added a link to D2 Gunsmith for weapons.
* Inventory screen can now be sorted by whether an item is masterworked. Check [Settings](/settings) to view and rearrange your sort strategy.
* Loadout Optimizer shows an estimate of how long it'll take to complete finding sets.
* DIM shouldn't bounce you to your D1 account when Bungie.net is having issues anymore.
* `is:maxpower` search now shows all the items at maximum power, instead of just the items that are part of your maximum power loadout. The previous meaning has been moved to `is:maxpowerloadout`. Keep in mind that because of exotics, you may not be able to equip all your max power items at once.

### Beta Only

* Loadout Optimizer now shows the maximum stat tier you can get for each stat, taking into account all of your loadout settings including min/max stats, mods, and search filter. We're still not sure of the best way to display this, so it's in Beta only for now to get some feedback.
* We've tweaked the way Loadout Optimizer chooses which subset of items to look at when you have too many items to process. We should be better at making use of items that have "spiky" stats.


## 6.85.0 <span class="changelog-date">(2021-10-03)</span>

* Postmaster and Engrams should be sorted exactly like in game now.
* Loadout Optimizer no longer saves stat min/max settings as the default for the next time you use it. Opening an existing loadout in the Optimizer will still reload the min/max settings for that loadout.
* We won't automatically refresh your inventory when you're on the Loadout Optimizer screen anymore - click the refresh button or hit R to recalculate sets with your latest items.
* The "Perks, Mods & Shaders" column in Organizer no longer shows the Kill Tracker socket.
* The Recoil Direction stat now sorts and highlights differently in both Compare and Organizer - the best recoil is now straight up, and recoil that goes side to side is worse.
* Farming mode can now be configured in settings to clear a preferred number of slots (1-9)

## 6.84.0 <span class="changelog-date">(2021-09-26)</span>

* Items in the Compare view no longer move around according to the character they're on.
* Fixed an issue where the Loadout Optimizer would not load due to deprecated settings.
* Hovering over stat tiers in the Loadout Optimizer's compare drawer now shows stat tier effects for the new set too.

## 6.83.0 <span class="changelog-date">(2021-09-19)</span>

* Still adjusting to Stasis... `is:kineticslot` now identifies items which are in the "Kinetic" slot (the top weapon slot) but aren't Kinetic type damage.
* Loadout Optimizer finds better mod assignments.
* Engram power level is now also shown on hover.
* Clicking on the title of an item now brings up a new item detail page which shows all possible perks and wishlist rolls.
* Note that D1 items no longer have a link at all. We're not adding D1 features anymore.
* Random-roll items in Collections now show all the perk possibilities they could roll with.
* Armor in Collections now shows what mod slots it has.
* Fixed vendor items showing some incorrect wishlist matches.

### Beta Only

* Removed the press-and-hold mobile item menu, which saw very limited use. This will also be removed in the release version after some time.
* Removed the "Active Mode" experiment - its ideas will come back in the future in other forms, but for now it doesn't offer enough above the Progress page (which can be opened in another tab/window next to Inventory if you want to see both).

## 6.82.0 <span class="changelog-date">(2021-09-12)</span>

* Loadout Optimizer remembers stats you've Ignored between sessions.
* Opening a saved loadout in Loadout Optimizer restores all the mods and other settings from when it was originally created.
* Share your Loadout Optimizer build - the new share button copies a link to all your build settings. Share great mod combos with other DIM users!
* Fixed issue in Loadout Optimizer where locking energy type didn't work for slot specific mods.
* Clicking on an item's picture in the Compare tool now opens the full item popup.
* Added a "pull" button (down-arrow) to each item in the Compare tool that will pull the item to your current character.
* Collapsed the Tag menu into an icon in Compare to allow more items to fit on screen.
* Shortened the names of stats in Compare to allow more items to fit on screen.
* Added hover titles to the new compare buttons for more clarity.
* Selecting "Add Unequipped" in the loadout editor no longer tries to equip all your unequipped items.
* Progress win streak will now correctly display when a user hits a 5 win streak.
* Fixed broken description for some new triumphs.
* Loadout Optimizer's exotic picker now consistently orders slots.
* Loadout Optimizer's stat filters no longer attempt to automatically limit to possible ranges.
* Added numerical faction ranks alongside rank names on the Progress page.
* Fixed the order of items in vendors and seasonal vendor upgrade grids.
* Seasonal artifact display now matches the games display.
* Ritual rank progress for vendors now matches the ritual rank circle shape.
* Fixed vendor ranks being off by 1.
* Accounts list shows your Bungie Name.
* Add a tip for how to scroll Compare on iOS.

## 6.81.0 <span class="changelog-date">(2021-09-05)</span>

* Fixed wonky rank display in the phone portrait layout.
* Elemental Capacitor stats are no longer added to weapons with the perk enabled.
* In the Loadout Optimizer, searching items now works in conjunction with locking exotics and items.
* Added `is:currentclass` filter, which selects items currently equippable on the logged in guardian.
* Fixed armor swaps away from Stasis in Loadout Optimizer.
* Added a warning indicator to previously created loadouts that are now missing items.

## 6.80.0 <span class="changelog-date">(2021-08-29)</span>

* Fix sorting by power and energy in Compare when "Show Base Stats" is enabled.
* Fixed misalignment in stat rows, and vertical scrolling, in Compare.
* Highlighting stats in Compare is faster.
* You can click any perk in Compare, not just the first couple.
* Clicking an item's name to find it in the inventory view will now change character on mobile to wherever the item is.
* In Compare for D1, fixed an issue where you could only see the first 2 perk options.
* Mods can be saved and viewed in Loadouts - this is automatic for loadouts created by Loadout Optimizer but you can edit the mods directly in the loadout editor.
* Search results can be shown in their own popup sheet now (this shows by default on mobile)
* There is now a helpful banner prompt to install the app on mobile.
* When the postmaster is near full, a banner will warn you even if you're not on the inventory screen.
* Artifact XP progress is now displayed for the correct season.
* Rearranged the search buttons so the menu icon never moves.
* Ranks for Vanguard and Trials are now shown in the Progress page.
* Changed the icons in the Vendors menu.
* Added Parallax Trajectory to the currencies hover menu.

## 6.79.1 <span class="changelog-date">(2021-08-25)</span>

* Legacy mods are no longer selectable in the Loadout Optimizer.

## 6.79.0 <span class="changelog-date">(2021-08-22)</span>

## 6.78.0 <span class="changelog-date">(2021-08-15)</span>

* Armor in the Organizer no longer displays the now-standard Combat Mod Slot

## 6.77.0 <span class="changelog-date">(2021-08-08)</span>

* Timelost weapons now include their additional Level 10 Masterwork stats.

## 6.76.0 <span class="changelog-date">(2021-08-01)</span>

* Legendary Marks and Silver once again appear in the D1 inventory view.
* Tap/hover the Artifact power level in the header, to check XP progress towards the next level.
* When you install DIM on your desktop or home screen, it will now be badged with the number of postmaster items on the current character. You can disable this from Settings. This won't work on iOS.

## 6.75.0 <span class="changelog-date">(2021-07-25)</span>

* When opening Compare for a Timelost weapon, we now also include non-Timelost versions of that weapon.
* Display the energy swap or upgrade details for items in the Optimizer.
* Optimizer is now better at matching a set to an existing loadout.
* Compare will properly close (and not just become invisible) if all the items you're comparing are deleted.
* Fixed the search actions (three dots) menu not appearing in Safari.

## 6.74.0 <span class="changelog-date">(2021-07-18)</span>

* Added the option to lock item element in the Optimizer's armor upgrade menu.
* Not be broken
* Fix issue with Optimizer crashing when socket data is not available.
* Invalid search queries are greyed out, and the save search star is hidden.
* Favour higher energy and equipped items for grouped items in the Optimizer. This will mainly be noticed by the shown class item.
* Adding unequipped items to a loadout no longer also adds items from the Postmaster.

### Beta Only

* The Search Results drawer is back in beta, ready for some more feedback. On mobile it shows up whenever you search, on desktop you can either click the icon or hit "Enter" in the search bar. Try clicking on items in the search results drawer - or even dragging them to characters!

## 6.73.0 <span class="changelog-date">(2021-07-11)</span>

* Solstice of Heroes pursuit list now shows the full description of the objectives, not just the checkboxes.
* Recent searches are now capped at 300 searches, down from 500.
* Armor synthesis materials are no longer shown in the currencies block under the vault.

## 6.72.1 <span class="changelog-date">(2021-07-06)</span>

* Solstice of Heroes is back and so is the **Solstice of Heroes** section of the **Progress** tab. Check it out and view your progress toward upgrading armor.

## 6.72.0 <span class="changelog-date">(2021-07-04)</span>

* Fixed issue with locked mod stats not being applied to a compared loadouts in the Optimizer.

## 6.71.0 <span class="changelog-date">(2021-06-27)</span>

* Armor 1 exotics are visible in the exotic picker, albeit unselectable.
* Default to similar loadout as comparison base in Loadout Optimizer.
* Armor upgrades in the Optimizer have full descriptions of their functionality. Added Ascendant Shard 'Not Masterworked' and 'Lock Energy Type' options.
* In the Exotic Selector, the currently selected exotic is now highlighted.

## 6.70.0 <span class="changelog-date">(2021-06-23)</span>

* Fixed an issue where unwanted energy swaps were happening in the Optimizer.
* Fixed an issue where mod energy types could be mismatched in the Optimizer.

## 6.69.2 <span class="changelog-date">(2021-06-22)</span>

* Fixed an issue with general mods returning no results in the Optimizer.

## 6.69.1 <span class="changelog-date">(2021-06-21)</span>

* Fix an issue crashing DIM on older versions of Safari.

## 6.69.0 <span class="changelog-date">(2021-06-20)</span>
* Added "Recency" Column & Sorting to Loadout Organizer, this allows viewing gear sorted by acquisition date.
* Added ctrl-click to toggle item selection in Organizer.
 * Fix over-eager prompt to backup data when signing in.
* Viewing artifact details no longer always shows The Gate Lord's Eye.
* Scrolling to an item tile is now more accurate.
* Vault of Glass milestone is now more clearly named.
* Loadout Optimizer support for Vault of Glass mods.

## 6.68.0 <span class="changelog-date">(2021-06-06)</span>

* Some support for Vault of Glass mods in filters. Expect Loadout Optimizer fixes next week.
* Clearer hover text for some Destiny icons inline with text.
* Hovering Consumables in the Vault header now shows a list of owned materials and currencies.
* `is:hasornament` now recognizes Synthesized armor.
* DIM is less likely to log you out if Bungie.net is experiencing difficulties.
* Stat searches now support `highest`, `secondhighest`, `thirdhighest`, etc as stat names.
  * Try out `basestat:highest:>=20 basestat:secondhighest:>=15`
* Login screen is now more descriptive, and helps back up your settings if you're enabling DIM Sync for the first time.

## 6.67.0 <span class="changelog-date">(2021-05-30)</span>

* Items tagged "archive" are no longer automatically excluded from Loadout Optimizer and the Organizer.
* Vendor items can now match wish lists. Check what Banshee has for sale each week!
* You can put tags and notes on Shaders again. And for the first time, you can put them on Mods. Both are accessible from the Collections row in the Records tab.
* iPhone X+ screens once again do not show grey corners in landscape mode.
* Fixed a bug that broke part of the Progress page.
* Fixed a bug that crashed DIM if you clicked the masterwork of some items.

## 6.66.2 <span class="changelog-date">(2021-05-25)</span>

* Fix for errors on viewing some items when DIM had just loaded.

## 6.66.1 <span class="changelog-date">(2021-05-24)</span>

* Fix for 404 errors when signing in with Bungie.

## 6.66.0 <span class="changelog-date">(2021-05-23)</span>

* Fix strange wrapping and blank space on the list of Currencies in the header.

## 6.65.1 <span class="changelog-date">(2021-05-17)</span>

* Fix for a crash on older browsers.

## 6.65.0 <span class="changelog-date">(2021-05-16)</span>

* Reimplemented the is:shaded / is:hasshader searches.
* Crucible and Gambit ranks show on the Progress page again.
* Fixed the display text for some bounties and rewards from a new text system in Season of the Splicer.
* Fixed currencies wrapping weirdly when you're not in-game.

## 6.64.1 <span class="changelog-date">(2021-05-11)</span>

* Fix an issue where owning Synthesis currency was causing a crash.

## 6.64.0 <span class="changelog-date">(2021-05-09)</span>

## 6.63.0 <span class="changelog-date">(2021-05-02)</span>

## 6.62.0 <span class="changelog-date">(2021-04-25)</span>

* Exotic class item perks don't prevent selecting another exotic perk in Loadout Optimizer.
* Buttons and menus are bigger and easier to tap on mobile.
* Fixes to the heights of Loadout Optimizer result sets.
* Aeon perks are highlighted as their armor's exotic effect.
* Notes field hashtag suggestions tuned a bit to be more helpful.
* Item notes are displayed in Compare sheet when hovering or holding down on an item icon.
* Improvements to how drawer-style elements size themselves and interact with mobile keyboard popups.
* Some quests were being skipped, but now display on the Progress page (catalyst quests, Guardian Games cards, Medal Case).
* Armor stats changes
  * Stats have been revamped and show their actual game effect, including stats past the in-game display caps of 0 and 42.
  * Base stats are no longer confused by very large or very low current values.
  * Multiple mods affecting the same stat now display as separate stat bar segments. You can hover or tap these for more information.
  * Armor in collections now includes default stats and their exotic perks.

### Beta Only

* If your postmaster is getting full, we'll show a banner if you're on a page where you wouldn't otherwise notice your full postmaster. Hopefully this helps avoid some lost items.
* On mobile, if you're using DIM through a browser, we prompt to install the app. Not trying to be annoying, but DIM is way better installed!

## 6.61.0 <span class="changelog-date">(2021-04-18)</span>

* Fixed the stats for some perks if they would bring a stat above the maximum value.
* Creating a loadout from existing items will also save the items' current mods in the loadout. Viewing the mods is still Beta-only.
* Fixed Loadout Optimizer mod assignment for raid mods.
* Fixed Loadout Optimizer sometimes not handling T10+ stats correctly.
* Loadout Optimizer knows about Nightmare Mods now.
* You can now combine stats in search with & to average multiple stats. For example `basestat:intellect&mobility:>=15` shows if the average of intellect & mobility is greater than or equal to 15.
* Notes field now suggests your previously-used hashtags as you type.
* Collect Postmaster button is looking as slick as the rest of the app now.

## 6.60.0 <span class="changelog-date">(2021-04-11)</span>

* When opening Compare for an Adept weapon, we now also include non-Adept versions of that weapon.
* We now remove leading or trailing spaces from loadout names when they are saved.
* In the item popup, exotic armor's exotic perk is now described in full above the mods.
* You can once again compare ghosts and ships. You can no longer compare emblems.
* Changing perks on items in Compare now re-sorts the items based on any updated stats.

### Beta Only

* You can now edit a loadout's mods in the loadout drawer.

## 6.59.1 <span class="changelog-date">(2021-04-05)</span>

* Correct suggestions & interpretation for `inloadout` filter.

## 6.59.0 <span class="changelog-date">(2021-04-04)</span>

* Visual refresh for buttons and some dropdowns.
* Swiping between characters on mobile by swiping the inventory works again.
* Swiping the character headers behaves more sensibly now.
* Search
  * Loadouts can be found by exact name. For instance, `inloadout:"My PVP Equipment"` will highlight any items in the `My PVP Equipment` loadout.
  * To help reduce typing and remembering, `inloadout` names, `perkname`s, and item `name`s are now suggested as you type them.
  * We will also suggest any #hashtags found in your notes, for instance... `#pve`?
* Loadout Optimizer
  * Mod groupings have been updated so inconsistent labels don't split them apart.
  * Half-tiers show up in results to warn you when a +5 stat mod might benefit you.
  * In these cases, a new +5 button can quickly the suggested mods to your loadout.

## 6.58.0 <span class="changelog-date">(2021-03-28)</span>

* When comparing items, the item you launched Compare from is now highlighted with an orange title.
* The Compare screen has an "Open in Organizer" button that shows the exact same items in the Organizer which has more options for comparing items.
* Fixed some mods in Loadout Organizer that weren't applying the right stats.
* You can now sort inventory by how recently you acquired the item.

## 6.57.1 <span class="changelog-date">(2021-03-22)</span>

* Remove `sunsetsin:` and `sunsetsafter:` filters, and remove power cap display from Compare/Organizer. Organizer gains a new "Sunset" column. Items that are sunset can still be selected with `is:sunset` and have a grey corner.
* Fix Loadout Optimizer acting as if "Assume Masterworked" was always checked.

## 6.57.0 <span class="changelog-date">(2021-03-21)</span>

* We went back to the old way search worked, reverting the change from v6.56. So now `gnaw rampage zen` searches for three independent properties instead of the literal string `"gnaw rampage zen"`.
* Clicking on the empty area below Organizer can now close item popups, where it didn't before.
* Fix an issue where an exotic perk could sometimes be unselectable in Loadout Optimizer.
* Added a new `is:pinnaclereward` search that searches for pinnacle rewards on the Progress page.
* DIM Sync now less picky about saving very simple searches.
* Fix mis-sized kill tracker icons in Organizer.
* Support addition syntax in stat filters, i.e. `stat:recovery+mobility:>30`
* Mulligan now shows up as a Wishlisted perk.
* Search bar expands more readily to replace the top tabs, so the field isn't squished really tiny.
* Loadout Optimizer
  * Reposition some misplaced pieces of UI
  * Performance optimizations and some tweaks that could theoretically include some builds that wouldn't have shown up before.
  * Fixed an issue that would show builds with more than 100 in a single stat once mods were included.
  * Removed the minimum power and minimum stat total filters. Minimum power didn't see much use and minimum stat total can be achieved by searching `basestat:total:>52` in the search bar.

## 6.56.1 <span class="changelog-date">(2021-03-14)</span>

* Fix a bug where clicking inside the mod picker would dismiss the popup.

## 6.56.0 <span class="changelog-date">(2021-03-14)</span>

* On the Compare screen, items will update to show their locked or unlocked state.
* Deleting multiple searches from your search history works now - before there was a bug where only the first delete would succeed.
* On the Search History page accessible from Settings, you can now clear all non-saved searches with a single button.
* Deprecated search filters no longer show up in Filter Help.
* Searches that don't use any special filters now search for the entire string in item names and descriptions and perk names and descriptions. e.g. `gnawing hunger` now searches for the full string "gnawing hunger" as opposed to being equivalent to `"gnawing" and "hunger"`.
* Invalid searches no longer save to search history.
* Bright engrams show up correctly in the seasonal progress again.
* Added an icon for Cabal Gold in objective text.
* You can sort items by ammo type.
* There's a new button in the Loadout editor to add all unequipped items, similar to adding all equipped items.
* The farming mode "stop" button no longer covers the category strip on mobile.
* Reverting a loadout (the button labeled "Before [LoadoutName]") no longer pulls items from Postmaster.

## 6.55.0 <span class="changelog-date">(2021-03-07)</span>

* You can once again select how much of a stackable item to move, by editing the amount in the move popup before clicking a move button. Holding shift during drag no longer allows you to select the amount - you must do it from the buttons in the popup.

## 6.54.0 <span class="changelog-date">(2021-02-28)</span>

## 6.53.0 <span class="changelog-date">(2021-02-21)</span>

* Pulling from postmaster, applying loadouts, moving searches, moving individual items, and more are now cancel-able. Click the "cancel" button in the notification to prevent any further actions.
* Bulk tagging in the Organizer no longer shows an "undo" popup. We expect you know what you're doing there!

## 6.52.0 <span class="changelog-date">(2021-02-14)</span>

* Search filters that operate on power levels now accept the keywords "pinnaclecap", "powerfulcap", "softcap", and "powerfloor" to refer to the current season's power limits. e.g "power:>=softcap"
  * `powerlimit:pinnaclecap` will show items with a power limit that matches this season's limit on all items.
  * `sunsetsin:next` will show the same items: items whose power limit won't reach next season's limit on all items.
* Confirm before pulling all items from Postmaster.
* Added Seasonal Challenges to the Records page. You can track as many of these as you want in DIM and the tracked ones will show up in the Progress page.
* Quests that expire after a certain season now show that info in the item popup.
* Quests show which step number on the questline they are.
* Triumphs that provide rewards for completing a part of the triumph now show that reward.

## 6.51.1 <span class="changelog-date">(2021-02-10)</span>

* Updates for Season of the Chosen

## 6.51.0 <span class="changelog-date">(2021-02-07)</span>

## 6.50.0 <span class="changelog-date">(2021-01-31)</span>

* Some emblem stats have better formatting now.
* Perks which would grant a bonus in a stat, but which grant zero points due to how stats work, now show +0 instead of just not showing the stat.
* Bounty guide for special grenade launchers now shows a label and not just an icon.
* Fixed some issues with Loadout Optimizer on mobile.

## 6.49.0 <span class="changelog-date">(2021-01-24)</span>

* Mod categorization in the Loadout Optimizer mod picker is now driven from game data - it should stay up to date better as new mods appear.
* Disabled weapon mods no longer contribute to stats.
* Automatic updates for the latest patch.

## 6.48.0 <span class="changelog-date">(2021-01-17)</span>

* Allow clicking through the loading screen to get to the troubleshooting link.

## 6.47.1 <span class="changelog-date">(2021-01-11)</span>

* Fix a bug that could crash loadout optimizer.

## 6.47.0 <span class="changelog-date">(2021-01-10)</span>

* Show a star icon for favorited finishers rather than a lock icon.
* Search history truncates huge searches to three lines and aligns the icons and delete button to the first line.
* Added indicators in the Compare view to show which stat we are sorting by, and in which direction.
* Fix visuals on the pull from postmaster buttons.
* Loadout Optimizer now allows selecting up to 5 raid mods, not just 2.
* Armor mods with conditional stats, like Powerful Friends and Radiant Light, now correctly take into account the conditions that cause their stats to be applied. This only works within a single piece of armor - for example, it will work if you have Powerful Friends and another Arc mod is socketed into that piece of armor, but will not yet correctly identify that the stats should be enabled when you have another Arc Charged With Light mod on *another* piece of armor.
* Masterworked Adept weapons should show all their stat bonuses.
* Fix a bug where using the move buttons instead of drag and drop wouldn't show item move progress popups or error popups.
* The most recent Steam Overlay browser version shouldn't be reported as not supported anymore. Keep in mind we can't really debug any problems that happen in the Steam Overlay.
* Fixed some event-specific searches, such as source:dawning.

## 6.46.0 <span className="changelog-date">(2021-01-03)</span>

* Base stats no longer cause sort issues in the compare pane, and no longer apply to weapons.
* Older pieces of Last Wish and Reverie Dawn armor now count as having normal Legacy mod slots.
* Deep Stone Crypt Raid mods now show up in the Loadout Optimizer mod picker.

## 6.45.2 <span className="changelog-date">(2020-12-30)</span>

* Fixed an issue that could harm the DIM Sync service.

## 6.45.1 <span className="changelog-date">(2020-12-29)</span>

* Fixed an issue where linking directly to any page would redirect to the inventory.

## 6.45.0 <span class="changelog-date">(2020-12-27)</span>

* Faster initial page load for inventory (loading a subset of things from bungie.net api)
* Wishlists now support multiple URLs
* Collection items in records now display the intrinsic perk.
* Fixed an issue with the item popup sidecar on safari.
* Fixes for compare view on mobile.
* The optimizer now clears results if a character is changed.
* Fix typo in energycapacity organizer search
* Clean up toolbar on organizer page on mobile.
* Some routes can now be accessed without being logged in (Whats New, Privacy Policy, etc.)
* What's new page is now rendered at build time instead of run-time, so it should load faster.
* Various dependency upgrades

## 6.44.0 <span class="changelog-date">(2020-12-20)</span>

* Fixed a bug that could potentially erase some tags/notes if there were errors in DIM.
* When Bungie.net is undergoing maintenance, item perks won't be shown anymore. Before, we'd show the default/collections roll, which confused people.
* Fix the element type of items not showing in some cases.
* Improved the sizing of sheet popups on Android when the keyboard is up.
* You can no longer transfer Spoils of Conquest anywhere.
* Hide action buttons on collections/vendors items.
* Fixed character headers wrapping on non-English locales.

### Beta Only

* We continue to experiment with the order of the list-style perk display on weapons - the most important perks tend to be on the rightmost column of the grid, so now we list the perks in right-to-left order from the original grid.

## 6.43.2 <span class="changelog-date">(2020-12-13)</span>

## 6.43.1 <span class="changelog-date">(2020-12-13)</span>

## 6.43.0 <span class="changelog-date">(2020-12-13)</span>

* New Rich Texts added for Lost Sectors and Stasis.
* Show reasons why you can't buy vendor items, and grey out bounties that you've already purchased on the vendors screen.
* Updated the item popup header for mobile and desktop. The buttons on mobile now have larger click targets and should be easier to find/use.
* Green items can no longer mess up loadout optimizer.
* Special-ammo grenade launchers are now distinguished from heavy grenade launchers.

## 6.42.3 <span class="changelog-date">(2020-12-07)</span>

* Filter ornaments to the correct class for season pass on progress page.
* Enable bounty guide on app.destinyitemmanager.com.
* Spoils of Conquest vault prevention.

### Beta Only

* Re-order sockets putting key traits first.

## 6.42.2 <span class="changelog-date">(2020-12-06)</span>

* Banner Tweaks

## 6.42.1 <span class="changelog-date">(2020-12-06)</span>

* Banner Tweaks

## 6.42.0 <span class="changelog-date">(2020-12-06)</span>

* Farming mode now refreshes only every 30 seconds, instead of every 10 seconds, to reduce load on Bungie.net.
* When the postmaster section is collapsed, it now shows the number of items in your postmaster so you can keep an eye on it.
* Fixed an issue where the Game2Give donation banner could sometimes appear in the mobile layout.

### Beta Only

* We're trying out a new display for weapon perks, which displays the name of the active perk and shows details on click, instead of on hover. This is partly to make perks easier to understand, but also to allow for more actions on perks in the future. Let us know what you think! Animations will be added later if this design catches on.
* Continued improvements to Active mode, incorporating Bounty Guide and better suggested vendor bounties.

## 6.41.1 <span class="changelog-date">(2020-12-02)</span>

## 6.41.0 <span class="changelog-date">(2020-12-02)</span>

* Bounties and Quests sections on the Progress page now show a summary of bounties by their requirement - weapon, location, activity, and element. Click on a category to see bounties that include that category. Other categories will light up to show "synergy" categories that can be worked on while you work on the selected one. Shift-click to select multiple categories. Click the (+) on a weapon type to pull a weapon matching that type.
* New item sort option to sort sunset items last.
* Engrams show their power level - click on small engrams to see their power level in the item popup.
* The checkmark for collectibles is now on the bottom right corner, so it doesn't cover mod cost.
* Mod costs display correctly on Firefox.
* Fixed the `is:powerfulreward` search to recognize new powerful/pinnacle engrams.
* When items are classified (like the new Raid gear was for a bit), any notes added to the item will show on the tile so you can keep track of them.
* Fixed filter helper only opening the first time it is selected in the search bar
* Pinnacle/powerful rewards show a more accurate bonus, taking into account your current max power.

### Beta Only

* A new "Single character mode" can be enabled through settings, or the « icon on desktop. This focuses down to a single character, and merges your other characters' inventories into the vault (they're really still on the other characters, we're just displaying them different). This is intended for people who are focused on one character, and always shows the last played character when collapsed.

## 6.40.0 <span class="changelog-date">(2020-11-22)</span>

* Mod and mod slot info in Loadout Optimizer have been updated to handle the new mod slots better.
* Postmaster items can be dragged over any items on your character to transfer them - they don't need to be dragged to the matching item type.
* Stop showing extra +3 stats on masterwork weapons. The fix for this means that Adept weapons may not show that bonus when they are released.
* Progress page now shows more Milestones/Challenges, shows rewards for all of them, includes vendor pictures where available, and gives a hint as to what power pinnacle/powerful engrams can drop at.

## 6.39.1 <span class="changelog-date">(2020-11-16)</span>

* Farming mode will no longer immediately kick out items you manually move onto your character.
* The Records page now includes all the Triumphs and Collections info that are in the game.
* Mods in the Loadout Optimizer can be searched by their description.
* Fixed Active Mode showing up in release version if you'd enabled it in Beta.
* Fixed a crash when viewing Stasis subclasses.

## 6.39.0 <span class="changelog-date">(2020-11-15)</span>

* Xur's location is now shown on his entry in the Vendors page.
* The Raids section is back in Progress, and Garden of Salvation shows up in Milestones.
* Search autocomplete suggests the `current` and `next` keywords for seasons.
* Reworked mod handling to account for new legacy and combat mod slots. New searches include `holdsmod:chargedwithlight`, `holdsmod:warmindcell`, etc., and `modslot:legacy` and `modslot:combatstyle`.
* Armor tiles now display the energy capacity of the armor.
* Masterwork levels in the mod details menu once again show which level masterwork they are.
* Added a new sort order for items, sort by Seasonal icon.
* Darkened the item actions sidecar to improve contrast with the background.
* Fixed a visual glitch where the tagging menu looked bad.
* Fixed logic for determining what can be pulled from postmaster to exclude stacked items like Upgrade Modules when you cannot actually pull any more of them.
* Removed the counter of how many items were selected in Organizer. This fixes a visual glitch that cut off the icons when items were selected.
* Fixed the vendor icon for Variks.
* Loadout drawer, Compare, Farming, and Infusion now work on every page that shows an item from your inventory.
* Deleting a loadout from the loadout drawer now closes the loadout drawer.
* When Bungie.net is not returning live perk information, we won't show the default perks anymore.

### Beta Only

* Preview of "Active Mode", an in-progress new view that focuses down to a single character plus your vault, and has easy access to pursuits, farming, max light, and more.

## 6.38.1 <span class="changelog-date">(2020-11-11)</span>

* Removed character gender from tiles and notifications.
* Don't show empty archetype bar for items in collections.
* Deprecated the `sunsetsafter` search filter because its meaning is unclear. Introduced the `sunsetsin` filter and the `is:sunset` filter.
  * Try out `sunsetsin:hunt` for weapons which reached their power cap in season 11.
  * `is:sunset` won't show anything until Beyond Light launches!
* Added `current` and `next` as season names for searches. Search `sunsetsin:next` to see what'll be capped in next season even before it has an official name.
* Vendorengrams.xyz integration has been removed, because of the vendor changes in Beyond Light.
* Legacy Triumphs have been removed.
* Fixed the Progress page not loading.
* Fixed Catalysts not showing on the Records page.
* Fix errors when selecting mods in Loadout Optimizer.
* Removed the opaque background from item season icons.

## 6.38.0 <span class="changelog-date">(2020-11-08)</span>

* New background color theme to tie in with Beyond Light. The character column coloring based on your equipped emblem has been removed.
* Perk and mod images are once again affected by the item size setting.

## 6.37.2 <span class="changelog-date">(2020-11-03)</span>

* Fix the item tagging popup not working on mobile by un-fixing the Safari desktop item popup.

## 6.37.1 <span class="changelog-date">(2020-11-02)</span>

* Fixed not being able to scroll on mobile.
* Fixed filter help not always showing up.

## 6.37.0 <span class="changelog-date">(2020-11-01)</span>

* Removed "Color Blind Mode" setting. This didn't help with DIM's accessibility - it just put a filter over the page to *simulate what it would be like* if you had various forms of color blindness.
* Added `hunt` as valid season synonym.
* Clicking on the energy track or element for armor can now let you preview how much it'd cost in total to upgrade energy or change element.
* Redesigned weapon perks/mods to more clearly call out archetype and key stats.
* Improved the buttons that show in the item popup for items in postmaster. For stacked items you can now take just one, or all of the item.
* Some items that DIM couldn't pull from postmaster before, can be pulled now.
* Fixed the display of stat trackers for raid speed runs.
* Hide the "kill tracker" perk column on masterworked weapons.
* Fixed the tagging dropdown not being attached on desktop Safari.

## 6.36.1 <span class="changelog-date">(2020-10-26)</span>

* Some more tweaks to the sidecar layout.
* Put back automatically showing dupes when launching compare.
* The item popup now closes when you start dragging an item.

## 6.36.0 <span class="changelog-date">(2020-10-25)</span>

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

## 6.35.0 <span class="changelog-date">(2020-10-18)</span>

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

## 6.34.0 <span class="changelog-date">(2020-10-11)</span>

* Replaced the tagging dropdown with a nicer one that shows the icon and keyboard shortcut hints.
* Made the farming mode popup on mobile not overlap the category selector, and made it smaller.
* Secretly started recording which mods you selected in Loadout Optimizer when you create a loadout, for future use.
* In the Organizer, the selected perk for multi-option perks is now bold.
* Updated the style and tooltip for wishlist perks to match the thumb icon shown on tiles.
* Fix some display of masterworked exotics in the CSV export.

## 6.33.0 <span class="changelog-date">(2020-10-04)</span>

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

## 6.32.2 <span class="changelog-date">(2020-09-29)</span>

* Actually fixed "Store" buttons not showing for items in Postmaster.
* Fix wishlists not highlighting the right rolls.

## 6.32.1 <span class="changelog-date">(2020-09-29)</span>

* Fixed "Store" buttons not showing for items in Postmaster.
* Fixed masterwork stats for Exotics not displaying correctly.
* Fixed character stats only displaying the current character's stats on mobile.
* Fixed Postmaster not appearing on D1 for mobile.

## 6.32.0 <span class="changelog-date">(2020-09-27)</span>

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

## 6.31.2 <span class="changelog-date">(2020-09-22)</span>

* Fix an issue where moving Exotic Cipher to vault with DIM would cause your characters to be filled up with items from your vault.

## 6.31.1 <span class="changelog-date">(2020-09-21)</span>

* Loadout Optimizer highlights loadouts you've already saved.
* Add new searches `kills:`, `kills:pvp:`, and `kills:pve:` for Masterwork kill trackers.
* Fixed: "Source" was not being set for all items.
* Fixed: Item type searches (e.g. is:pulserifle) not working for D1.
* Fixed: Spreadsheets missing power cap.

## 6.31.0 <span class="changelog-date">(2020-09-20)</span>

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

## 6.30.0 <span class="changelog-date">(2020-09-13)</span>

* Compare loadouts in Loadout Optimizer to your existing loadout by clicking the "Compare Loadout" button next to a build.
* Improvements to search performance, and search autocomplete suggestions.
* Fix cases where some odd stats would show up as kill trackers.
* Sword-specific stats now show up in `stat:` filters.

## 6.29.1 <span class="changelog-date">(2020-09-11)</span>

* Improved performance of item transfers. We're still limited by how fast Bungie.net's API can go, though.
* Fixed a couple of the legacy triumphs that indicated the wrong triumph was being retired.
* Completed legacy triumph categories, and collections categories, now show the "completed" yellow background.
* is:seasonaldupe now correctly pays attention to the season of the item.
* Fixed a bug where notes wouldn't be saved if you clicked another item before dismissing the item popup.
* Tweaks to the display of legacy triumphs.
* Reduce the number of situations in which we autoscroll the triumph category you clicked into view.

## 6.29.0 <span class="changelog-date">(2020-09-10)</span>

* Legacy Triumphs are now indicated on the Records page and have their own checklist section. Legacy Triumphs are triumphs that will not be possible to complete after Beyond Light releases. The list of which Triumphs are Legacy Triumphs was provided by Bungie.
* Mods in the Loadout Optimizer mod picker are now split up by season.
* The number of selected items is now shown on the Organizer page.
* Empty mod slot tooltips spell out which season they're from.
* Locking/unlocking items in D1 works again.

## 6.28.1 <span class="changelog-date">(2020-09-06)</span>

* Actually release the Records page

## 6.28.0 <span class="changelog-date">(2020-09-06)</span>

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

## 6.27.0 <span class="changelog-date">(2020-08-30)</span>

* The new armor 2.0 mod workflow is available in the Loadout Optimizer, this includes:
  * A new Mod Picker component to let you choose armor 2.0 mods to lock.
  * The mod sockets shown in the optimizer are now the locked mods, rather than the mods currently equipped on the item.
  * Clicking on a mod socket will open the picker to show available mods for that slot. Note that locking a mod from this won't guarantee it gets locked to the item specifically.
  * Items have different levels of grouping depending on the requirements of the locked mods. Locking no mods keeps the previous grouping behavior.
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

## 6.26.0 <span class="changelog-date">(2020-08-23)</span>

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

## 6.25.0 <span class="changelog-date">(2020-08-16)</span>

* Removed `is:reacquireable` as it is inaccurate in its current state
* Removed outline from clicked character headers on iOS
* Adjusted spacing on items in the loadout drawer, so they can fit 3-wide again
* Main (top) search field is now the place to filter items for the Loadout Optimizer
* For real, stat bars should be the right length this time
* Keyboard controls in the Notes field: ESC reverts and leaves editing, ENTER saves the value
* Item notes can now be edited directly in the notes column of the Organizer tab
* Mobile - changes in DIM beta only: different parts of the header now stick with you as you scroll down.
* Armor CSV export appearing properly on the Organizer tab again.

## 6.24.1 <span class="changelog-date">(2020-08-12)</span>

* Updated the character tiles, now uses triple dot instead of chevron
* Solstice of Heroes is back and so is the **Solstice of Heroes** section of the **Progress** tab. Check it out and view your progress toward upgrading armor.

## 6.24.0 <span class="changelog-date">(2020-08-09)</span>

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

## 6.23.0 <span class="changelog-date">(2020-08-02)</span>

* You can add tags and notes to shaders! Keep track of your favorites and which shaders you could do without.
* Searches now support parentheses for grouping, the "and" keyword, and the "not" keyword. Example: `(is:weapon and is:sniperrifle) or not (is:armor and modslot:arrival)`. "and" has higher precedence than "or", which has higher precedence than just a space (which still means "and").
* Fixed the size of damage type icons in D1.
* Our Content Security Policy is more restrictive now, external and injected scripts may fail but this keeps your account and data safer.

## 6.22.1 <span class="changelog-date">(2020-07-27)</span>

## 6.22.0 <span class="changelog-date">(2020-07-26)</span>

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

## 6.21.0 <span class="changelog-date">(2020-07-19)</span>

* Added support for negative stats on mods. This should be visible in item displays and make loadout optimizer results more accurate.
* Fix quick item picker not remembering your preference for "equip" vs "store".
* Some quests can now be tracked or untracked from DIM.
* Locking or unlocking items from DIM is now reflected immediately on the item tiles.
* Items with the Arrivals mod slot now match the `holdsmod:dawn` search.

## 6.20.0 <span class="changelog-date">(2020-07-12)</span>

* Fix sorting by Power Limit in the compare pane.
* When opening a loadout in the loadout optimizer from the inventory page, the correct character is now selected rather than the last played character.
* Allow masterworks to affect more than one stat
* Exclude subclasses from `is:weapon` filter.
* Fixed Loadout Optimizer not including all the right tiers when tier filtering was in place.

## 6.19.0 <span class="changelog-date">(2020-07-05)</span>

* Loadout Optimizer has been... optimized. It now calculates sets in the background, so you can still interact with it while it works.
* Removed ghosts from loadout optimizer as they don't have enough interesting perks to build into loadouts.
* The filter help button is now always shown in the search bar, even when a search is active.
* The item count in the search bar is now more accurate to what you see on the inventory screen.
* Make it clearer that not having Google Drive set up doesn't matter that much since it's only for importing legacy data.
* Better handling for if the DIM Sync API is down.

## 6.18.0 <span class="changelog-date">(2020-07-02)</span>

* Breaker type is now shown on the item popup and in the Organizer.
* New filter for breaker types on weapons, `breaker:`.
* Fixed another crash on the vendors screen also caused by the Twitch gift sub shader.
* Protect against certain weird cases where DIM can get stuck in a non-working state until you really, thoroughly, clear your cache.

## 6.17.1 <span class="changelog-date">(2020-07-01)</span>

* Fix a crash with the Twitch gift sub shader.

## 6.17.0 <span class="changelog-date">(2020-06-28)</span>

* You can now filter out armor in the Loadout Optimizer by minimum total stats. This narrows down how many items are considered for builds and speeds up the optimizer.
* Renamed the "is:reacquireable" filter to "is:reacquirable"
* Searches like "is:inleftchar" now work with consumables in the postmaster.
* Fixed the inventory screen jumping a bit when the item popup is open on mobile.
* Add a link to the troubleshooting guide to error pages.
* Seasonal mods in the loadout optimizer now force armor to match their element, again.
* The stat in parentheses in a weapon perk tooltip, is the stat matching the masterwork. UI slightly updated to help show this.

## 6.16.1 <span class="changelog-date">(2020-06-22)</span>

* Fix a crash when opening some items in Organizer.

## 6.16.0 <span class="changelog-date">(2020-06-21)</span>

* Remove `is:ikelos` filter
* Loadout Optimizer: Save stat order and "assume masterworked" choices.
* Fixed a bug that caused the inventory view to jump to the top of the screen when items were inspected.
* Add a disclaimer to power limit displays that they may change in the future. Please see https://www.bungie.net/en/Help/Article/49106 for updates
* Save column selection for Ghosts in the Organizer separate from Armor.
* Display how many tags were cleaned up in the DIM Sync audit log.
* Fix a bug where canceling setting a note in the Organizer would wipe notes from selected items.
* Add a pointer cursor on item icons in the Organizer to indicate they're clickable.
* Fix minimum page width when there are fewer than three characters.
* Fix Arrival mods not appearing in the Loadout Optimizer.
* Fix a bug when DIM Sync is off that could repeatedly show a notification that an import had failed. Please consider enabling DIM Sync though, your data WILL get lost if it's disabled.

## 6.15.1 <span class="changelog-date">(2020-06-15)</span>

## 6.15.0 <span class="changelog-date">(2020-06-14)</span>

* Items now show their power limit in the item popup, Compare, and in the Organizer (new column). Keep in mind some power limits may change in upcoming seasons.
* Try the `sunsetsafter:` or `powerlimit:` filters to find things by their power limit.
* Fix the season icon for reissued items.
* Fix not being able to dismiss the item popup on the Organizer in certain cases.
* Remove the 15 second timeout for loading data from Bungie.net.
* Fix umbral engrams showing up weird in the engram row.
* Prevent Chrome on Android from showing a "download this image" prompt when long-pressing on images.
* Fix non-selected perks not showing on old fixed-roll weapons.
* Add Charge Rate and Guard Endurance stat to swords.

## 6.14.0 <span class="changelog-date">(2020-06-07)</span>

* Fixed misdetection of seasonal mods in Compare.
* Work around a Bungie.net issue that could prevent the Destiny info database from loading.
* Improved the experience for users who previously had DIM Sync off.

## 6.13.2 <span class="changelog-date">(2020-06-03)</span>

## 6.13.1 <span class="changelog-date">(2020-06-01)</span>

* Add a banner to support Black Lives Matter.
* Avoid an issue where shift-clicking on empty space near perks in the Organizer can enable a useless filter.

## 6.13.0 <span class="changelog-date">(2020-05-31)</span>

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

## 6.12.0 <span class="changelog-date">(2020-05-24)</span>

* DIM has a new community-driven user guide at https://destinyitemmanager.fandom.com/wiki/Destiny_Item_Manager_Wiki

## 6.11.0 <span class="changelog-date">(2020-05-17)</span>

* Added the Organizer page, which lets you see all your items in a table form, which you can sort and filter (try shift-clicking on a cell!). Add and remove columns and bulk-tag your items to help quickly figure out which items you want to keep and which you can get rid of.
* Fixed stat calculations for special Taken King class items in D1.

## 6.10.0 <span class="changelog-date">(2020-05-10)</span>

## 6.9.0 <span class="changelog-date">(2020-05-03)</span>

* In the Loadout Optimizer, mods have been split into their own menu, separate from perks.
* Fixed a bug where wishlists would ignore settings and load the default wishlist instead.

## 6.8.0 <span class="changelog-date">(2020-04-26)</span>

* Added "armor 2.0" column to spreadsheet exports.
* Fixed a bug that could affect the display of percentage-based objectives.

## 6.7.0 <span class="changelog-date">(2020-04-19)</span>

* Emblems now show a preview of their equipped stat tracker, and show which types of stat tracker the emblem can use.
* Certain stat trackers (under "Metrics" in "Collections") had the wrong display value, like KDA. These have been fixed.
* Loadout Optimizer now allows you to select seasonal mods independent of the gear they go on - it'll try to slot them into any gear.

## 6.6.0 <span class="changelog-date">(2020-04-12)</span>

* Better handling of logging out and into a different Bungie.net account.
* Improved error handling for Bungie.net and DIM Sync issues.

## 6.5.0 <span class="changelog-date">(2020-04-10)</span>

* Improved overall performance and memory usage of DIM - as the game grows, so has DIM's memory usage. If your browser was crashing before, give it a try now.
* Collectibles now show perks.

## 6.4.0 <span class="changelog-date">(2020-04-05)</span>

* Added stat trackers to the Collections page (under "Metrics")
* Improved error handling when Bungie.net is down or something is wrong with your account. Includes helpful tips for D1 users locked out by Twitch-linking bug. If your D1 accounts disappeared, they're in the menu now.
* Accounts in the menu are now always ordered by last-played date.
* DIM will no longer bounce you to a different account if the one you wanted cannot be loaded.
* Fixed some bugs that could cause D1 pages to not display.
* Fix display of collectibles that are tied to one of your alternate characters.
* Fix the levels that reward Bright Engrams after season rank 100.

## 6.3.1 <span class="changelog-date">(2020-03-29)</span>

* Fixed a bug where D1 items could fail to display.
* Fixed a bug where responding "Not now" to the DIM Sync prompt wouldn't cause it to go away forever.
* Make mod slot for Reverie Dawn armor set detect correctly as outlaw.

## 6.3.0 <span class="changelog-date">(2020-03-29)</span>

* Removed duplicate Mods section from the top level of the Collections screen - they're still under the normal collections tree.
* Fixed a missing icon when season rank is over 100.

## 6.2.0 <span class="changelog-date">(2020-03-22)</span>

## 6.1.1 <span class="changelog-date">(2020-03-22)</span>

## 6.1.0 <span class="changelog-date">(2020-03-22)</span>

* Introducing [DIM Sync](https://github.com/DestinyItemManager/DIM/wiki/DIM-Sync-(new-storage-for-tags,-loadouts,-and-settings)), a brand new way for DIM to store your loadouts and tags and sync them between all your devices. This is a big step forward that'll let us build lots of new things and share data between other apps and websites! Plus, you no longer have to log into anything separate, and we should avoid some of the bugs that have in the past led to lost data.
* External wish lists will be checked daily. Settings menu shows last fetched time.
* Seasonal Artifact is no longer considered a weapon or a dupe when searching.
* Event sources for items like Festival of the Lost and Revelry are now under the `source:` search like other sources, instead of `event:`.
* Fixed some recent bugs that prevented editing loadouts.
* Show how much of each material you have next to Spider's vendor info.
* Updated privacy policy with DIM Sync info.
