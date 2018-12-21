Community Curations (Wish Lists)
================================

If you've ever wanted to have DIM automatically look for specific drops (or share your list of ideal drops with other folks), this will let you do just that.

To build a list of your own, go to [Banshee-44.com](https://banshee-44.com/) - it lets you look for items and select the perks that you're looking for. Once you find an item that you like, copy the URL that it generates into a text file. Keep looking and finding those items that you're hunting for and paste them into that file, separating each with a new line.

If there's a few rolls of that Better Devils that you've got your eye on, feel free to put bunches of them in your file. We'll match the first of them that we can find. If you want one Better Devils roll for PvE and another for PvP, put one in a file for PvE items and the other in a file for PvP items and load them one at a time.

Once you've got your list put together, load it up (in the rating/review menu) and look for the green thumbs (or search with `is:wishlist` or `is:curated`). If you click on the item, it will tell you what perks the curator picked out.

Feel free to share your curated lists with your fireteam, the raid you're sherpa-ing, your gambit buddies, people in your crucible sweats... you get the idea.

## Linking To Banshee-44 from DIM

If you have a roll in your inventory that you'd like to add to your wish list to share, you can do it from inside of DIM. Find your item, make sure you have the perks you think are important selected (this is important!) and click the little gift icon on the top right hand corner of the item's pop-up. It'll bring you to banshee-44 to double-check if you want, or just copy and paste it into your file.

## Comments

If you want to add comments in your text file on separate lines, go ahead! We'll ignore any line that isn't a link to banshee-44, so you can put notes for which item+roll you're talking about.

## "Expert Mode"

**Please note: you're largely on your own with this option. It's called expert mode for a reason, people.**

If you're feeling particularly saucy, I've added an "expert mode" line format. You can put add lines with this alternate format in file with banshee-44 links and comments and it'll all be read together. The format looks like...

`dimwishlist:item=1234&perks=456,567`

Do not expect it to be flexible with casing or naming (it's not).

`item`'s value is expected to be the manifest hash for the item, `perks` are one or more perk hashes, separated by commas.

To find these hashes, use the mighty [Destiny Sets Data Explorer](https://data.destinysets.com/). You can search for items, perks and other things by typing their name in the search bar. Focus on things named "Inventory Item" when picking them out. The sandbox perk and collectible versions of perks won't be found in your inventory.

Once you look up an item that you want to keep an eye out for, copy its hash (the number to the right of the name). That becomes the value for `item`.

Repeat the same for each of the `perks` you're interested in. Again, you want the `InventoryItem` version of the perk. If you want to specify multiple perks, separate them with a comma.

This lets you express things like "if you see a Bygones with outlaw and kill clip on it, that's a keeper, no matter what else it does or doesn't have."

Additionally, I've added a wildcard item ID - `-69420` **(nice)**. If you give your `item` that value, we'll look for the perks you specify in that line on every item in your inventory. If all of the specified perks match, it's wish listed.

If a wildcard is too broad and an item is too specific, you can supply the `ItemCategoryHash` that you want to look up the perk/perk combo on in the item ID. If you know, for example, that you're looking for perks X and Y on a class item, you can specify `item=49&perks=X,Y` and we'll only look for those perks on class items. You can currently only specify one `ItemCategoryHash`, so be as general or as specific as you need with it.

This lets you do things like, for example, wish list all armor pieces that have the "enhanced heavy lifting" perk on them, or all ghosts that have "improved Dreaming City cache detector", or all armor pieces with both "rocket launcher dexterity" and "rocket launcher scavenger" on them.

If there are multiple perks for a given slot that you'd be happy to get, and further there are multiple slots where multiple perks would be nice, then [48klocs built a little tool that will help you build out all of those permutations](https://48klocs.github.io/wish-list-magic-wand/fingerwave.html).

For wishlist line items, we'll ignore comments at the end of the line. Banshee-44 URLs are expected to be copy/paste friendly, so comments on those lines will break them.