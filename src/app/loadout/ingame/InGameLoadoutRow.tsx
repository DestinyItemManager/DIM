import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { allItemsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { convertInGameLoadoutToDimLoadout } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout, Loadout } from 'app/loadout-drawer/loadout-types';
import styles from 'app/loadout/LoadoutsRow.m.scss';
import { AppIcon, deleteIcon, faCheckCircle } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { streamDeckSelectionSelector } from 'app/stream-deck/selectors';
import { streamDeckSelectLoadout } from 'app/stream-deck/stream-deck';
import { ReactNode, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import InGameLoadoutView from './InGameLoadoutView';
import { applyInGameLoadout, deleteInGameLoadout } from './ingame-loadout-apply';

/**
 * A single row in the Loadouts page for an in game D2 loadout (post-Lightfall).
 */
export default memo(function InGameLoadoutRow({
  loadout,
  store,
  onEdit,
  onShare,
}: {
  loadout: InGameLoadout;
  store: DimStore;
  onEdit: (loadout: InGameLoadout) => void;
  onShare: (loadout: Loadout) => void;
}) {
  const dispatch = useThunkDispatch();
  const allItems = useSelector(allItemsSelector);

  const streamDeckSelection = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line
      useSelector(streamDeckSelectionSelector)
    : null;

  const actionButtons = useMemo(() => {
    const handleApply = () => dispatch(applyInGameLoadout(loadout));
    const handleDelete = () => dispatch(deleteInGameLoadout(loadout));

    const handleSaveAsDIM = () => {
      const dimLoadout = convertInGameLoadoutToDimLoadout(loadout, store.classType, allItems);
      editLoadout(dimLoadout, store.id, { isNew: true });
    };
    const handleShare = () => {
      const dimLoadout = convertInGameLoadoutToDimLoadout(loadout, store.classType, allItems);
      onShare(dimLoadout);
    };

    if (streamDeckSelection === 'loadout') {
      const handleSelection = () =>
        dispatch(
          streamDeckSelectLoadout(
            {
              type: 'game',
              loadout,
            },
            store
          )
        );

      return [
        <button
          key="stream-deck-selection"
          type="button"
          className="dim-button"
          onClick={handleSelection}
        >
          <span className={styles.iconLabel}>{t('StreamDeck.SelectLoadout')}</span>
          <AppIcon icon={faCheckCircle} title={t('StreamDeck.SelectLoadout')} />
        </button>,
      ];
    }

    const actionButtons: ReactNode[] = [
      <button key="apply" type="button" className="dim-button" onClick={handleApply}>
        {t('Loadouts.Apply')}
      </button>,

      <button key="edit" type="button" className="dim-button" onClick={() => onEdit(loadout)}>
        {t('Loadouts.EditBrief')}
      </button>,

      <button key="saveAs" type="button" className="dim-button" onClick={handleSaveAsDIM}>
        {t('Loadouts.SaveAsDIM')}
      </button>,

      <button key="share" type="button" className="dim-button" onClick={handleShare}>
        {t('Loadouts.ShareLoadout')}
      </button>,

      <ConfirmButton key="delete" danger onClick={handleDelete}>
        <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
      </ConfirmButton>,
    ];

    return actionButtons;
  }, [streamDeckSelection, dispatch, loadout, store, allItems, onShare, onEdit]);

  return <InGameLoadoutView loadout={loadout} store={store} actionButtons={actionButtons} />;
});
