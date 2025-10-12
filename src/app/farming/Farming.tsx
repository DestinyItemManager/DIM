import { settingSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { useSetting } from 'app/settings/hooks';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { AnimatePresence, Transition, Variants, motion } from 'motion/react';
import React from 'react';
import { useSelector } from 'react-redux';
import { stopFarming } from './actions';
import * as styles from './Farming.m.scss';
import { farmingStoreSelector } from './selectors';

const animateVariants: Variants = {
  shown: { y: 0, x: '-50%' },
  hidden: { y: 60, x: '-50%' },
};
const animateTransition: Transition<number> = { type: 'spring', duration: 0.3, bounce: 0 };

export default function Farming() {
  const dispatch = useThunkDispatch();
  const store = useSelector(farmingStoreSelector);
  const [makeRoomForItems, setMakeRoomForItems] = useSetting('farmingMakeRoomForItems');
  const inventoryClearSpaces = useSelector(settingSelector('inventoryClearSpaces'));

  const makeRoomForItemsChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    setMakeRoomForItems(e.currentTarget.checked);

  const onStopClicked = () => dispatch(stopFarming());

  return (
    <AnimatePresence>
      {store && (
        <motion.div
          className={styles.farming}
          initial="hidden"
          animate="shown"
          exit="hidden"
          variants={animateVariants}
          transition={animateTransition}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
