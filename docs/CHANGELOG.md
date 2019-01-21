# Next

# 5.11.0 (2019-01-20)

# 5.10.0 (2019-01-13)

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

# 5.9.0 (2019-01-06)

* Click the plus icon under an equipped item to search for and transfer items in that slot from anywhere in your inventory.
* Import a CSV file of items with tags and notes to bulk update the tags/notes for all of those items.
* CSV - Wrap ID in quotes such that its value is not rounded.

# 5.8.3 (2019-01-02)

* More fixes to popup swiping on Android.
* Fix perk searching in non-latin languages.
* Added a key for the ratings symbols.

# 5.8.2 (2019-01-01)

* Make it easier to swipe away the item popup on Android.

# 5.8.1 (2018-12-31)

* Fix a bug where some Android phones couldn't see weapon details.
* Fix a bug where the wrong item's details would show up in the item popup.
* Show "Make Room for Postmaster" if there's anything in the postmaster, not just if there's pullable items.

# 5.8.0 (2018-12-30)

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

# 5.7.0 (2018-12-23)

* Show kill trackers for items with in-progress masterwork catalysts.
* You can specify item categories to be specific about your expert wish list items.
* Hide ratings on items with fewer than 3 reviews.
* Fix some DIM functionality in the Edge browser.

# 5.6.0 (2018-12-17)

* Updated Crucible and Gambit ranks to reflect new multi-stage ranks.
* DIM loads faster and uses less memory.
* Ratings are now displayed on item tiles as an icon indicating whether they are perfect rolls (star), good (arrow up), neutral (dash), or bad (arrow down). The exact rating is still available in the item popup.
* The mobile view now defaults to 4 items across (5 including equipped), which fits more on the screen at once. You can still choose other display options in Settings.
* Masterwork info is now included in the CSV exports.
* Added season info for Dawning items.
* Include non-selected perk options while searching perks.
* Load the new Simplified Chinese Destiny database when that language is selected.
* Show a warning when perks/mods are missing because of a Bungie.net deployment.

# 5.5.2 (2018-12-10)

* Changed search behavior of perk:. It now tries to match the start of all words.
* Added "expert mode" for more complex wish list expressions.
* Allow selecting text on the progress page.
* Some redacted items now have a picture and some description, pulled from their collection record.

# 5.5.1 (2018-12-09)

* Fixed display of stackables badges in D1.

# 5.5.0 (2018-12-09)

* New items, when enabled, now show a red dot instead of an animated shine.
* Fixed center column emblem color on Safari.
* Loadout and compare popups now use a draggable "Sheet" UI.

# 5.4.0 (2018-12-02)

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

# 5.3.2 (2018-11-27)

* Fix crash on Progress page caused by redacted Triumphs.
* Fix URL not updating while navigating.
* Fix display of faction levels.
* Fix The Drifter showing an error because of a redacted item.
* Fix a case where the Google Drive data file would not be created.
* Prevent moving partial stacks of Ghost Fragments, because that doesn't work.
* Fix display of vendor checkmark.
* Fix horizontal scrolling slop on the mobile header.

# 5.3.1 (2018-11-26)

* Fix some settings that weren't quite working right.

# 5.3.0 (2018-11-25)

* Remove the ability to set a specific vault width. Vault always takes all remaining space.
* Inventory columns are shaded to match the equipped emblem.
* DIM has been darkened to provide better contrast with the items.
* Fit and finish changes to the new tiles and inventory display.
* Add id and hash column to exported csv for ghosts, armor, and weapons.
* Add event and season column to exported csv for Destiny 2.
* D2 subclasses now show which path, grenade, etc. are chosen.

# 5.2.1 (2018-11-20)

* Fix comparing masterworks

# 5.2.0 (2018-11-20)

* New item tiles that show more information and don't hide the picture.
* Updated storage settings to show Google Drive usage and signed in user.
* New D1 Vendors page that resembles the D2 Vendors page.

# 5.1.0 (2018-11-18)

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

# 4.77.0 (2018-11-11)

* Completed bounties now sort to the bottom of the Pursuits.
* Return mods to the compare view.
* Item popup background now indicates rarity rather than burn type.
* Triumphs are now displayed on the Progress page.
* Infusion dialog now separates out duplicate items.
* The Progress page now shows progress towards reset.
* Added some sources to the search dialog.
* source:
* edz, titan, nessus, io, mercury, mars, tangled, dreaming
* crucible, trials, ironbanner
* zavala, ikora, gunsmith, gambit, eververse, shipwright
* nm, do, fwc
* leviathan, lastwish, sos, eow, prestige, raid
* prophecy, nightfall, adventure
* In Chrome you can now Install DIM from the hamburger menu and use it as a standalone app. Chrome will support macOS later.

# 4.76.0 (2018-11-04)

# 4.75.0 (2018-10-28)

* DIM now supports searching by season, event and year in Destiny 2.
* is:season1, is:season2, is:season3, is:season4
* is:dawning, is:crimsondays, is:solstice, is:fotl
* Performance improvements

# 4.74.1 (2018-10-21)

* We no longer support searching D1 vendor items.
* Added support for showing ratings and reviews based on the item roll in Destiny 2.
* Fix for missing class names in the loadout builder in Firefox.
* Added item search to D2 vendors.
* Collections now include the in-game Collections.
* D2 Vendors and Progress page now have collapsible sections.
* Catalysts are sorted above Ornaments on the Collections page.
* Fix a bug that could accidentally erase loadouts. Don't forget you can restore your data from old Google Drive backups from the Settings page.
* is:hasmod now includes Backup Mag.
* is:ikelos now includes Sleeper Simulant.

# 4.74.0 (2018-10-14)

* Added negative search. Prefix any search term with `-` and it will match the opposite.
* Added `perk:"* **"` search filter to match any keywords against perks on an item
* Added some missing `stat:`
* Lock and unlock items matching your current search from the same menu you use for tagging them.
* Updated icons across the app.

# 4.73.0 (2018-10-07)

* Added `is:heroic` search filter for armor with heroic resistance.
* New option to manually sort your characters.
* No longer forgetting what perks we recommended.
* Fix mods/perks on items - there was a bug that affected both display and searches.
* Fix is:hasmod search to include some more mods.
* You can now drag items into the loadout drawer.
* D2 spreadsheet export (in settings) covers perks now.
* You can also export ghosts (with perks) for D1/D2.
* Filters can now be combined with "or" to match either filter. For example: "is:shotgun or is:handcannon".

# 4.72.0 (2018-09-30)

* Add searches `is:transmat`, `is:armormod`, `is:weaponmod`, and `is:transmat`, and removed D1 `is:primaryweaponengram`, `is:specialweaponengram`, and `is:heavyweaponengram`.
* Show daily gambit challenge and daily heroic adventure in milestones.

# 4.71.0 (2018-09-23)

* Removed a bunch of help popups.
* Added information about unique stacks.
* Added `is:maxpower` search to return highest light items.
* Added `is:modded` search to return items that have a mod applied.
* Bounties with expiration times are now shown, and are sorted in front in order of expiration time.
* Added masterwork tier range filter.
* Highlight the stat that is boosted by masterwork in item details.
* Masterwork mod hover now shows the type/name of masterwork.

# 4.70.2 (2018-09-17)

* Fix some instances where DIM wouldn't load.
* Fix the About and Backers pages.
* Hide classified pursuits.

# 4.70.1 (2018-09-17)

# 4.70.0 (2018-09-16)

* Display armor resistance type on item icon and include in search filters.
* Giving more weight to ratings with reviews than ratings alone. Also, hiding lone ratings.
* Custom loadouts now display below our special auto loadouts.
* Added inverse string search for items and perks (prefix with minus sign)
* Postmaster is now on top of the screen (but disappears when empty).
* Individual inventory buckets are no longer collapsible, but disappear when empty.
* D1 vault counts are removed from their section headers.
* Fixed an issue where the display would be messed up when colorblind mode is on.
* Restored the keyboard shortcut cheat sheet (press ?).
* The max light loadout prefers legendaries over rares.
* Unclaimed engrams are shown up in the Postmaster section.
* Infusion transfer button is now visible on mobile devices.

# 4.69.1 (2018-09-10)

* Max power value in 'Maximum Power' loadout is now calculated correctly.

# 4.69.0 (2018-09-09)

* Max power updated to 600 for Forsaken owners.
* Fixed Year 1 weapons not having an elemental damage type.
* Many bugfixes post-Forsaken launch.
* Add Infamy rank to progress page.
* Bounties now show their rewards on the Progress and Vendors pages.
* The Progress page has been cleaned up to better reflect the state of the game since Forsaken.
* Pursuits are sorted such that bounties are displayed together.
* Add "is:randomroll" search for items that have random rolls.
* Added "is:bow" and "is:machinegun" searches.
* Remove "is:powermod" and "basepower:" searches.
* Masterworks now have a gold border. Previously items with a power mod had a gold border, but there are no more power mods.
* Added Bow stats "Draw Time" and "Inventory Size".
* Disabled vendorengrams.xyz integration until they are back online.
* Review modes - say hello to Gambit (and goodbye to Trials, at least for a little while).
* Ratings platform selection changes made easier.
* Added Etheric Spiral and Etheric Helix to the list of reputation items.

# 4.68.3 (2018-09-03)

# 4.68.2 (2018-09-03)

# 4.68.1 (2018-09-03)

# 4.68.0 (2018-09-02)

* Fixed: Destiny 2 - Sort by character age.
* Item popup shows the ammo type of D2 weapons.
* New is:primary, is:special, and is:heavy search terms for ammo types.
* Add is:tracerifle and is:linearfusionrifle searches.
* Added Korean as a language option.
* We have a new Shop selling enamel pins and T-shirts.
* Ratings system understands random rolls in D2.
* Search help added for searching by # of ratings.

# 4.67.0 (2018-08-26)

# 4.66.0 (2018-08-19)

* DIM now refreshes your inventory automatically every 30 seconds, rather than every 5 minutes.
* Clicking "transfer items" in the Infusion tool will now always move them to the active character.
* The infusion tool will now include locked items as potential infusion targets even if the checkbox isn't checked (it still affects what can be a source item).
* If you are at maximum light, DIM now alerts you when vendors are selling maximum light gear and engrams, courtesy of VendorEngrams.xyz.

# 4.65.0 (2018-08-12)

# 4.64.0 (2018-08-05)

# 4.63.0 (2018-07-29)

* Fixed a bug that could cause iOS Safari to hang.

# 4.62.0 (2018-07-22)

* Xur has been removed from the header in D1. Find him in the Vendors page.

# 4.61.0 (2018-07-15)

* Fix a bug that would leave behind stackable items when moving certain loadouts like "Gather Reputation Items".
* The is:haspower search works once again.
* The is:cosmetic search will now work for Destiny 2.
* Added is:prophecy search which will return all prophecy weapons from CoO.
* Added is:ikelos search which will return all ikelos weapons from Warmind.

# 4.60.0 (2018-07-08)

* Farming mode won't try to move unmovable reputation tokens.
* Filters like stat:recovery:=0 now work (they couldn't match stat values of zero before).
* Checking with VendorEngrams.xyz to see if 380 drops may be right for you.

# 4.59.0 (2018-07-01)

* New iOS app icons when you add to home screen.
* Ornaments now show additional reasons why you can't equip them.
* The is:inloadout search works once again.
* Fix a bug where the item popup could hang iOS Safari in landscape view.
* Add a link to lowlines' Destiny map for collecting ghost scannables, latent memories, and sleeper nodes.

# 4.58.0 (2018-06-24)

* Factions now show seasonal rank instead of lifetime rank.
* Vendors show their faction rank next to their reward engrams.
* Factions in the progress page also link to their vendor.
* Quest keys in your Pursuits now show their quantity. They're still on the Progress page.

# 4.57.0 (2018-06-17)

* Item sizing setting works in Edge.
* Lock and unlock won't get "stuck" anymore.

# 4.56.5 (2018-06-11)

* Fix for item popups not working

# 4.56.0 (2018-06-10)

* Add "is:hasshader" search filter to select all items with shaders applied.
* Fixed some bugs in older Safari versions.
* Errors on Progress, Collections, and Vendors pages won't take out the whole page anymore, just the section with the error.
* Fix bugs where a stray "0" would show up in odd places.
* Align Progress columns better for accounts with fewer than 3 characters.

# 4.55.0 (2018-06-03)

* Displaying available rating data in spreadsheet export.
* Correctly display masterwork plug objectives - check the "Upgrade Masterwork" plug for catalyst updates.
* The Collections page now shows progress towards unlocking ornaments. Due to restrictions in the API, it can only show ornaments that go with items you already have.

# 4.54.0 (2018-05-27)

* Fix the display of crucible rank points.
* Fix faction rank progress bars on D1.
* Compare view includes perks and mods for D2 items.

# 4.53.0 (2018-05-20)

* Add previews for engrams and other preview-able items.
* Display Crucible ranks on the progress page.
* Add emotes back to the collections page.
* Remove masterwork objectives that never complete.
* Fix loading loadouts the first time you open a character menu.
* Fix exporting CSV inventories in Firefox.

# 4.52.0 (2018-05-13)

* Collection exotics are no longer duplicated. They are also sorted by name.
* Updated max power to 380.
* Vendors and collections will no longer show items exclusive to platforms other than the current account's platform.
* Fix masterworks not showing as masterworks.
* Set the max base power depending on which DLC you own.

# 4.51.2 (2018-05-09)

* Handle the Warmind API bug better, and provide helpful info on how to fix it.

# 4.51.1 (2018-05-08)

* Fix progress page not displaying after the Warmind update.

# 4.51.0 (2018-05-06)

* Fix a bug where having mods, shaders, or materials in the postmaster might make it impossible to move any mod/shader/material into or out of the vault.
* Add links to Ishtar Collective on items with lore.

# 4.50.0 (2018-04-30)

* The settings page now shows how much of your local storage quota is being used by DIM (if your browser supports it).
* Add search filters based on character location on dim (is:inleftchar / inmiddlechar / inrightchar) and for vault (is:invault) and current/last logged character (incurrentchar), that is marked with a yellow triangle.
* Fixed a bug where the "Restore Old Versions" tool wouldn't actually let you see and restore old versions.

# 4.49.1 (2018-04-23)

* Fix loadouts.

# 4.49.0 (2018-04-22)

* The DIM changelog popup has moved to a "What's New" page along with Bungie.net alerts and our Twitter feed. We also moved the "Update DIM" popup to the "What's New" link.
* Fix moving mods and shaders from the postmaster.
* Remove "Take" button from stackables in the postmaster.
* The Collections page now has a link to DestinySets.com.

# 4.48.0 (2018-04-15)

* You can specify game modes for reading and making ratings and reviews.
* Full General Vault, Mods, and Shaders buckets are highlighted in red.
* Adding DIM to your home screen on iOS was broken for iOS 11.3. It's fixed now!

# 4.47.0 (2018-04-09)

# 4.46.0 (2018-04-02)

* Added a page to browse and restore old revisions of Google Drive data.
* Emblems now show a preview of their nameplate in the item details popup.
* New Vendors page shows all the items you can buy from various vendors.
* New Collections page shows your exotics, emotes, and emblems kiosks.
* Engram previews from the faction display and vendors pages show what could be in an engram.
* Keyword search now includes item descriptions and socket perk names and descriptions.

# 4.45.0 (2018-03-26)

* Searching mods and perks in D2 now searches non-selected perks as well.
* Perks are in the correct order again (instead of the selected one being first always).
* Non-purchasable vendor items are displayed better.
* Storage settings break out loadouts and tags/notes between D1 and D2 items.
* A new revisions page allows you to restore old versions of settings from Google Drive.
* Emblems show a preview of the nameplate graphic.
* Fix "is:dupelower" to only affect Weapons/Armor
* Add armor stats to the "stat:" filter (in D2 only)
* Add ":=" comparison to the text complete tooltip

# 4.44.0 (2018-03-19)

* Fixed the "recommended perk" being wrong very often.
* Improved the display of perks, shaders, and mods on items. Improved the popup details for those items as well - this includes ornament unlock progress.
* Stackable items like mods and shaders have less chance of being left behind during search transfers.
* Put back "Make Room for Postmaster" in D1 - it was removed accidentally.
* Items matching a search are now more highlighted. Removed "Hide Unfiltered Items" setting.

# 4.43.0 (2018-03-12)

* Fix some cases where moving stacks of items would fail.
* Fix "Gather Reputation Items" from not gathering everything.
* More items can be successfully dragged out of the postmaster.

# 4.42.0 (2018-03-05)

* Compare tool shows ratings, and handles missing stats better.
* Fixed display of masterwork mod and ornaments.
* Remove Auras from inventory since they're part of Emblems now.
* Fancy new emblems show all their counters correctly.
* Improved moving mods, shaders, and consumables via search loadouts. They can now go to any character (not just the active one) and aren't limited to 9 items.
* Pausing over a drop zone to trigger the move-amount dialog works every time now, not just the first time.

# 4.41.1 (2018-02-19)

* Fix dupelower logic.
* Fixed bugs preventing DIM from loading in some browsers.
* See previews of the items you'll get from faction packages and Xur from links on the Progress page.

# 4.41.0 (2018-02-19)

* Mobile on portrait mode will be able to set the number of inventory columns (the icon size will be resized to accommodate).
* You can now check your emblem objectives.
* Armor mods show more info.
* Destiny 1 transfers are faster.
* DIM is better at equipping exotics when you already have exotic ghosts, sparrows, and ships equipped.
* Pulling an item from the postmaster updates the list of items quickly now.
* Navigation from "About" or "Backers" back to your inventory works.
* is:dupelower breaks ties more intelligently.

# 4.40.0 (2018-02-12)

# 4.39.0 (2018-02-05)

* Fixed random loadout feature taking you to a blank page.

# 4.38.0 (2018-01-31)

* Fixed display of Clan XP milestone.
* DIM's logic to automatically move aside items to make room for what you're moving is smarter - it'll leave put things you just moved, and it'll prefer items you've tagged as favorites.
* In D2, "Make room for Postmaster" has been replaced with "Collect Postmaster" which pulls all postmaster items we can onto your character. You can still make room by clicking "Space".
* Fix pull from postmaster to clear exactly enough space, not too many, but also not too few.
* Accounts with no characters will no longer show up in the account dropdown.
* Item tagging via keyboard should be a little more international-friendly. Calling the help menu (via shift+/) is too.
* Fixed XP required for well-rested perk after the latest Destiny update.

# 4.37.0 (2018-01-29)

* Masterwork differentiation between Vanguard / Crucible, highlight of stat being affected by MW.
* The "Well Rested" buff now appears as a Milestone on your Progress page.
* Nightfall modifiers are shown on the Progress page.
* Storage (Google Drive) settings have moved to the Settings page.
* You can configure a custom item sorting method from the Settings page.
* Improved display of the account selection dropdown.

# 4.36.1 (2018-01-22)

* Attempt to fix error on app.
* Moving an item from the postmaster will now only clear enough space for that one item.

# 4.36.0 (2018-01-22)

* Attempt to fix error on app.

# 4.35.0 (2018-01-22)

* The Settings page has been redesigned.
* Your character stats now update live when you change armor.
* New settings to help distinguish colors for colorblind users.
* DIM should load faster.
* DIM won't try to transfer Faction tokens anymore.

# 4.34.0 (2018-01-15)

* Sorting characters by age should be correct for D2 on PC.
* The infusion fuel finder now supports reverse lookups, so you can choose the best thing to infuse a particular item _into_.
* Labeled the Infusion Fuel Finder button.
* Trace Rifles are highlighted again on is:autorifle search.
* Factions that you can't turn in rewards to are now greyed out. We also show the vendor name, and the raw XP values have moved to a tooltip.
* The settings page has been cleaned up and moved to its own page.

# 4.33.1 (2018-01-09)

* Fix DIM loading on iOS 11.2.2.

# 4.33.0 (2018-01-08)

* A brand new Progress page for Destiny 2 displays your milestones, quests, and faction reputation all in one place. That information has been removed from the main inventory screen.
* We've changed around the effect for masterworks a bit more.

# 4.32.0 (2018-01-02)

* Added hotkey for search and clear (Shift+F).
* Masterworks show up with an orange glow like in the game, and gold borders are back to meaning "has power mod".
* Mercury reputation items are now handled by farming mode and gather reputation items.
* Tweak max base power / max light calculations to be slightly more accurate.
* Display D2 subclass talent trees. We can't show which ones are selected/unlocked yet.
* Moving items on Android should work better.
* Rotating to and from landscape and portrait should be faster.
* Fix quest steps showing up in the "haspower" search.
* Do a better job of figuring out what's infusable.
* Added a reverse lookup to Infusion Fuel Finder.

# 4.31.0 (2017-12-25)

* "is:complete" will find completed rare mod stacks in Destiny 2.

# 4.30.0 (2017-12-18)

* NEW - Revamped rating algorithm for D2 items.
* Fixed a bug trying to maximize power level (and sometimes transfer items) in Destiny 2.
* When hovering over an icon, the name and type will be displayed
* Allowing more exotic item types to be simultaneously equipped in Destiny 2
* Initial support for masterworks weapons.
* Fixed reporting reviews in Destiny 2.
* Fixed item filtering in Destiny 2.

# 4.29.0 (2017-12-13)

* Added Mercury reputation.
* Added Crimson Exotic Hand Canon.

# 4.28.0 (2017-12-11)

* NEW - Move items from the postmaster in DIM!

# 4.27.1 (2017-12-05)

* Key for perk hints in D2.
* Fixed bug loading items with Destiny 2 v1.1.0.

# 4.27.0 (2017-12-04)

* Added setting to pick relevant platforms for reviews.
* Fix review area not collapsing in popup.
* Fix display of option selector on reviews tab when detailed reviews are disabled.

# 4.26.0 (2017-11-27)

* Don't show community best rated perk tip if socket's plugged.
* is:haslevel/haspower (D1/D2) fix in cheatsheet.
* Fix mobile store pager width

# 4.25.1 (2017-11-22)

* Added Net Neutrality popup.

# 4.25.0 (2017-11-20)

# 4.24.1 (2017-11-13)

# 4.24.0 (2017-11-13)

* Bungie has reduced the throttling delay for moving items, so you may once again move items quickly.

# 4.23.0 (2017-11-06)

# 4.22.0 (2017-10-30)

* Add a 'bulk tag' button to the search filter.
* Add basepower: filter and is:goldborder filter.
* Fix filtering in D1.
* Add a button to clear the current search.
* Fix moving partial stacks of items.
* Fixed "transfer items" in the Infusion Fuel Finder.
* Giving hints about the community's favorite plugs on D2 items.

# 4.21.0 (2017-10-23)

* Community reviews (for weapons and armor) are in for Destiny 2 inventory.
* Charting weapon reviews.
* Fixed the shadow under the sticky characters bar on Chrome.
* Add an option to farming mode that stashes reputation items in the vault.
* Add a new smart loadout to gather reputation items for redemption.
* Scroll the loadout drawer on mobile.
* Show character level progression under level 20 for D2.
* Stacks of three or more rare mods now have a yellow border

# 4.20.1 (2017-10-16)

* Fixed an error when trying to space to move items.

# 4.20.0 (2017-10-16)

* Sort consumables, mods, and shaders in a more useful way (generally grouping same type together, alphabetical for shaders).
* Show the hidden recoil direction stat.
* Link to DestinyDB in your language instead of always English.
* Updated documentation for search filters.
* Fixed logic that makes room for items when your vault is full for D2.

# 4.19.2 (2017-10-11)

* Keyword searches now also search on mod subtitles, so `is:modifications helmet void` will bring only Helmet Mods for Void subclass.
* Add Iron Banner reputation.

# 4.19.1 (2017-10-10)

* Fix landscape orientation not working on mobile.
* Fix D1 stats in loadout builder and loadout editor.

# 4.19.0 (2017-10-09)

* Added `stack:` to search filters for easier maintenance of modifications.
* Add missing type filters for D2 (try `is:modifications`)!
* Bring back keyboard shortcuts for tagging (hit ? to see them all).
* The "Max Light" calculation is even more accurate now.
* Added `PowerMod` column to CSV export indicating whether or not a weapon or piece of armor has a power mod
* Support sorting by base power.
* Hide "split" and "take" button for D2 consumables.
* OK really really fix the vault count.
* Fix showing item popup for some D1 items.
* Changed how we do Google Drive log-in - it should be smoother on mobile.
* Completed objectives will now show as "complete".
* Bring back the yellow triangle for current character on mobile.
* Updated `is:dupelower` search filter for items to tie break by primary stat.

# 4.18.0 (2017-10-02)

* Updated `is:dupelower` search filter for items with the same/no power level.
* Fix some issues with Google Drive that might lead to lost data.
* Really fix vault counts this time!

# 4.17.0 (2017-09-29)

* Fix bug that prevented pinned apps in iOS from authenticating with Bungie.net.

# 4.16.2 (2017-09-29)

* Added `is:dupelower` to search filters for easier trashing.
* Added missing factions to the reputation section for Faction Rally.
* Fix in infusion calculator to correctly consider +5 mod
* Fix for CSV export (e.g.: First In, Last Out in 2 columns)

# 4.16.1 (2017-09-26)

* Bugfixes for iOS 10.0 - 10.2.

# 4.16.0 (2017-09-25)

* Added item type sort to settings group items by type (e.g. all Sniper Rifles together).
* Reputation emblems are the same size as items now, however you have item size set.
* Shaders show up in an item's mods now.
* Transfering search loadouts is more reliable.
* Fixed a serious bug with storage that may have deleted your tags and notes. It's fixed now, but hopefully you had a backup...
* Highlight mods that increase an item's power with a gold border. New 'is:powermod' search keyword can find them all.
* Phone mode should trigger even on really big phones.
* More places can be pressed to show a tooltip.
* Fixed showing quality for D1 items.
* D2 subclasses are diamonds instead of squares.
* Max Base Power, Mobility, Resilience, and Recovery are now shown for each character.
* Legendary shards have the right icon now.
* Fix newly created loadouts showing no items.
* Inventory (mods, shaders, and consumables) in your vault now show up separated into the vault, and you can transfer them to and from the vault.
* Search keywords are now case-insensitive.
* You can now lock and unlock D2 items.
* Equipping an exotic emote won't unequip your exotic sparrow and vice versa.
* Item popups aren't weirdly tall on Firefox anymore.
* Armor stats now match the order in the game.
* Infusion calculator now always gives you the full value of your infusion.
* Show a warning that your max light may be wrong if you have classified items.
* CSV export for D2 weapons and armor is back.
* Add text search for mods and perks.
* Add "Random Loadout" to D2. You gotta find it though...

# 4.15.0 (2017-09-18)

* D2 items with objectives now show them, and quests + milestones are displayed for your characters.
* Custom loadouts return for D2.
* D2 items now display their perks and mods.
* DIM won't log you out if you've been idle too long.
* Swipe left or right anywhere on the page in mobile mode to switch characters.
* If you have lots of inventory, it won't make the page scroll anymore.
* Power level will update when you change equipment again.
* Searches will stay searched when you reload info.
* Max light loadout won't try to use two exotics.
* Farming mode looks better on mobile.
* If you're viewing a non-current character in mobile, it won't mess up on reload anymore.
* You can tag and write notes on classified items to help remember which they are.
* The Infusion Fuel Finder is back for D2.
* The "Max Light" calculation is more accurate now.
* Mods now show more detail about what they do.

# 4.14.0 (2017-09-14)

* Added back in Reputation for D2.
* Max Light Loadout, Make Room for Postmaster, Farming Mode, and Search Loadout are all re-enabled for D2.
* Classified items can be transferred!
* Fixed search filters for D2.
* Show hidden stats on D2 items.
* D2 inventory (mods, shaders, etc) now take the full width of the screen.

# 4.13.0 (2017-09-09)

* DIM will remember whether you last used D2 or D1.
* Lots of DIM functionality is back for D2.
* We now highlight the perks from high community reviews that you don't have selected.

# 4.12.0 (2017-09-05)

* Early Destiny 2 support! We have really basic support for your Destiny 2 characters. Select your D2 account from the dropdown on the right. This support was built before we even got to start playing, so expect some rough edges.
* There's a new phone-optimized display for your inventory. See one character at a time, with larger items. Swipe between characters by dragging the character header directly.
* Info popups aren't gigantic on mobile anymore.
* Fix a case where changes to preferences may not be saved.

# 4.11.0 (2017-09-02)

* Fix a case where DIM wouldn't work because auth tokens had expired.

# 4.10.0 (2017-08-26)

* You can flag reviews for being offensive or arguing or whatever. Be helpful but also be nice.
* Remove the browser compatibility warning for Opera and prerelease Chrome versions.

# 4.9.0 (2017-08-19)

* No changes!

# 4.8.0 (2017-08-12)

* No changes!

# 4.7.0 (2017-08-05)

* Made loadout builder talent grids tiny again.
* If you autocomplete the entire filter name and hit enter, it will no longer hang the browser.
* Updated the About page and FAQ.
* Fixed a case where DIM would fail to load the latest version, or would load to a blank page unless force-reloaded.
* Added some helpful info for cases where DIM might fail to load or auth with Bungie.net.
* Added a warning when your browser is not supported by DIM.
* DIM no longer supports iOS 9.

# 4.6.0 (2017-07-29)

* Fix a bug where the popup for Xur items was below Xur's own popup.
* Hiding community rating for items with only one (non-highlighted) review.
* The first item in the search autocompleter is once again selected automatically.
* If you don't have the vault width set to "auto", the inventory is once again centered.

# 4.5.0 (2017-07-22)

* Added "reviewcount" filter to filter on the number of reviews on an item.
* Fix slight horizontal scroll on inventory view.
* On mobile, tapping outside of dialogs and dropdowns to dismiss them now works.
* The item detail popup now does a better job of fitting itself onto the screen - it may appear to the left or right of an item now!
* Press on a talent grid node to read its description. The same goes for the stats under your character.
* Subclasses now have the correct elemental type in their header color.
* Drag and drop should be much smoother now.
* You can select Destiny 2 accounts from the account dropdown now - but won't do much until Destiny 2 is released and we have a chance to update DIM to support it!

# 4.4.0 (2017-07-15)

* New filters for ornaments - is:ornament, is:ornamentmissing, is:ornamentunlocked
* Fixed a bug where item data would not respect your language settings.
* Weapon reviews now show up immediately, and can be edited.
  - If you have been less than friendly, now would be a very good time to edit yourself and put a better foot forward.
* Sorting reviews to support edits and highlighted reviews.
* Logging out now brings you to Bungie's auth page, where you can choose to change account or not.
* Fixed "Clear New Items" not working.
* Adjusted the UI a bunch to make it work better on mobile. Just a start - there's still a long way to go.
* The announcement about DIM being a website won't show more than once per app session.
* Google Drive syncing is a bit smoother.
* Fixed a case where you couldn't create a new class-specific loadout.
* On Firefox, the new-item shines don't extend past the item anymore.
* Do a better job of refreshing your authentication credentials - before, we'd sometimes show errors for a few minutes after you'd used DIM for a while.
* The filters help page has been localalized.
* Separate the light: and level: filters. level now returns items matching required item level, light returns items matching the light level.

# 4.3.0 (2017-07-08)

* DIM is now just a website - the extension now just sends you to our website. This gives us one, more cross-platform, place to focus on and enables features we couldn't do with just an extension. Don't forget to import your data from the storage page!
* Scrolling should be smoother overall.
* Vendor weapons now show reviews.
* Add a "sort by name" option for item sorting.
* In Google Chrome (and the next version of Firefox), your local DIM data won't be deleted by the browser in low storage situations if you visit DIM frequently.
* Ratings will no longer disappear from the item details popup the second time it is shown.
* Info popups should do a better job of hiding when you ask them to hide.

# 4.2.4 (2017-07-03)

* Work around a Chrome bug that marked the extension as "corrupted".

# 4.2.3 (2017-07-03)

* Fix log out button.
* Put back the accidentally removed hotkeys for setting tags on items.
* Fixed some visual goofs on Firefox.
* Fix a case where DIM would never finish loading.

# 4.2.2 (2017-07-02)

* Fix DIM being invisible on Firefox
* Fix a case where DIM would never finish loading.
* Put back the accidentally removed hotkeys for setting tags on items.

# 4.2.1 (2017-07-01)

* Actually turn on Google Drive in prod.

# 4.2.0 (2017-07-01)

* Exclude all variants of 'Husk of the Pit' from 'Item Leveling' loadout.
* Add a new storage page (under the floppy disk icon) for managing your DIM data. Import and export to a file, and set up Google Drive storage to sync across machines (website only). You can import your data from the Chrome extension into the website from this page as well.
* The settings page has been cleaned up and reworded.
* Added missing Trials emblems and shaders to the is:trials search.
* DIM should look more like an app if you add it to your home screen on Android.
* DIM will show service alerts from Bungie.

# 4.1.2 (2017-06-25)

* Add a "Log Out" button in settings.

# 4.1.1

* Fixed changelog popup too large to close.

# 4.1.0 (2017-06-24)

* Fixed the logic for deciding which items can be tagged.
* Fix "Make room for postmaster".
* Record books have been moved out of the inventory into their own page. Get a better look at your records, collapse old books, and narrow records down to only those left to complete.
* Fix changing new-item shine, item quality display, and show elemental damage icon preferences. They should apply immediately now, without a reload.x
* Localization updates.
* Fixed objective text in the record book floating above stuff.
* Fixed displaying record objectives that are time-based as time instead of just a number of seconds.
* When pinned to the iOS home screen, DIM now looks more like a regular browser than an app. The upside is you can now actually authorize it when it's pinned!
* Loadouts with a complete set of equipped armor now include a stat bar that will tell you the stat tiers of the equipped loadout pieces.
* Loadouts with non-equipping items now won't _de-equip_ those items if they're already equipped. #1567
* The count of items in your loadout is now more accurate.
* DIM is now better at figuring out which platforms you have Destiny accounts on.
* DIM is faster!
* Added Age of Triumph filters is:aot and is:triumph
* Add gunsmith filter is:gunsmith
* Updated filters to remove common items for specific filters (e.g. is:wotm no longer shows exotic items from xur, engrams, and planetary materials)
* Loadout Builder's equip button now operates on the selected character, not your last-played character.
* Loadout Builder no longer has equip and create loadout buttons for loadouts that include vendor items.
* Loadout Builder is faster.
* DIM has a new logo!
* Elemental damage color has been moved to a triangle in the upper-left corner of your weapon.
* See community weapon ratings in DIM, and submit your own! Weapon ratings can be turned on in Settings, and will show up on your individual weapons as well as in the details popup. You can submit your own reviews - each review is specific to the weapon roll you're looking at, so you know whether you've got the god roll.

# 3.17.1

* Fixed a bug with the display of the amount selection controls in the move popup for stackable items.
* Localization updates
* Moved the "VCR" controls for stackable item amount selection to their own row.

# 3.17.0

* Fixed the perk selection in Loadout Builder. #1453
* Integrated Trials-centric weapon reviews (and the ability to rate your own gear (and make comments about your gear)). Done in conjunction with destinytracker.com.
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

# 3.14.1 (2016-12-06)

* Internationalization updates.
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

# 3.13.0 (2016-10-31)

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

# 3.11.1 (2016-10-04)

* Fixed an issue with farming mode where users without motes, 3oC, coins, or heavy could not use farming mode.
* Fixed an issue where classified items would not show up in the UI.

# 3.11.0 (2016-10-04)

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
* Move ornaments in between materials and emblems.
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

# 3.10.6 (2016-09-23)

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
* Loadouts for multi-platform users will now save selected and equipped items for both platforms. Previously, when switching platforms, loadouts would remove items from the loadout for the opposite platform.

# 3.10.3

* Fixed a "move-canceled" message showing up sometimes when applying loadouts.
* Bugged items like Iron Shell no longer attempt to compute quality. They'll fix themselves when Bungie fixes them.
* Fixed "Aim assist" stat not showing up in CSV (and no stats showing up if your language wasn't English).
* We now catch manifest updates that don't update the manifest version - if you see broken images, try reloading DIM and it should pick up new info.
* Worked around a bug in the manifest data where Ornament nodes show up twice.
* DIM won't allow you to move rare Masks, because that'll destroy them.
* The "Random" auto loadout can now be un-done from the loadout menu.
* For non-variable items (emblems, shaders, ships, etc) in a loadout, DIM will use whichever copy is already on a character if it can, rather than moving a specific instance from another character.

# 3.10.2 (2016-09-10)

* Fixed error building talent grid for Hawkmoon.
* Don't attempt to build record books when advisors are not loaded.
* Dragged items now include their border and light level again.
* New-item overlays have been restored (enable in settings).
* Re-enable record book progress.
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
* Added ability to and filters for track or untrack quests and bounties.
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
* For item leveling don't prefer unlevelled equipped items on other characters.
* Various Loadout builder bug fixes and performance updates.

# 3.7.1

* Various Loadout builder bug fixes and performance updates.

# 3.7.0

* Added new armor/loadout tier builder.
* Fix for all numbers appearing red in comparison view.
* Updated to latest stat estimation formula.
* Use directive for percentage width.

# 3.6.5

* Fix an issue where warlocks would see loadouts for all the other classes.

# 3.6.2 & 3.6.3 (2016-05-23)

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

# 3.6.0 (2016-05-03)

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

# 3.5 (2016-04-11)

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
* Loadouts can now contain materials and consumables. Add or remove 5 at a time by holding shift while clicking. When the loadout is applied, we'll make sure your character has _at least_ that much of the consumable.
* Loadouts can now contain 10 weapons or armor of a single type, not just 9.
* When making space for a loadout, we'll prefer putting extra stuff in the vault rather than putting it on other characters. We'll also prefer moving aside non-equipped items of low rarity and light level.
* The is:engram search filter actually works.
* Fixed an error where DIM would not replace an equipped item with an instance of the same item hash. This would cause an error with loadouts and moving items. [448](https://github.com/DestinyItemManager/DIM/issues/448)
* Loadouts can now display more than one line of items, for you mega-loadout lovers.
* Items in the loadout editor are sorted according to your sort preference.

# 3.3.3 (2016-03-08)

* Infusion calculator performance enhancements
* Larger lock icon
* Completed segments of Intelligence, Discipline, and Strength are now colored orange.

# 3.3.2 (2016-03-04)

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

# 3.3.1 (2016-02-19)

* Updated the manifest file.

# 3.3 (2016-02-15)

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
* Removed Crimson Days theme. It will return.
* Fixed issue at starts up when DIM cannot resolve if the user is logged into Bungie.net.

# 3.2.3

* Updated Crimson Days Theme.
* Removed verge.js

# 3.2.2

* Updated Crimson Days Theme.

# 3.2.1 (2016-02-04)

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
