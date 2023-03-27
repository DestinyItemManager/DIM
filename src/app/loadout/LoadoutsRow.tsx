import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { deleteLoadout } from 'app/loadout-drawer/actions';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { AppIcon, deleteIcon, faCheckCircle } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { streamDeckSelectionSelector } from 'app/stream-deck/selectors';
import { streamDeckSelectLoadout } from 'app/stream-deck/stream-deck';
import { Portal } from 'app/utils/temp-container';
import _ from 'lodash';
import { ReactNode, memo, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import LoadoutView from './LoadoutView';
import styles from './LoadoutsRow.m.scss';
import EditInGameLoadout from './ingame/EditInGameLoadout';

/**
 * A single row in the Loadouts page.
 */
export default memo(function LoadoutRow({
  loadout,
  store,
  saved,
  equippable,
  onShare,
}: {
  loadout: Loadout;
  store: DimStore;
  saved: boolean;
  equippable: boolean;
  onShare: (loadout: Loadout) => void;
}) {
  const dispatch = useThunkDispatch();

  const streamDeckSelection = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line
      useSelector(streamDeckSelectionSelector)
    : null;

  const [showSnapshot, setShowSnapshot] = useState(false);

  const actionButtons = useMemo(() => {
    const handleDeleteClick = () => dispatch(deleteLoadout(loadout.id));

    const handleApply = () =>
      dispatch(applyLoadout(store, loadout, { allowUndo: true, onlyMatchingClass: true }));

    const handleEdit = () => editLoadout(loadout, store.id, { isNew: !saved });
    const handleShare = () => onShare(loadout);

    const handleSnapshot = () => setShowSnapshot(true);
    const handleSnapshotSheetClose = () => setShowSnapshot(false);

    const actionButtons: ReactNode[] = [];

    if (equippable) {
      if (streamDeckSelection === 'loadout') {
        const handleSelection = () =>
          dispatch(streamDeckSelectLoadout({ type: 'dim', loadout }, store));
        return [
          <button
            key="select-for-stream-deck"
            type="button"
            className="dim-button"
            onClick={handleSelection}
          >
            <span className={styles.iconLabel}>{t('StreamDeck.SelectLoadout')}</span>
            <AppIcon icon={faCheckCircle} title={t('StreamDeck.SelectLoadout')} />
          </button>,
        ];
      }

      actionButtons.push(
        <button key="apply" type="button" className="dim-button" onClick={handleApply}>
          {t('Loadouts.Apply')}
        </button>
      );
    }

    actionButtons.push(
      <button key="edit" type="button" className="dim-button" onClick={handleEdit}>
        {saved ? t('Loadouts.EditBrief') : t('Loadouts.SaveLoadout')}
      </button>
    );

    if (loadout.parameters && !_.isEmpty(loadout.parameters)) {
      actionButtons.push(
        <button key="share" type="button" className="dim-button" onClick={handleShare}>
          {t('Loadouts.ShareLoadout')}
        </button>
      );
    }

    if (saved) {
      actionButtons.push(
        <ConfirmButton key="delete" danger onClick={handleDeleteClick}>
          <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
        </ConfirmButton>
      );
    } else {
      actionButtons.push(
        <button key="snapshot" type="button" className="dim-button" onClick={handleSnapshot}>
          {t('Loadouts.Snapshot')}
        </button>
      );
      showSnapshot &&
        actionButtons.push(
          <Portal key="snapshotsheet">
            <EditInGameLoadout characterId={store.id} onClose={handleSnapshotSheetClose} />
          </Portal>
        );
    }

    return actionButtons;
  }, [dispatch, equippable, loadout, onShare, saved, store, streamDeckSelection, showSnapshot]);

  return (
    <LoadoutView
      loadout={loadout}
      store={store}
      actionButtons={actionButtons}
      hideShowModPlacements={!equippable}
    />
  );
});
