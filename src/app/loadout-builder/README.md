# Loadout Optimizer (nee Builder)

The optimizer is hard on resources and thus we have gone to a lot of effort to make it faster at runtime.
Doing this has made the logic quite hard to follow. This README aims to help contributers get around the
optimizer and figure out where changes need to be made.

## High level overview of data flow

To help paint a picture of what is happening this is a high level overview of the steps we take to figure out the sets displayed to a user in the optimizer

1. Get items usable in the optimizer
1. Filter items based on pinned, exotic, header search filter, and slot specific mods
1. Group similar items together, only a single item of each group will be sent to processing
1. Map items to a more optimized form for processing, this includes minimal attributes from `DimItem` and calculated attributes such as energy used by slot specific mods
1. Send items to a web worker for processing
1. Cut out the items with the worst stats so we have less than 2,000,000 combinations (broswers will fall over due to memory constraints)
1. Loop over all combinations and eliminate ones with worse stats or that can't fit mods.
1. If a set looks good we add it to a tracker class, after a certain number are tracked we drop the worst one each time.
1. The web worker returns the results, we hydrate the initial `DimItem`s and add any similar items from the previous grouping step
1. The hydrated sets are rendered and at this time we work out the optimal mod assignment to display to the user.

## A more indepth explanation with a guide to functions and modules

Now lets get a little more in depth and look at the journey we take through specific modules and functions

1. It all starts in `LoadoutBuilder`, before the component is even rendered we reduce the items it has access to in `mapStateToProps`. Here we remove everything except post-shadowkeep armor (armor 2.0).
1. Next those items are sent into `item-filter#filterItems`. Here
