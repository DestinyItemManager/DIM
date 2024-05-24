import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { deleteLoadout } from 'app/loadout-drawer/actions';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { copyAndEditLoadout, editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { AppIcon, deleteIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { ReactNode, memo, useMemo } from 'react';
import LoadoutView from './LoadoutView';

/**
 * A single row in the Loadouts page.
 */
export default memo(function LoadoutRow({
  loadout,
  store,
  saved,
  equippable,
  onShare,
  onSnapshotInGameLoadout,
}: {
  loadout: Loadout;
  store: DimStore;
  saved: boolean;
  equippable: boolean;
  onShare: (loadout: Loadout) => void;
  onSnapshotInGameLoadout: () => void;
}) {
  const dispatch = useThunkDispatch();

  const actionButtons = useMemo(() => {
    const handleDeleteClick = () => dispatch(deleteLoadout(loadout.id));

    const handleApply = () =>
      dispatch(applyLoadout(store, loadout, { allowUndo: true, onlyMatchingClass: true }));

    const handleEdit = () => editLoadout(loadout, store.id, { isNew: !saved });
    const handleShare = () => onShare(loadout);
    const handleCopyAndEdit = () => copyAndEditLoadout(loadout, store.id);

    const actionButtons: ReactNode[] = [];

    if (equippable) {
      actionButtons.push(
        <button key="apply" type="button" className="dim-button" onClick={handleApply}>
          {t('Loadouts.Apply')}
        </button>,
      );
    }

    actionButtons.push(
      <button key="edit" type="button" className="dim-button" onClick={handleEdit}>
        {saved ? t('Loadouts.EditBrief') : t('Loadouts.SaveLoadout')}
      </button>,
    );

    if (equippable) {
      // add button here to copy and edit the loadout
      actionButtons.push(
        <button key="copyAndEdit" type="button" className="dim-button" onClick={handleCopyAndEdit}>
          {t('Loadouts.CopyAndEdit')}
        </button>,
      );
    }

    actionButtons.push(
      <button key="share" type="button" className="dim-button" onClick={handleShare}>
        {t('Loadouts.ShareLoadout')}
      </button>,
    );

    if (saved) {
      actionButtons.push(
        <ConfirmButton key="delete" danger onClick={handleDeleteClick}>
          <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
        </ConfirmButton>,
      );
    } else {
      actionButtons.push(
        <button
          key="snapshot"
          type="button"
          className="dim-button"
          onClick={onSnapshotInGameLoadout}
        >
          {t('Loadouts.Snapshot')}
        </button>,
      );
    }

    return actionButtons;
  }, [dispatch, equippable, loadout, onShare, onSnapshotInGameLoadout, saved, store]);

  return (
    <LoadoutView
      loadout={loadout}
      store={store}
      actionButtons={actionButtons}
      hideShowModPlacements={!equippable}
    />
  );
});
