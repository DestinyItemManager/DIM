import React, { useEffect, useState } from 'react';
import { showGearPower$ } from './gear-power';
import Sheet from '../dim-ui/Sheet';
import { storesSelector } from '../inventory/selectors';
import { D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';

import './GearPower.scss';

import { connect } from 'react-redux';
// import { t } from 'app/i18next-t';
// import clsx from 'clsx';

import { useSubscription } from 'app/utils/hooks';
import { useLocation } from 'react-router';
import { maxLightItemSet } from 'app/loadout/auto-loadouts';
import { getLight } from 'app/loadout/loadout-utils';
import BucketIcon from 'app/dim-ui/svgs/BucketIcon';
import BungieImage from 'app/dim-ui/BungieImage';
import { itemPop } from 'app/dim-ui/scroll';
import { FractionalPowerLevel } from 'app/dim-ui/FractionalPowerLevel';

interface StoreProps {
  stores: D2Store[];
}

function mapStateToProps(state: RootState): StoreProps {
  const stores = storesSelector(state) as D2Store[];
  return {
    stores,
  };
}

function GearPower({ stores }: StoreProps) {
  const [selectedStore, setSelectedStore] = useState<D2Store | undefined>();
  const reset = () => setSelectedStore(undefined);

  useSubscription(() =>
    showGearPower$.subscribe(({ selectedStoreId }) => {
      setSelectedStore(stores.find((s) => s.id === selectedStoreId));
    })
  );

  const { pathname } = useLocation();
  useEffect(reset, [pathname]);

  if (!selectedStore) {
    return null;
  }

  const maxLightItems = maxLightItemSet(stores, selectedStore);
  const maxBasePower = getLight(selectedStore, maxLightItems);
  const powerFloor = Math.floor(maxBasePower);
  const header = (
    <h1>
      <img src={selectedStore.icon} />
      {selectedStore.name} ({<FractionalPowerLevel power={maxBasePower} />})
    </h1>
  );
  return (
    <Sheet onClose={reset} header={header} sheetClassName="gearPowerSheet">
      <div className="gearGrid">
        {maxLightItems.map((i, j) => {
          const powerDiff = (powerFloor - (i.primStat?.value ?? 0)) * -1;
          const diffSymbol = powerDiff > 0 ? '+' : '';
          const diffClass = powerDiff > 0 ? 'positive' : 'negative';
          return (
            <div key={j} className={i.type}>
              <BucketIcon className="invert" item={i} />
              <span onClick={() => itemPop(i)}>
                <BungieImage src={i.icon} />
              </span>
              {i.primStat?.value}
              <span className={diffClass}>
                ({diffSymbol}
                {powerDiff})
              </span>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

export default connect<StoreProps>(mapStateToProps)(GearPower);

// implement this once item popup & sheet coexist more peacefully
//
// import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
// <ItemPopupTrigger item={i}>
// {(ref, onClick) => (
//   <span ref={ref} onClick={onClick}>
//     <BungieImage src={i.icon} />
//   </span>
// )}
// </ItemPopupTrigger>
