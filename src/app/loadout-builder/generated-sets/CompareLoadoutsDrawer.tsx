import Select from 'app/dim-ui/Select';
import Sheet from 'app/dim-ui/Sheet';
import useConfirm from 'app/dim-ui/useConfirm';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import LoadoutView from 'app/loadout/LoadoutView';
import { updateLoadout } from 'app/loadout/actions';
import { Loadout } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import clsx from 'clsx';
import React, { useMemo, useState } from 'react';
import { ArmorSet } from '../types';
import { mergeLoadout } from '../updated-loadout';
import styles from './CompareLoadoutsDrawer.m.scss';

// TODO: just get rid of compare loadout feature altogether!

function chooseInitialLoadout(
  setItems: DimItem[],
  useableLoadouts: Loadout[],
  initialLoadoutId?: string,
) {
  // Most of all, try to find the loadout we started with
  const loadoutFromInitialId = useableLoadouts.find((lo) => lo.id === initialLoadoutId);
  if (loadoutFromInitialId) {
    return loadoutFromInitialId;
  }
  const exotic = setItems.find((i) => i.isExotic);
  const initialLoadout =
    // Prefer finding a loadout that shares an exotic
    (exotic && useableLoadouts.find((l) => l.items.some((i) => i.hash === exotic.hash))) ||
    // Or else just get whatever the first (in an arbitrary order?) is
    (useableLoadouts.length ? useableLoadouts[0] : undefined);
  if (!initialLoadout) {
    throw new Error("bug: Shouldn't show compare loadouts drawer without any loadouts");
  }
  return initialLoadout;
}

export default function CompareLoadoutsDrawer({
  loadouts,
  loadout,
  selectedStore,
  compareSet,
  lockedMods,
  onClose,
}: {
  compareSet: {
    set: ArmorSet;
    items: DimItem[];
  };
  selectedStore: DimStore;
  loadouts: Loadout[];
  loadout: Loadout;
  lockedMods: PluggableInventoryItemDefinition[];
  onClose: () => void;
}) {
  const defs = useD2Definitions()!;
  const dispatch = useThunkDispatch();
  const { set, items } = compareSet;

  const [selectedLoadout, setSelectedLoadout] = useState(() =>
    chooseInitialLoadout(items, loadouts, loadout.id),
  );

  // This probably isn't needed but I am being cautious as it iterates over the stores.
  const generatedLoadout = useMemo(
    () => mergeLoadout(defs, selectedLoadout, loadout, set, items, lockedMods),
    [defs, selectedLoadout, loadout, set, items, lockedMods],
  );

  const [confirmDialog, confirm] = useConfirm();
  const onSaveLoadout = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (
      selectedLoadout &&
      !(await confirm(t('LoadoutBuilder.ConfirmOverwrite', { name: selectedLoadout.name })))
    ) {
      return;
    }

    if (!generatedLoadout) {
      return;
    }

    dispatch(updateLoadout(generatedLoadout));
    onClose();
  };

  const header = <div className={styles.header}>{t('LoadoutBuilder.CompareLoadout')}</div>;

  const loadoutOptions = useMemo(
    () =>
      loadouts.map((l) => ({
        key: l.id,
        value: l,
        content: l.name,
      })),
    [loadouts],
  );

  // This is likely never to happen but since it is disconnected to the button its here for safety.
  if (!selectedLoadout || !generatedLoadout) {
    return (
      <Sheet onClose={onClose} header={header}>
        <div className={styles.noLoadouts}>{t('LoadoutBuilder.NoLoadoutsToCompare')}</div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} header={header}>
      {confirmDialog}
      <div className={styles.content}>
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.OptimizerSet')}</div>
          </div>
          <LoadoutView
            loadout={generatedLoadout}
            store={selectedStore}
            hideOptimizeArmor={true}
            actionButtons={[
              <button key="save" className="dim-button" type="button" onClick={onSaveLoadout}>
                {t('LoadoutBuilder.SaveAs')}{' '}
                <span className={styles.loadoutName}>{selectedLoadout.name}</span>
              </button>,
            ]}
          />
        </div>
        <div>
          <div className={clsx(styles.fillRow, styles.setHeader)}>
            <div className={styles.setTitle}>{t('LoadoutBuilder.ExistingLoadout')}</div>
          </div>
          <LoadoutView
            loadout={selectedLoadout}
            store={selectedStore}
            hideOptimizeArmor={true}
            actionButtons={[
              <Select<Loadout>
                key="select-loadout"
                value={selectedLoadout}
                options={loadoutOptions}
                onChange={(l) => setSelectedLoadout(l!)}
              />,
            ]}
          />
        </div>
      </div>
    </Sheet>
  );
}
