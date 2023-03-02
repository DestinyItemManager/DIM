import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { memo, ReactNode, useMemo } from 'react';
import { applyInGameLoadout, deleteInGameLoadout } from './ingame-loadout-apply';
import InGameLoadoutView from './InGameLoadoutView';

/**
 * A single row in the Loadouts page for an in game D2 loadout (post-Lightfall).
 */
export default memo(function InGameLoadoutRow({
  loadout,
  store,
}: {
  loadout: InGameLoadout;
  store: DimStore;
}) {
  const dispatch = useThunkDispatch();

  const actionButtons = useMemo(() => {
    const handleApply = () => dispatch(applyInGameLoadout(loadout));
    const handleDelete = () => dispatch(deleteInGameLoadout(loadout));

    const actionButtons: ReactNode[] = [
      <button key="apply" type="button" className="dim-button" onClick={handleApply}>
        {t('Loadouts.Apply')}
      </button>,

      <ConfirmButton key="delete" danger onClick={handleDelete}>
        <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
      </ConfirmButton>,
    ];

    // TODO: add snapshotting loadouts - may need a dialog to select the loadout slot
    // TODO: figure out whether this loadout is currently equippable (all items on character or in vault)

    return actionButtons;
  }, [dispatch, loadout]);

  return <InGameLoadoutView loadout={loadout} store={store} actionButtons={actionButtons} />;
});
