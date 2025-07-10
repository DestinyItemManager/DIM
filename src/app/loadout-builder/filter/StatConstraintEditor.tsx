import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
  PreDragActions,
  SensorAPI,
  SnapDragActions,
} from '@hello-pangea/dnd';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { MAX_STAT } from 'app/loadout/known-values';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  AppIcon,
  dragHandleIcon,
  faCheckSquare,
  faSquare,
  moveDownIcon,
  moveUpIcon,
} from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { useShiftHeld } from 'app/utils/hooks';
import { delay } from 'app/utils/promises';
import clsx from 'clsx';
import React, { Dispatch, useEffect, useRef } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorStatHashes, MinMaxStat, ResolvedStatConstraint, StatRanges } from '../types';
import { statTier } from '../utils';
import styles from './StatConstraintEditor.m.scss';

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus reordering the stat priority.
 */
export default function StatConstraintEditor({
  store,
  resolvedStatConstraints,
  statRangesFiltered,
  equippedHashes,
  className,
  lbDispatch,
}: {
  store: DimStore;
  resolvedStatConstraints: ResolvedStatConstraint[];
  /** The ranges the stats could have gotten to INCLUDING stat filters and mod compatibility */
  statRangesFiltered?: Readonly<StatRanges>;
  equippedHashes: Set<number>;
  className?: string;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const handleTierChange = (constraint: ResolvedStatConstraint) =>
    lbDispatch({ type: 'statConstraintChanged', constraint });

  const handleClear = () => lbDispatch({ type: 'statConstraintReset' });

  const handleRandomize = () => lbDispatch({ type: 'statConstraintRandomize' });

  const handleSyncFromEquipped = () => {
    const constraints = Object.values(store.stats).map(
      (s): ResolvedStatConstraint => ({
        statHash: s.hash,
        ignored: false,
        maxStat: MAX_STAT,
        minStat: s.value,
      }),
    );
    lbDispatch({ type: 'setStatConstraints', constraints });
  };

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const sourceIndex = result.source.index;
    lbDispatch({
      type: 'statOrderChanged',
      sourceIndex,
      destinationIndex: result.destination.index,
    });
  };

  const shiftHeld = useShiftHeld();

  return (
    <LoadoutEditSection
      title={
        t('LoadoutBuilder.StatConstraints') + (shiftHeld ? ` (${t('LoadoutBuilder.StatMax')})` : '')
      }
      className={className}
      onClear={handleClear}
      onSyncFromEquipped={handleSyncFromEquipped}
      onRandomize={handleRandomize}
    >
      <DragDropContext onDragEnd={onDragEnd} sensors={[useButtonSensor]}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div ref={provided.innerRef} className={styles.editor}>
              {resolvedStatConstraints.map((c, index) => {
                const statHash = c.statHash as ArmorStatHashes;
                return (
                  <StatRow
                    key={statHash}
                    statConstraint={c}
                    index={index}
                    statRange={statRangesFiltered?.[statHash]}
                    onTierChange={handleTierChange}
                    equippedHashes={equippedHashes}
                  />
                );
              })}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </LoadoutEditSection>
  );
}

function StatRow({
  statConstraint,
  statRange,
  index,
  onTierChange,
  equippedHashes,
}: {
  statConstraint: ResolvedStatConstraint;
  statRange?: MinMaxStat;
  index: number;
  onTierChange: (constraint: ResolvedStatConstraint) => void;
  equippedHashes: Set<number>;
}) {
  const defs = useD2Definitions()!;
  const statHash = statConstraint.statHash as ArmorStatHashes;
  const statDef = defs.Stat.get(statHash);
  const handleIgnore = () => onTierChange({ ...statConstraint, ignored: !statConstraint.ignored });
  const handleSelectTier = (tierNum: number, setMax: boolean /* shift key */) =>
    setMax
      ? onTierChange({
          ...statConstraint,
          minStat: Math.min(statConstraint.minStat, tierNum * 10),
          maxStat: tierNum * 10,
        })
      : onTierChange({
          ...statConstraint,
          minStat: tierNum * 10,
          maxStat: Math.max(statConstraint.maxStat, tierNum * 10),
        });

  return (
    <Draggable draggableId={statHash.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          className={clsx(styles.row, {
            [styles.dragging]: snapshot.isDragging,
            [styles.ignored]: statConstraint.ignored,
          })}
          data-index={index}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <span
            className={styles.grip}
            {...provided.dragHandleProps}
            tabIndex={-1}
            aria-hidden={true}
          >
            <AppIcon icon={dragHandleIcon} />
          </span>
          <div className={styles.name}>
            <button
              type="button"
              role="checkbox"
              aria-checked={!statConstraint.ignored}
              className={styles.rowControl}
              onClick={handleIgnore}
              title={t('LoadoutBuilder.IgnoreStat')}
            >
              <AppIcon icon={statConstraint.ignored ? faSquare : faCheckSquare} />
            </button>
            <div className={styles.label} {...provided.dragHandleProps}>
              <BungieImage
                className={styles.iconStat}
                src={statDef.displayProperties.icon}
                aria-hidden={true}
                alt=""
              />
              {statDef.displayProperties.name}
            </div>
          </div>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.rowControl}
              title={t('LoadoutBuilder.IncreaseStatPriority')}
              disabled={index === 0}
              tabIndex={-1 /* Better to use the react-dnd keyboard interactions than this button */}
              data-direction="up"
              data-draggable-id={statHash.toString()}
            >
              <AppIcon icon={moveUpIcon} />
            </button>
            <button
              type="button"
              className={styles.rowControl}
              title={t('LoadoutBuilder.DecreaseStatPriority')}
              disabled={index === 5}
              tabIndex={-1 /* Better to use the react-dnd keyboard interactions than this button */}
              data-direction="down"
              data-draggable-id={statHash.toString()}
            >
              <AppIcon icon={moveDownIcon} />
            </button>
          </div>
          {!statConstraint.ignored && (
            <StatTierBar
              statConstraint={statConstraint}
              statRange={statRange}
              equippedHashes={equippedHashes}
              onSelected={handleSelectTier}
            />
          )}
        </div>
      )}
    </Draggable>
  );
}

function StatTierBar({
  statConstraint,
  statRange,
  onSelected,
  equippedHashes,
}: {
  statConstraint: ResolvedStatConstraint;
  statRange?: MinMaxStat;
  onSelected: (tierNum: number, shift: boolean) => void;
  equippedHashes: Set<number>;
}) {
  const defs = useD2Definitions()!;
  const statHash = statConstraint.statHash as ArmorStatHashes;
  const statDef = defs.Stat.get(statHash);
  const focused = useRef<number | undefined>(undefined);
  const statBarRef = useRef<HTMLDivElement>(null);

  // Support keyboard interaction
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const tierNum = statTier(statConstraint.minStat);
    if (event.repeat) {
      return;
    }
    switch (event.key) {
      case '-':
      case '_':
      case 'ArrowLeft': {
        if (tierNum > 0) {
          onSelected(tierNum - 1, event.shiftKey);
        }
        focused.current = tierNum - 1;
        break;
      }
      case '=':
      case '+':
      case 'ArrowRight': {
        if (tierNum < 10) {
          onSelected(tierNum + 1, event.shiftKey);
        }
        focused.current = tierNum + 1;
        break;
      }

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '0': {
        let num = parseInt(event.key, 10);
        if (num === 0) {
          num = 10;
        }
        onSelected(num, event.shiftKey);
        focused.current = num;
        break;
      }

      default:
        break;
    }
  };

  // When changing the value via keyboard, update focus
  useEffect(() => {
    if (focused.current) {
      const segment = statBarRef.current?.querySelector(`[data-tier="${focused.current}"]`);
      (segment as HTMLElement)?.focus();
      focused.current = undefined;
    }
  });

  // TODO: enhance the tooltip w/ info about what the LO settings mean (locked, min/max, etc)
  // TODO: enhance the tooltip w/ info about why the numbers are greyed

  return (
    <div
      className={styles.statBar}
      role="group"
      ref={statBarRef}
      aria-label={t('LoadoutBuilder.TierSelect')}
    >
      {Array.from({ length: 11 }, (_, tierNum) => (
        <div
          role="button"
          tabIndex={tierNum === statTier(statConstraint.minStat) ? 0 : -1}
          key={tierNum}
          className={clsx(styles.statBarSegment, {
            [styles.selectedStatBar]: statTier(statConstraint.minStat) >= tierNum,
            [styles.maxRestricted]: tierNum > statTier(statConstraint.maxStat),
            [styles.maxed]: tierNum > statTier(statRange?.maxStat ?? 100),
          })}
          onClick={(e) => onSelected(tierNum, e.shiftKey)}
          onKeyDown={handleKeyDown}
          data-tier={tierNum}
          aria-label={t('LoadoutBuilder.TierNumber', { tier: tierNum })}
        >
          <PressTip
            tooltip={
              <StatTooltip
                stat={{
                  hash: statHash,
                  value: tierNum * 10,
                  displayProperties: statDef.displayProperties,
                }}
                equippedHashes={equippedHashes}
              />
            }
            placement="bottom"
          >
            {tierNum}
          </PressTip>
        </div>
      ))}
    </div>
  );
}

// Listen for button presses on the up and down buttons and turn it into lift+move+drop actions.
function useButtonSensor(api: SensorAPI) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Event already used
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target as HTMLButtonElement;
      if (
        target.tagName !== 'BUTTON' ||
        target.disabled ||
        !target.dataset.direction ||
        !target.dataset.draggableId
      ) {
        return;
      }

      const draggableId = target.dataset.draggableId;
      if (!draggableId) {
        return;
      }

      const preDrag: PreDragActions | null = api.tryGetLock(draggableId);
      if (!preDrag) {
        return;
      }

      // we are consuming the event
      event.preventDefault();

      (async () => {
        const actions: SnapDragActions = preDrag.snapLift();
        if (target.dataset.direction === 'down') {
          actions.moveDown();
        } else if (target.dataset.direction === 'up') {
          actions.moveUp();
        }
        await delay(300);
        actions.drop();
      })();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [api]);
}
