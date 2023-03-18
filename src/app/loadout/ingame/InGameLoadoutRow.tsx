import { ConfirmButton } from 'app/dim-ui/ConfirmButton';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import styles from 'app/loadout/LoadoutsRow.m.scss';
import { AppIcon, deleteIcon, faCheckCircle } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { streamDeckSelectionSelector } from 'app/stream-deck/selectors';
import { streamDeckSelectLoadout } from 'app/stream-deck/stream-deck';
import { memo, ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';
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

  const streamDeckSelection = $featureFlags.elgatoStreamDeck
    ? // eslint-disable-next-line
      useSelector(streamDeckSelectionSelector)
    : null;

  const actionButtons = useMemo(() => {
    const handleApply = () => dispatch(applyInGameLoadout(loadout));
    const handleDelete = () => dispatch(deleteInGameLoadout(loadout));

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

      <ConfirmButton key="delete" danger onClick={handleDelete}>
        <AppIcon icon={deleteIcon} title={t('Loadouts.Delete')} />
      </ConfirmButton>,
    ];

    // TODO: add snapshotting loadouts - may need a dialog to select the loadout slot
    // TODO: figure out whether this loadout is currently equippable (all items on character or in vault)

    return actionButtons;
  }, [dispatch, loadout, store, streamDeckSelection]);

  return <InGameLoadoutView loadout={loadout} store={store} actionButtons={actionButtons} />;
});
