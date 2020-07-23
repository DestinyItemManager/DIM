import React, { useEffect, useState } from 'react';
import { showGearPower$ } from './gear-power';
import Sheet from '../dim-ui/Sheet';
import { storesSelector } from '../inventory/selectors';
import { D2Store } from '../inventory/store-types';
import { RootState } from '../store/reducers';

import './GearPower.scss';

import { connect, useSelector } from 'react-redux';
// import { connect, useDispatch, useSelector } from 'react-redux';
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
// import { settingsSelector } from 'app/settings/reducer';
// import { setSetting } from 'app/settings/actions';

interface StoreProps {
  stores: D2Store[];
}

function mapStateToProps(state: RootState): StoreProps {
  const stores = storesSelector(state) as D2Store[];
  return {
    stores,
  };
}

function GearPower() {
  const [selectedStore, setSelectedStore] = useState<D2Store | undefined>();
  const reset = () => setSelectedStore(undefined);

  const stores = useSelector<RootState, D2Store[]>((state) => storesSelector(state) as D2Store[]);

  useSubscription(() =>
    showGearPower$.subscribe(({ selectedStoreId }) => {
      setSelectedStore(stores.find((s) => s.id === selectedStoreId));
    })
  );

  // const showPowerMaxAsEquippable = useSelector<RootState, boolean>(
  //   (state) => settingsSelector(state).showPowerMaxAsEquippable
  // );
  // const dispatch = useDispatch();
  // const setShowPowerMaxAsEquippable = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   dispatch(setSetting('showPowerMaxAsEquippable', e.target.value === 'equippable'));
  // };

  const { pathname } = useLocation();
  useEffect(reset, [pathname]);

  if (!selectedStore) {
    return null;
  }

  const { unrestricted } = maxLightItemSet(stores, selectedStore);
  // const { unrestricted, equippable } = maxLightItemSet(stores, selectedStore);
  const maxBasePower = getLight(
    selectedStore,
    // showPowerMaxAsEquippable ? equippable : unrestricted
    unrestricted
  );
  const powerFloor = Math.floor(maxBasePower);
  const header = (
    <div className="gearPowerHeader">
      <img src={selectedStore.icon} />
      <div>
        <h1>{selectedStore.name}</h1>{' '}
        <h1>
          <FractionalPowerLevel power={maxBasePower} />
        </h1>
      </div>
    </div>
  );
  return (
    <Sheet onClose={reset} header={header} sheetClassName="gearPowerSheet">
      {
        //   <label>
        //   <input
        //     type="radio"
        //     name="showPowerMaxAsEquippable"
        //     checked={showPowerMaxAsEquippable}
        //     value="equippable"
        //     onChange={setShowPowerMaxAsEquippable}
        //   />{' '}
        //   equippable
        // </label>
        // <label>
        //   <input
        //     type="radio"
        //     name="showPowerMaxAsEquippable"
        //     checked={!showPowerMaxAsEquippable}
        //     value="not"
        //     onChange={setShowPowerMaxAsEquippable}
        //   />{' '}
        //   drop max
        // </label>
      }
      <div className="gearGrid">
        {unrestricted.map((i) => {
          // (showPowerMaxAsEquippable ? equippable : unrestricted).map((i) => {
          const powerDiff = (powerFloor - (i.primStat?.value ?? 0)) * -1;
          const diffSymbol = powerDiff > 0 ? '+' : '';
          const diffClass = powerDiff > 0 ? 'positive' : 'negative';
          return (
            <div key={i.id} className={i.type}>
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
      <div className="footNote">
        Maximum Power isn't limited by the "One Exotic" rule when determining the Power of your
        drops/powerfuls/pinnacle rewards. Multiple Exotic items were used to calculate your Maximum
        Power, so the number shown may not be achievable when equipping your items in-game.
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
