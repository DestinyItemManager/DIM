import React, { useRef } from 'react';
import { DimStore } from '../inventory/store-types';
import { t } from 'app/i18next-t';
import { RootState } from 'app/store/types';
import { connect } from 'react-redux';
import _ from 'lodash';
import { farmingStoreSelector } from './reducer';
import './farming.scss';
import { D1FarmingService } from './farming.service';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { setSetting } from '../settings/actions';
import { settingsSelector } from 'app/settings/reducer';

interface StoreProps {
  makeRoomForItems: boolean;
  store?: DimStore;
}

function mapStateToProps() {
  const storeSelector = farmingStoreSelector();
  return (state: RootState): StoreProps => ({
    makeRoomForItems: settingsSelector(state).farmingMakeRoomForItems,
    store: storeSelector(state),
  });
}

const mapDispatchToProps = {
  setSetting,
};
type DispatchProps = typeof mapDispatchToProps;

type Props = StoreProps & DispatchProps;

function D1Farming({ store, makeRoomForItems, setSetting }: Props) {
  const i18nData = {
    store: store?.name,
    context: store?.genderName,
  };

  const makeRoomForItemsChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.checked;
    setSetting('farmingMakeRoomForItems', value);
  };

  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <TransitionGroup component={null}>
      {store && (
        <CSSTransition nodeRef={nodeRef} classNames="farming" timeout={{ enter: 500, exit: 500 }}>
          <div ref={nodeRef} id="item-farming">
            <div>
              <p>
                {makeRoomForItems
                  ? t('FarmingMode.Desc', i18nData)
                  : t('FarmingMode.MakeRoom.Desc', i18nData)}
                {/*
                    t('FarmingMode.Desc_male')
                    t('FarmingMode.Desc_female')
                    t('FarmingMode.MakeRoom.Desc_male')
                    t('FarmingMode.MakeRoom.Desc_female')
                  */}
              </p>
              <p>
                <input
                  name="make-room-for-items"
                  type="checkbox"
                  checked={makeRoomForItems}
                  onChange={makeRoomForItemsChanged}
                />
                <label htmlFor="make-room-for-items" title={t('FarmingMode.MakeRoom.Tooltip')}>
                  {t('FarmingMode.MakeRoom.MakeRoom')}
                </label>
              </p>
            </div>

            <div>
              <button type="button" onClick={D1FarmingService.stop}>
                {t('FarmingMode.Stop')}
              </button>
            </div>
          </div>
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}

export default connect<StoreProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(D1Farming);
