import { settingSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { useSetting } from 'app/settings/hooks';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { stopFarming } from './actions';
import './farming.scss';
import { farmingStoreSelector } from './selectors';

export default function Farming() {
  const dispatch = useThunkDispatch();
  const store = useSelector(farmingStoreSelector);
  const [makeRoomForItems, setMakeRoomForItems] = useSetting('farmingMakeRoomForItems');
  const inventoryClearSpaces = Number(useSelector(settingSelector('inventoryClearSpaces')));

  const makeRoomForItemsChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMakeRoomForItems(e.currentTarget.checked);

  const nodeRef = useRef<HTMLDivElement>(null);

  const onStopClicked = () => dispatch(stopFarming());

  return (
    <TransitionGroup component={null}>
      {store && (
        <CSSTransition nodeRef={nodeRef} classNames="farming" timeout={{ enter: 500, exit: 500 }}>
          <div
            ref={nodeRef}
            id="item-farming"
            className={clsx({ 'd2-farming': store.destinyVersion === 2 })}
          >
            {store.destinyVersion === 2 ? (
              <div>
                <p>
                  {t('FarmingMode.D2Desc', {
                    store: store.name,
                    context: store.genderName,
                    count: inventoryClearSpaces,
                  })}{' '}
                  {t('FarmingMode.Vault')}
                </p>
              </div>
            ) : (
              <div>
                <p>
                  {makeRoomForItems
                    ? t('FarmingMode.Desc', {
                        store: store.name,
                        context: store.genderName,
                        count: inventoryClearSpaces,
                      })
                    : t('FarmingMode.MakeRoom.Desc', {
                        store: store.name,
                        context: store.genderName,
                      })}
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
            )}

            <div>
              <button type="button" onClick={onStopClicked}>
                {t('FarmingMode.Stop')}
              </button>
            </div>
          </div>
        </CSSTransition>
      )}
    </TransitionGroup>
  );
}
