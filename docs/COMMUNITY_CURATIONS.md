Community Curations (Wish Lists)
================================

If you've ever wanted to have DIM automatically look for specific drops (or share your list of ideal drops with other folks), this will let you do just that.


You can use https://wishlists.littlelight.club/ to create a wish list, or you can build it from a text file
To build a list of your own, go to [Little Light's Wishlist Manager](https://wishlists.littlelight.club/) - it lets you look for items and select the perks that you're looking for.

If there's a few rolls of that Better Devils that you've got your eye on, feel free to put bunches of them in your file. We'll match the first of them that we can find. If you want one Better Devils roll for PvE and another for PvP, put one in a file for PvE items and the other in a file for PvP items and load them one at a time. Don't worry about Enhanced perks - select the regular version and Enhanced versions will be matched too.

Once you've got your list put together, load it up (in the rating/review menu) and look for the green thumbs (or search with `is:wishlist`). If you click on the item, it will tell you what perks the curator picked out.

Feel free to share your wish lists with your fireteam, the raid you're sherpa-ing, your gambit buddies, people in your crucible sweats... you get the idea.

## Premade Lists

If you want to hit the ground running, you can find a collection of breakdowns from u/pandapaxxy and u/mercules904 translated into wish lists over on [48klocs' DIM wish list sources - in particular, the voltron.txt file (that includes armor recommendations from u/HavocsCall) will probably be of interest](https://github.com/48klocs/dim-wish-list-sources). Feel free to mix and match the individual files as you like.

## Keeping up-to-date with premade lists

If you want to DIM to use a premade list and have it subscribe to any updates made to it, you can do that through the settings menu. The wish list will automatically update within 24 hours of the source updating. I'm biased, and recommend using `https://raw.githubusercontent.com/48klocs/dim-wish-list-sources/master/voltron.txt` - you can bring your own, but it needs to be hosted on GitHub, otherwise DIM will refuse to load it (we don't trust just any host).

If you choose to use an external source, that selection will override any file list you may have chosen to use (and vice versa). Clicking "clear wish lists" will clear both the file and external source.

## Creating your own wish list manually

Wish lists are just a text file. You can create your own by adding a single roll at a time, one by one, in a file. Each roll goes on its own line. If you have a roll in your inventory that you'd like to add to your wish list to share, you can do it from inside of DIM. Find your item, and click the name of the item to bring up the Armory view. Configure all the perks the way you want, then copy the wish list line from the text box below the perks.

## Title and Description
You can optionally add a title and/or description to your wish lists. For title, add a line that looks like...

`title:This is the title of my wish list file.`

And for description, add a line that looks like...

`description:Here is a slightly longer description of just what it includes.`

We only look for title/description in the first few lines of your file, so don't put it at the bottom. If you have more than one title/description in a file, we'll use the first one we find.

## Comments

If you want to add comments in your text file on separate lines, go ahead! We'll ignore any line that isn't a link to banshee-44, so you can put notes for which item+roll you're talking about.

## Notes

If you want to add searchable notes, end the line with `#notes:Here are some notes`.

## Block Notes

You can add notes to a block of rolls. To open block notes, enter a line that looks like `//notes:These are notes that will apply to everything that immediately follows.` The notes (everything after the colon) will apply to everything that follows them. The first line that isn't recognized as a valid item (or a new block note) closes the block notes. If block notes are open and an individual item has notes on it, the item's notes will be used instead of the block notes.

## Constructing wish list rolls

A wish list roll line looks like this:

`dimwishlist:item=1234&perks=456,567`

If you want notes, it'd be...

`dimwishlist:item=1234&perks=456,567#notes:pvp or gambit`

Do not expect it to be flexible with casing or naming (it's not).

`item`'s value is expected to be the manifest hash for the item, `perks` are one or more perk hashes, separated by commas.

To find these hashes, use the mighty [Destiny Sets Data Explorer](https://data.destinysets.com/). You can search for items, perks and other things by typing their name in the search bar. Focus on things named "Inventory Item" when picking them out. The sandbox perk and collectible versions of perks won't be found in your inventory. Don't worry about Enhanced perks - select the regular version and Enhanced versions will be matched in your wishlist automatically.

Once you look up an item that you want to keep an eye out for, copy its hash (the number to the right of the name). That becomes the value for `item`.

Repeat the same for each of the `perks` you're interested in. Again, you want the `InventoryItem` version of the perk. If you want to specify multiple perks, separate them with a comma.

This lets you express things like "if you see a Bygones with outlaw and kill clip on it, that's a keeper, no matter what else it does or doesn't have."

Additionally, I've added a wildcard item ID - `-69420` **(nice)**. If you give your `item` that value, we'll look for the perks you specify in that line on every item in your inventory. If all of the specified perks match, it's wish listed.

If a wildcard is too broad and an item is too specific, you can supply the `ItemCategoryHash` that you want to look up the perk/perk combo on in the item ID. If you know, for example, that you're looking for perks X and Y on a class item, you can specify `item=49&perks=X,Y` and we'll only look for those perks on class items. You can currently only specify one `ItemCategoryHash`, so be as general or as specific as you need with it.

This lets you do things like, for example, wish list all armor pieces that have the "enhanced heavy lifting" perk on them, or all ghosts that have "improved Dreaming City cache detector", or all armor pieces with both "rocket launcher dexterity" and "rocket launcher scavenger" on them.

If there are multiple perks for a given slot that you'd be happy to get, and further there are multiple slots where multiple perks would be nice, then [48klocs built a little tool that will help you build out all of those permutations](https://48klocs.github.io/wish-list-magic-wand/fingerwave.html).

For wishlist line items, we'll ignore comments at the end of the line. Destiny Tracker + Banshee-44 URLs are expected to be copy/paste friendly, so comments on those lines (outside of the faux-anchor notes) will break them.

As a final note, shaders/ornaments/masterworks are ignored when using URL-style item lines, but they are not ignored when using expert mode item lines.

**Trash Lists**

For expert mode rolls, we've also added "trash lists", a way to say that particular items/perk combos are undesirable, and let DIM automatically find them for you. By way of example...

`dimwishlist:item=-1234&#notes:I don't care for it.`

This would find an item with the manifest hash of 1234, put notes on it, but also mark it as undesirable (it'll give it a thumbs down in the inventory-level view), and you can search for `is:trashlist` to find it. For these rolls, perks are optional - you may want to say that, for example, all `Ten Paces` are trash. Wildcards are supported.

You should also be able to mark some `Ten Paces` as wish list and others as trash list; put the specific wish list versions at the top of your file and the generic versions at the bottom; the first roll we come across that matches will be the one we apply.