import { PressTip } from 'app/dim-ui/PressTip';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { locateItem } from 'app/inventory/locate-item';
import { destiny2CoreSettingsSelector, useD2Definitions } from 'app/manifest/selectors';
import { filterFactorySelector } from 'app/search/items/item-search-filter';
import { AppIcon, faCheckCircle, refreshIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { withCancel } from 'app/utils/cancel';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import chestArmorItem from 'destiny-icons/armor_types/chest.svg';
import ghostIcon from 'destiny-icons/general/ghost.svg';
import handCannonIcon from 'destiny-icons/weapons/hand_cannon.svg';
import { produce } from 'immer';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSubscription } from 'use-subscription';
import { DefItemIcon } from '../inventory/ItemIcon';
import { allItemsSelector } from '../inventory/selectors';
import styles from './StripSockets.m.scss';
import { SocketKind, StripAction, collectSocketsToStrip, doStripSockets } from './strip-sockets';
import { stripSocketsQuery$ } from './strip-sockets-actions';

/**
 * Error, OK, or still in our worklist
 */
type SocketState = string | 'ok' | 'todo';

type State =
  | {
      tag: 'selecting';
    }
  | {
      tag: 'processing';
      cancel: () => void;
      cancelling: boolean;
      socketList: StripAction[];
      socketStates: SocketState[];
    }
  | {
      tag: 'done';
      socketList: StripAction[];
      socketStates: SocketState[];
    };

type UIAction =
  | {
      tag: 'cancel_process';
    }
  | {
      tag: 'confirm_process';
      socketList: StripAction[];
      cancel: () => void;
    }
  | {
      tag: 'confirm_results';
    }
  | {
      tag: 'notify_done';
      success: boolean;
    }
  | {
      tag: 'notify_progress';
      idx: number;
      error: string | undefined;
    };

function reducer(state: State, action: UIAction): State {
  switch (action.tag) {
    case 'cancel_process':
      if (state.tag === 'processing') {
        state.cancel();

        return produce(state, (draft) => {
          draft.tag === 'processing' && (draft.cancelling = true);
        });
      } else if (state.tag === 'done') {
        return { tag: 'selecting' };
      }
      break;
    case 'confirm_process':
      if (state.tag === 'selecting') {
        return {
          tag: 'processing',
          cancel: action.cancel,
          cancelling: false,
          socketList: action.socketList,
          socketStates: Array<string>(action.socketList.length).fill('todo'),
        };
      }
      break;
    case 'confirm_results':
      if (state.tag === 'done') {
        return { tag: 'selecting' };
      }
      break;
    case 'notify_done':
      if (state.tag === 'processing') {
        if (action.success) {
          // completed -- show (varying) success
          return {
            tag: 'done',
            socketList: state.socketList,
            socketStates: state.socketStates,
          };
        } else {
          // cancelled -- go back to selection
          return { tag: 'selecting' };
        }
      }
      break;
    case 'notify_progress':
      if (state.tag === 'processing') {
        return produce(state, (draft) => {
          draft.tag === 'processing' && (draft.socketStates[action.idx] = action.error ?? 'ok');
        });
      }
      break;
  }
  return state;
}

export default function StripSockets() {
  const dispatch = useThunkDispatch();
  const [state, stripDispatch] = useReducer(reducer, { tag: 'selecting' });
  const [selectedSockets, setSelectedSockets] = useState<StripAction[]>([]);
  const query = useSubscription(stripSocketsQuery$);

  const isChoosing = state.tag === 'selecting';

  const onCancel = () => {
    stripDispatch({ tag: 'cancel_process' });
  };

  const onConfirmSockets = useCallback(
    async (selectedSockets: StripAction[]) => {
      if (!isChoosing) {
        return;
      }

      const [cancelToken, cancel] = withCancel();

      stripDispatch({ tag: 'confirm_process', socketList: selectedSockets, cancel });

      try {
        await dispatch(
          doStripSockets(selectedSockets, cancelToken, (idx, error) =>
            stripDispatch({ tag: 'notify_progress', idx, error }),
          ),
        );
        stripDispatch({ tag: 'notify_done', success: true });
      } catch {
        stripDispatch({ tag: 'notify_done', success: false });
      }
    },
    [dispatch, isChoosing],
  );

  if (!query) {
    return null;
  }

  const header = (
    <div>
      <h1>
        {isChoosing ? (
          t('StripSockets.Choose')
        ) : state.tag === 'processing' ? (
          <>
            <span>
              <AppIcon icon={refreshIcon} spinning={true} ariaHidden />
            </span>{' '}
            {t('StripSockets.Running')}
          </>
        ) : (
          t('StripSockets.Done')
        )}
      </h1>
    </div>
  );

  let contents, footer;
  if (state.tag === 'selecting') {
    contents = <StripSocketsChoose query={query} reportSockets={setSelectedSockets} />;

    footer = (
      <button
        type="button"
        className={styles.insertButton}
        onClick={() => onConfirmSockets(selectedSockets)}
        disabled={selectedSockets.length === 0}
      >
        <span>
          <AppIcon icon={faCheckCircle} ariaHidden />{' '}
          {t('StripSockets.Button', { numSockets: selectedSockets.length })}
        </span>
      </button>
    );
  } else {
    // state is processing or done, so show the plug list
    contents = (
      <StripSocketsProcess socketList={state.socketList} socketStates={state.socketStates} />
    );
    if (state.tag === 'processing') {
      footer = (
        <button
          type="button"
          className={styles.insertButton}
          onClick={onCancel}
          disabled={state.cancelling}
        >
          <span>{t('StripSockets.Cancel')}</span>
        </button>
      );
    } else {
      footer = (
        <>
          <button
            type="button"
            className={styles.insertButton}
            onClick={() => stripDispatch({ tag: 'confirm_results' })}
          >
            <span>{t('StripSockets.Ok')}</span>
          </button>
        </>
      );
    }
  }

  return (
    <Sheet
      onClose={() => {
        onCancel();
        stripSocketsQuery$.next(undefined);
      }}
      header={header}
      footer={footer}
      sheetClassName={styles.stripSheet}
    >
      {contents}
    </Sheet>
  );
}

function StripSocketsProcess({
  socketList,
  socketStates,
}: {
  socketList: StripAction[];
  socketStates: SocketState[];
}) {
  return (
    <div className={styles.iconList}>
      {socketList.map((socket, idx) => {
        const state = socketStates[idx];
        const icon = (
          <div onClick={() => locateItem(socket.item)}>
            <DefItemIcon itemDef={socket.plugItemDef} />
          </div>
        );
        const failed = state !== 'ok' && state !== 'todo';
        const key = `${socket.item.index}-${socket.socketIndex}`;
        const className = clsx('item', styles.plug, {
          [styles.ok]: state === 'ok',
          [styles.failed]: failed,
        });
        return failed ? (
          <PressTip minimal key={key} className={className} tooltip={state}>
            {icon}
          </PressTip>
        ) : (
          <div key={key} className={className}>
            {icon}
          </div>
        );
      })}
    </div>
  );
}

function StripSocketsChoose({
  query,
  reportSockets,
}: {
  query: string;
  reportSockets: (sockets: StripAction[]) => void;
}) {
  const defs = useD2Definitions()!;
  const destiny2CoreSettings = useSelector(destiny2CoreSettingsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const filterFactory = useSelector(filterFactorySelector);
  const [activeKinds, setActiveKinds] = useState<SocketKind[]>([]);

  const socketKinds = useMemo(() => {
    if (!query) {
      return null;
    }

    const filterFunc = filterFactory(query);
    const filteredItems = allItems.filter((i) => i.sockets && filterFunc(i));
    return collectSocketsToStrip(filteredItems, destiny2CoreSettings, defs);
  }, [allItems, defs, destiny2CoreSettings, filterFactory, query]);

  useEffect(() => {
    reportSockets(
      socketKinds
        ?.filter((k) => k.items && activeKinds.includes(k.kind))
        .flatMap((k) => k.items!) || [],
    );
  }, [reportSockets, socketKinds, activeKinds]);

  return (
    socketKinds && (
      <>
        {socketKinds.length ? (
          socketKinds.map((entry) => {
            const itemCats = [
              { icon: handCannonIcon, num: entry.numWeapons },
              { icon: chestArmorItem, num: entry.numArmor },
              { icon: ghostIcon, num: entry.numOthers },
            ];
            return (
              <SocketKindButton
                key={entry.kind}
                name={t(entry.name, { count: entry.numApplicableSockets })}
                representativeDef={entry.representativePlug}
                itemCategories={itemCats}
                selected={activeKinds.includes(entry.kind)}
                onClick={() => {
                  if (activeKinds.includes(entry.kind)) {
                    setActiveKinds(activeKinds.filter((k) => k !== entry.kind));
                  } else {
                    setActiveKinds([...activeKinds, entry.kind]);
                  }
                }}
              />
            );
          })
        ) : (
          <div className={styles.noSocketsMessage}>{t('StripSockets.NoSockets')}</div>
        )}
      </>
    )
  );
}

function SocketKindButton({
  name,
  representativeDef,
  itemCategories,
  selected,
  onClick,
}: {
  name: string;
  representativeDef: DestinyInventoryItemDefinition;
  itemCategories: { icon: string; num: number }[];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={clsx(styles.socketKindButton, {
        [styles.selectedButton]: selected,
      })}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="item" title={name}>
        <DefItemIcon itemDef={representativeDef} />
      </div>
      <div className={styles.buttonInfo}>
        <div
          className={clsx(styles.buttonTitle, {
            [styles.selectedTitle]: selected,
          })}
        >
          {name}
        </div>
      </div>
      <div>
        {itemCategories.map(
          ({ icon, num }, idx) =>
            num > 0 && (
              <React.Fragment key={idx}>
                <img src={icon} className={styles.itemTypeIcon} /> {num}
                <br />
              </React.Fragment>
            ),
        )}
      </div>
    </div>
  );
}
