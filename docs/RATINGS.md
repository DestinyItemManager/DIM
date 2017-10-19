Weapon Ratings and Reviews
==========================

We've partnered with [destinytracker.com](http://destinytracker.com/) to add some features to DIM - the ability to receive weapon ratings and reviews and the ability to make item reviews.

Some of how it works should be pretty straightforward.  You load up DIM, you see ratings, you click on an item, go over to the reviews tab, then you can see other folks' discussion of gear.

## Privacy Notes

[We put together a privacy page](PRIVACY.md) to address any questions or concerns you might have about what data is being sent.

## Making / Editing Reviews

Please be polite in your reviews. No spam, no arguing with other reviewers, no nasty language. The ability to ban users is very real, but no one feels good about using it. Play nice!

When you make a review, we take note of some things above and beyond "I am rating such and such 4 stars, and here's why." We note your current perk selection and the available perks on the weapon. This is used for retrieving item reviews (we mostly care about the perks you're using when reviewing a weapon).

The reviews are selected perk-centric, but this doesn't mean that you can give one loadout of a weapon one review and another loadout another.  All reviews sent for a particular weapon you've already reviewed are considered updates to your previous review.

Deleting reviews isn't supported at this time. There are some concerns that we didn't want to address at this point (ex: do we let you delete a review if you deleted a weapon?).  It's still under consideration for future versions.

## Mechanics

In short, we do our best to recognize that not all Matador-64s are born equal.

For a given item that we're looking to fetch ratings/reviews for (currently only weapons), we ship some data over to TRN - the item ID and its full perk set. They match items based off of both ID and perk set, with some caveats.

* Non-random perk rolls are ignored.
  - This mostly applies to exotic items and some of the newer raid legendaries, where the rolls are fixed.
  - In short, a MIDA is a MIDA is a MIDA.
* Certain other perk rolls are ignored.
  - This mostly applies to primary weapons that have elemental rolls.
  - For the sake of ratings, we don't see a difference between a Stellar Vestige with void burn and solar burn.
* Scopes are currently being ignored.
  - This is a known issue; there's no perk hashes associated with them. Technical details are fun.
* New reviews take a little time to show up.
  - tl;dr - caching
* Items with one review (from a non-featured reviewer) don't show up on the summary view.
  - It'll show up on the detail view, we just want a little consensus before telling you it's a 5 star weapon.
* Perk hints - we try to correlate high scores with selected perks.
  - When you submit a rating for your items, we quietly send along the perks you currently have selected on it.
  - When you ask for ratings on an item, we take a look at those ratings that we additionally have selected perk data on.
  - We walk column by column and determine what perks were associated with what scores.
  - If there's a consensus "best" perk for that perk column and you don't currently have it activated, we'll highlight it.

You won't necessarily have the exact same roll as every item every reviewer mentions, but your available perks should match the perks they had selected when they reviewed it. If you see reviews mentioning auto-fire or some other perk your item definitely doesn't have, let us know.

## Background Philosophy

For folks who don't spend a whole bunch of time following the meta or reading reviews on Bungie.Net, Reddit, listening to podcasts, watching streamers and [Youtube videos](https://www.youtube.com/watch?v=dQw4w9WgXcQ) and... you get the idea, there's a lot of information out there, knowing what weapons will work in PvE (and especially PvP, which this is geared towards) can be daunting. DIM made armor easier to figure out (this roll is this good, I can pretty much figure out what perks I want and go) but weapons are harder to figure out for the folks who don't keep up-to-date on TTK spreadsheets.

We wanted to give DIM a way to "rate" weapons in roughly the same way it "rates" armor. The fact that you've got an 78% armor roll doesn't mean you must immediately shard it or The Destiny Gods will frown upon you, it just means that getting T12 is going to be tough. But if it's an exotic and has perks that fit your playstyle, maybe you want to run it anyway?

By the same token, knowing that you have a five star sniper rifle doesn't mean much if sniper rifles are useless in your hands. Maybe you have a scout rifle with explosive bullets that you love; the fact that no one else seems to like it doesn't mean you're a bad person for using it.

It's all a rough outline to give you some guidance as to what diamonds you have laying about in your vault and might want to dig up and play with, as well as hints about what vendor gear is for sale that you might want to buy. We would never tell you to scrap something, but if you're not great with shotguns and see that you have a two star shotgun sitting in your nearly-full vault, you can make your own decisions about it. We're trying to make it easy to get a second opinion about gear.

We're not gearing this towards the expert who can tell at a glance whether that item that just dropped is worth keeping (but we'd certainly love it if you reviewed items!), we're trying to make something that works for as many people as possible.

## More To Come (Sooner or Later)

We have ideas about things we'd like to add (displaying TTK somewhere, pros/cons, ratings per game mode, mechanisms to make it clear what perk loadouts have the best ratings for a weapon have all been discussed) for the future, but we're waiting to get community feedback, see how this is being used, and see what happens with Destiny 2.

We're trying to provide something useful to the community - if you have comments or ideas, we're listening!
