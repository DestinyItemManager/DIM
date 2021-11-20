# Loadout Optimizer

The optimizer is hard on resources and thus we have gone to a lot of effort to make it faster at runtime. Doing this has made the logic quite hard to follow. This README aims to help contributers get around the optimizer and figure out where changes need to be made.

## High level overview of data flow

To help paint a picture of what is happening this is a high level overview of the steps we take to figure out the sets displayed to a user in the optimizer

1. Get items usable in the optimizer
1. Filter items based on pinned, exotic, header search filter, and slot specific mods
1. Group similar items together, only a single item of each group will be sent to processing
1. Map items to a more optimized form for processing, this includes minimal attributes from `DimItem` and calculated attributes such as energy used by slot specific mods
1. Send items to a web worker for processing
1. Cut out the items with the worst stats so we have less than 2,000,000 combinations (broswers will fall over due to memory constraints)
1. Loop over all combinations and eliminate ones with worse stats or that can't fit mods
1. If a set looks good we add it to a tracker class, after a certain number are tracked we drop the worst one each time a new one is added
1. The web worker returns the results, we hydrate the initial `DimItem`s and add any similar items from the previous grouping step
1. The hydrated sets are rendered and at this time we work out the optimal mod assignment to display to the user

## A more indepth explanation with a guide to functions and modules

Now lets get a little more in depth and look at the journey we take through specific modules and functions

1. It all starts in `LoadoutBuilder`, before the component is even rendered we reduce the items it has access to in `mapStateToProps`. Here we remove everything except post-shadowkeep armor (armor 2.0).
1. Next those items are sent into `item-filter#filterItems`. Here we reduce items as best we can as it removes items being sent to the web worker. We filter on the following
    - Based on the function provided by the filter in the search bar
    - If an exotic is selected we filter out everything that isn't that exotic
    - If an item is pinned we only allow that item
    - If no exotics are allowed we remove all exotics
    - If no items are left after this we cancel all filtering up to this point
    - Last we filter out items that have the wrong energy for the combination of locked mods and armor upgrade selection. This is done last as we need it to be done for the processing to work correctly.
1. Grouping is up next and this is done in `process/useProcess#groupItems`. The whole point of this step is to try and reduce the number of items sent to the web worker by grouping together items that are similar and only sending one item to the web worker.

    Afterwards the other items from the group are added to the appropriate sets and can be selected via the swap icon in a given set.

    The grouping is a little complicated as it aims to group as many items as it can, class items are a good example here. For example, if you have no mods locked there are essentially two types of class items, masterworked and non-masterworked as masterowked have stats.

    This needs to get more complicated as we start locking mods as energy type and activity mod slot type (e.g. raid or nightmare) become important in the processing algorithm. At this point it's best to just go and read the `groupItems` function and it's comment to get a better idea at what it does.
1. Now we map items down to a smaller footprint with some calculated values. The web worker essentially works over a Post request so smaller objects hear mean less data to be transferred. Also precalculating some values saves us doing it in the heavy loop in the web worker.

    This is again done in `process/useProcess#useProcess` but the mappers live in `process/mappers`. We map both `DimItem`s and `PluggableInventoryItemDefinition`s as we need both in the web worker.

    Notably here we calculate the following values for items
    - The energy used from slot specific mods
    - The energy capacity available with the selected armor upgrades, if we have an option that assumes items are masterworked this will always be 10
    - The energy type available with the selected armor upgrades and locked mods, if an item is allowed to swap energy type this will be the `Any` type
    - The tags of mods which can be socketed into the item e.g. VoG raid mods or nightmare mods
1. Next we send all the mapped items and various other values to the web worker.The web worker is created in `process/useProcess#useProcess` but the scipt is it runs lives in `process-worker/process#process` because it needs a special tsconfig setup for web workers.
1.
