import React, { useEffect, useReducer, useState } from 'react';
import { showGearPower$ } from './gear-power';
import Sheet from '../dim-ui/Sheet';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import { storesSelector } from '../inventory/selectors';
import { DimStore, D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';
import _ from 'lodash';
import './GearPower.scss';

import { connect } from 'react-redux';
import { t } from 'app/i18next-t';
import clsx from 'clsx';

import { useSubscription } from 'app/utils/hooks';
import { useLocation } from 'react-router';
import { D2Categories } from '../destiny2/d2-buckets';
import { maxLightItemSet } from 'app/loadout/auto-loadouts';
import { getLight } from 'app/loadout/loadout-utils';

const excludeGearSlots = ['Class', 'SeasonalArtifacts'];
// order to display a list of all 8 gear slots
const gearSlotOrder = [
  ...D2Categories.Weapons.filter((t) => !excludeGearSlots.includes(t)),
  ...D2Categories.Armor,
];

interface StoreProps {
  stores: D2Store[];
}

function mapStateToProps(state: RootState): StoreProps {
  const stores = storesSelector(state) as D2Store[];
  return {
    stores,
  };
}

// interface State {
//   selectedStore?: D2Store;
// }

// type Action =
//   /** Reset the tool (for when the sheet is closed) */
//   | { type: 'reset' }
//   /** Set up the tool with a new focus item */
//   | { type: 'init'; selectedStore?: D2Store };

// /**
//  * All state for this component is managed through this reducer and the Actions above.
//  */
// function stateReducer(_: State, action: Action): State {
//   switch (action.type) {
//     case 'reset':
//       return {
//         selectedStore: undefined,
//       };
//     case 'init': {
//       return {
//         selectedStore: action.selectedStore,
//       };
//     }
//   }
// }

function GearPower({ stores }: StoreProps) {
  // const [{ selectedStore }, stateDispatch] = useReducer(stateReducer, {});
  const [selectedStore, setSelectedStore] = useState<D2Store | undefined>();
  const reset = () => setSelectedStore(undefined);

  useSubscription(() =>
    showGearPower$.subscribe(({ selectedStoreId }) => {
      // stateDispatch({ type: 'init', selectedStore: stores.find((s) => s.id === selectedStoreId) });
      setSelectedStore(stores.find((s) => s.id === selectedStoreId));
    })
  );

  const { pathname } = useLocation();
  useEffect(reset, [pathname]);

  if (!selectedStore) {
    return null;
  }

  const maxLightItems = _.sortBy(maxLightItemSet(stores, selectedStore), (i) =>
    gearSlotOrder.indexOf(i.type)
  );
  const maxBasePower = getLight(selectedStore, maxLightItems);
  const powerFloor = Math.floor(maxBasePower);
  return (
    <Sheet onClose={reset} header={selectedStore.name} sheetClassName="gearPowerSheet">
      <textarea
        value={
          maxBasePower +
          '\n\n' +
          JSON.stringify(
            maxLightItems.map((i) => {
              const powerDiff = (powerFloor - (i.primStat?.value ?? 0)) * -1;
              const diffSymbol = powerDiff > 0 ? '+' : '';
              return `${i.type} ${i.primStat?.value} (${diffSymbol}${powerDiff})`;
            }),
            null,
            2
          )
        }
      ></textarea>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(GearPower);

// const maxLightItems = _.sortBy(maxLightItemSet(stores, store), (i) =>
// gearSlotOrder.indexOf(i.type)
// );
// const maxBasePower = getLight(store, maxLightItems);

// import { getBuckets, D2Categories } from '../destiny2/d2-buckets';
// // order to display a list of all 8 gear slots
// const excludeGearSlots = ['Class', 'SeasonalArtifacts'];
// const gearSlotOrder = [
//   ...D2Categories.Weapons.filter((t) => !excludeGearSlots.includes(t)),
//   ...D2Categories.Armor,
// ];
