import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { getArtifactBonus } from 'app/inventory/stores-helpers';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { getLight } from 'app/loadout-drawer/loadout-utils';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import helmetIcon from 'destiny-icons/armor_types/helmet.svg';
import xpIcon from 'images/xpIcon.svg';
import React from 'react';
import PressTip from '../dim-ui/PressTip';
import { AppIcon, powerActionIcon, powerIndicatorIcon } from '../shell/icons';
import { maxLightItemSet, maxLightLoadout } from './auto-loadouts';
import styles from './MaxlightButton.m.scss';

interface Props {
  allItems: DimItem[];
  dimStore: DimStore;
  hasClassified: boolean;
  hideIcon?: boolean;
}

export default function MaxlightButton({ allItems, dimStore, hasClassified, hideIcon }: Props) {
  const dispatch = useThunkDispatch();

  const maxLight = getLight(dimStore, maxLightItemSet(allItems, dimStore).equippable);
  const artifactLight = getArtifactBonus(dimStore);

  // Apply a loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
  const makeMaxLightLoadout = () => {
    const loadout = maxLightLoadout(allItems, dimStore);
    dispatch(applyLoadout(dimStore, loadout, { allowUndo: true }));
  };

  return (
    <span onClick={makeMaxLightLoadout} className={styles.container}>
      <PressTip tooltip={hasClassified ? t('Loadouts.Classified') : ''}>
        <span className={styles.light}>
          {dimStore.destinyVersion === 1 ? (
            <>
              <AppIcon icon={powerIndicatorIcon} />
              {Math.floor(maxLight * 10) / 10}
            </>
          ) : (
            <>
              <img className={styles.yellowInlineSvg} src={helmetIcon} />
              {Math.floor(maxLight)}
              {' + '}
              <img className={styles.yellowInlineSvg} src={xpIcon} />
              {artifactLight}
            </>
          )}

          {hasClassified && <sup>*</sup>}
        </span>
      </PressTip>
      {!hideIcon && <AppIcon icon={powerActionIcon} />}
      <span>
        {dimStore.destinyVersion === 2 ? t('Loadouts.MaximizePower') : t('Loadouts.MaximizeLight')}
      </span>
    </span>
  );
}
