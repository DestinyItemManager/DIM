import {
  DestinyInventoryItemDefinition,
  DestinyProfileResponse,
  DestinyItemPlug
} from 'bungie-api-ts/destiny2';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import './collections.scss';
import { RootState } from 'app/store/reducers';
import { createSelector } from 'reselect';
import { storesSelector } from 'app/inventory/reducer';
import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { connect } from 'react-redux';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { ModCollectible } from './Mod';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { t } from 'app/i18next-t';

const armorPieceGroups = [
  1362265421, // ItemCategory "Armor Mods: Helmet"
  3872696960, // ItemCategory "Armor Mods: Gauntlets"
  3723676689, // ItemCategory "Armor Mods: Chest"
  3607371986, // ItemCategory "Armor Mods: Legs"
  3196106184 // ItemCategory "Armor Mods: Class"
];
const armorPieceDisplayOrder = [...armorPieceGroups, 4104513227]; // ItemCategory "Armor Mods"

// to-do: separate mod name from its "enhanced"ness, maybe with d2ai? so they can be grouped better
export const sortMods = chainComparator<DestinyInventoryItemDefinition>(
  compareBy((i) => i.plug.energyCost?.energyType),
  compareBy((i) => i.plug.energyCost?.energyCost),
  compareBy((i) => i.displayProperties.name)
);

interface ProvidedProps {
  profileResponse: DestinyProfileResponse;
}

interface StoreProps {
  defs?: D2ManifestDefinitions;
  buckets?: InventoryBuckets;
  ownedMods: Set<number>;
  allMods: DestinyInventoryItemDefinition[];
  modsOnItems: Set<number>;
}

function mapStateToProps() {
  const ownedModsSelector = createSelector(
    storesSelector,
    (stores) => new Set(stores.flatMap((s) => s.buckets[3313201758].map((i) => i.hash)))
  ); //                                InventoryBucket "Modifications"

  const modsOnitemsSelector = createSelector(storesSelector, (stores) => {
    const modsOnItems = new Set<number>();
    for (const store of stores) {
      for (const item of store.items) {
        if (item.isDestiny2() && item.sockets && item.sockets.categories.length > 1) {
          for (const socket of item.sockets.categories[1].sockets) {
            if (socket.plug) {
              modsOnItems.add(socket.plug.plugItem.hash);
            }
          }
        }
      }
    }
    return modsOnItems;
  });

  const allModsSelector = createSelector(
    (state: RootState) => state.manifest.d2Manifest,
    (defs) => {
      if (!defs) {
        return [];
      }
      //                                    InventoryItem "Void Impact Mod"
      const deprecatedModDescription = defs.InventoryItem.get(2988871238).displayProperties
        .description;

      return Object.values(defs.InventoryItem.getAll()).filter((i) =>
        isMod(i, deprecatedModDescription)
      );
    }
  );

  return (state: RootState): StoreProps => ({
    defs: state.manifest.d2Manifest,
    buckets: state.inventory.buckets,
    ownedMods: ownedModsSelector(state),
    modsOnItems: modsOnitemsSelector(state),
    allMods: allModsSelector(state)
  });
}

type Props = ProvidedProps & StoreProps;

function isMod(i: DestinyInventoryItemDefinition, deprecatedModDescription: string) {
  return (
    i.itemCategoryHashes &&
    i.plug &&
    i.plug.insertionMaterialRequirementHash &&
    i.displayProperties.description !== deprecatedModDescription &&
    ![2600899007, 2323986101, 3851138800].includes(i.hash) &&
    (i.itemCategoryHashes.includes(610365472) || i.itemCategoryHashes.includes(4104513227))
    //                ItemCategory "Weapon Mods"                  ItemCategory "Armor Mods"
  );
}

function Mods({ defs, buckets, allMods, ownedMods, modsOnItems, profileResponse }: Props) {
  if (!defs || !buckets) {
    return null;
  }

  //                                    InventoryItem "Void Impact Mod"
  const deprecatedModDescription = defs.InventoryItem.get(2988871238).displayProperties.description;
  const mods = new Set<number>();

  const processPlugSet = (plugs: { [key: number]: DestinyItemPlug[] }) => {
    _.forIn(plugs, (plugSet, plugSetHash) => {
      const plugSetDef = defs.PlugSet.get(parseInt(plugSetHash, 10));
      for (const item of plugSetDef.reusablePlugItems) {
        const itemDef = defs.InventoryItem.get(item.plugItemHash);
        if (!mods.has(itemDef.hash) && isMod(itemDef, deprecatedModDescription)) {
          mods.add(itemDef.hash);
          if (plugSet.some((k) => k.plugItemHash === itemDef.hash && k.enabled)) {
            ownedMods.add(itemDef.hash);
          }
        }
      }
    });
  };

  if (profileResponse.profilePlugSets.data) {
    processPlugSet(profileResponse.profilePlugSets.data.plugs);
  }

  if (profileResponse.characterPlugSets.data) {
    for (const plugSetData of Object.values(profileResponse.characterPlugSets.data)) {
      processPlugSet(plugSetData.plugs);
    }
  }

  for (const mod of allMods) {
    mods.add(mod.hash);
  }

  allMods = Array.from(mods)
    .map((i) => defs.InventoryItem.get(i))
    // exclude artifact mods. they aren't earned or kept, just rented from the artifact for seasonal use
    .filter((mod) => mod.inventory.bucketTypeHash !== 2401704334);

  // make a list of seasonal mod types like ["Opulent Armor Mod"]
  const seasonalModCategories = [
    ...new Set(
      allMods
        .filter((mod) => /^enhancements\.season_/.test(mod.plug.plugCategoryIdentifier))
        .map((mod) => mod.itemTypeDisplayName)
    )
  ];

  const byGroup = _.groupBy(allMods, (i) =>
    i.itemCategoryHashes.includes(610365472)
      ? 'weapons'
      : i.itemCategoryHashes.includes(4104513227) && i.plug.energyCost
      ? 'armor2'
      : i.itemCategoryHashes.includes(4104513227) && !i.plug.energyCost
      ? 'armor1'
      : 'reject_bin'
  );
  // group by armor piece, seasonal mod slot, or fallback to general armor
  const armorV2ByPieceCategoryHash = _.groupBy(
    byGroup.armor2,
    (i) =>
      i.itemCategoryHashes.find((hash) => armorPieceGroups.includes(hash)) ||
      (seasonalModCategories.includes(i.itemTypeDisplayName) && i.itemTypeDisplayName) ||
      4104513227
  );

  const modsTitle = defs.ItemCategory.get(56).displayProperties.name;
  const weaponModsTitle = defs.ItemCategory.get(610365472).displayProperties.name;

  return (
    <CollapsibleTitle title={modsTitle} sectionId="mods">
      <div className="presentation-node always-expanded mods">
        <div className="title">{weaponModsTitle}</div>
        <div className="collectibles">
          {byGroup.weapons.sort(sortMods).map((mod) => (
            <ModCollectible
              key={mod.hash}
              inventoryItem={mod}
              defs={defs}
              buckets={buckets}
              owned={ownedMods.has(mod.hash)}
              onAnItem={modsOnItems.has(mod.hash)}
            />
          ))}
        </div>
      </div>
      <div className="presentation-node always-expanded mods">
        {armorPieceDisplayOrder.map((categoryHash) => (
          <>
            <div className="title">
              {defs.ItemCategory.get(categoryHash) &&
                defs.ItemCategory.get(categoryHash).displayProperties.name}
            </div>
            <div key={categoryHash} className="collectibles">
              {armorV2ByPieceCategoryHash[categoryHash].sort(sortMods).map((mod) => (
                <ModCollectible
                  key={mod.hash}
                  inventoryItem={mod}
                  defs={defs}
                  buckets={buckets}
                  owned={ownedMods.has(mod.hash)}
                  onAnItem={modsOnItems.has(mod.hash)}
                />
              ))}
            </div>
          </>
        ))}
        {seasonalModCategories.map((seasonalModName) => (
          <>
            <div className="title">{seasonalModName}</div>
            <div key={seasonalModName} className="collectibles">
              {armorV2ByPieceCategoryHash[seasonalModName].sort(sortMods).map((mod) => (
                <ModCollectible
                  key={mod.hash}
                  inventoryItem={mod}
                  defs={defs}
                  buckets={buckets}
                  owned={ownedMods.has(mod.hash)}
                  onAnItem={modsOnItems.has(mod.hash)}
                />
              ))}
            </div>
          </>
        ))}
        <div className="title">{t('Vendors.Year2Mods')}</div>
        <div className="collectibles">
          {byGroup.armor1.sort(sortMods).map((mod) => (
            <ModCollectible
              key={mod.hash}
              inventoryItem={mod}
              defs={defs}
              buckets={buckets}
              owned={ownedMods.has(mod.hash)}
              onAnItem={modsOnItems.has(mod.hash)}
            />
          ))}
        </div>
      </div>
    </CollapsibleTitle>
  );
}

export default connect<StoreProps>(mapStateToProps)(Mods);
