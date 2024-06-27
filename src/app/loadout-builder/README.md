# Loadout Optimizer

The optimizer is hard on resources and thus we have gone to a lot of effort to make it faster at runtime. Doing this has made the logic quite hard to follow. This README aims to help contributors get around the optimizer and figure out where changes need to be made.

## High level overview of data flow

To help paint a picture of what is happening this is a high level overview of the steps we take to figure out the sets displayed to a user in the optimizer

1. Get items usable in the optimizer
1. Filter items based on pinned, exotic, header search filter, and slot specific mods
1. Map items to a more optimized form for processing, this includes minimal attributes from `DimItem` and calculated attributes such as energy used by slot specific mods
1. Group similar items together, only a single item of each group will be sent to processing
1. Send items to a web worker for processing
1. Loop over all combinations and eliminate ones with worse stats or that can't fit mods
1. If a set looks good we add it to a tracker class, after a certain number are tracked we drop the worst one each time a new one is added
1. The web worker returns the results, we hydrate the initial `DimItem`s and add any similar items from the previous grouping step
1. The hydrated sets are rendered and at this time we work out the optimal mod assignment to display to the user

## A more in depth explanation with a guide to functions and modules

Now lets get a little more in depth and look at the journey we take through specific modules and functions

1. It all starts in `LoadoutBuilder`, before the component is even rendered we reduce the items it has access to. Only Armor 2.0 is used (which is the bulk of the armor a player has).

1. Next those items are sent into `item-filter#filterItems`. Here we reduce items as best we can as it removes items being sent to the web worker. We filter on the following
    - Using the function provided by the filter in the search bar
    - If an exotic is selected we filter out all other items in the exotic's bucket and all exotics in other buckets
    - If an item is pinned we only allow that item
    - If no exotics are allowed we remove all exotics
    - If no items are left after this we cancel all filtering up to this point
    - Last we filter out items that have insufficient energy for the combination of locked slot-specific mods and armor upgrade selection. This is done last as we need it to be done for the processing to work correctly.

1. Now we map items down to a smaller footprint with some calculated values. The web worker essentially works over a Post request, so smaller objects here mean less data to be transferred. Also precalculating some values saves us doing it in the heavy loop in the web worker.

    This is again done in `process/useProcess#useProcess` but the mappers live in `process/mappers`. We map both `DimItem`s and `PluggableInventoryItemDefinition`s as we need both in the web worker.

    Notably here we calculate the following values for items
    - The energy used from slot specific mods
    - The energy capacity available with the selected armor upgrades, if we have an option that assumes items are masterworked this will always be 10
    - The tags of mods which can be socketed into the item e.g. VoG raid mods or nightmare mods

1. Grouping is up next and this is done in `process/useProcess#groupItems`. The whole point of this step is to try and reduce the number of items sent to the web worker.

    To do this we group together items that are similar with the intent of sending a single item of the group for processing. Afterwards the other items from the group are added to the appropriate sets and can be selected via the swap icon in a given set.

    The grouping is a little complicated as it aims to group as many items as it can, class items are a good example here. For example, if you have no mods locked there are essentially two types of class items, masterworked and non-masterworked as masterworked have stats.

    This needs to get more complicated as we start locking mods, as activity mod slot types (e.g. raid or nightmare) or even general mod slots become important in the processing algorithm. At this point it's best to just go and read the `groupItems` function and it's comment to get a better idea at what it does. It's really important to group class items because if it manages to group 10 class items into two groups, we have 80% fewer combinations to look at!

    Performing grouping after mapping makes it easier to validate that grouping happens using **all** information the process worker has access to. If we accidentally grouped items too liberally, the process worker might not report any sets because we get rid of an item that could make a difference later.

1. Next we send all the mapped items and various other values to the web worker. The web worker is created in `process/useProcess#useProcess` but the script it runs lives in `process-worker/process#process` because it needs a special `tsconfig` setup for web workers.

1. Now we loop over all the items looking for the best combinations of stats. This is nothing fancy. Just 5 levels of `for` loops and for each set we

    1. Calculate the stats for the set
    1. If the stats can't possibly fall in the filter ranges we continue onto the next set
    1. If the stats are worse then the lowest set in our `SetTracker` we exit and continue on to the next set
    1. Check to see if the locked mods can fit in the set, and if auto stat mods are enabled, whether we can pick mods to hit the stats, if not we continue on to the next set

1. Assuming a set has made it past the last step, we now add it to the `SetTracker` which is defined in `process-worker/set-tracker#SetTracker`.

    This is a class that uses an insertion sort algorithm to keep a given number of armor sets. When we add a set to this we remove the worst tracked set if we reach the limit.

1. When the results are returned from the web worker we need to get back our original `DimItem`'s. This is done by `process/mappers#hydrateArmorSet`. We just replace all the `ProcessItem`'s with their original `DimItem`'s but using a object that maps `id`'s to `DimItem`'s.

1. Finally we render the sets. During this step we also calculate the best assignment of mods for a given set.

    During the previous processing with mods, we exit as soon as we find a single mod assignment that fits in the set for performance reasons. Now we can look at all possible mod assignments and find the best assignment for the given mods and armor upgrade options.

    Note that we don't try to pick a more optimal set of auto stat mods here, we use the mods the process worker reports.

    If no sets could be found, the `NoBuildsFoundExplainer` tries to reconstruct what could've caused no sets to be found and recommends some changes to the Loadout Builder configuration.
    To facilitate this, the worker process tracks some stats about how many sets were rejected in which stage of the process.
