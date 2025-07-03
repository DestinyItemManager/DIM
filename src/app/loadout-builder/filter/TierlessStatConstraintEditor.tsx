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
import { t } from 'app/i18next-t';
import { DimStore } from 'app/inventory/store-types';
import { MAX_STAT } from 'app/loadout/known-values';
import LoadoutEditSection from 'app/loadout/loadout-edit/LoadoutEditSection';
import { useD2Definitions } from 'app/manifest/selectors';
import { percent } from 'app/shell/formatters';
import {
  AppIcon,
  dragHandleIcon,
  faCheckSquare,
  faSquare,
  moveDownIcon,
  moveUpIcon,
} from 'app/shell/icons';
import { delay } from 'app/utils/promises';
import clsx from 'clsx';
import { Dispatch, useEffect, useState } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorStatHashes, MinMaxStat, ResolvedStatConstraint, StatRanges } from '../types';
import styles from './TierlessStatConstraintEditor.m.scss';

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus
 * reordering the stat priority. This does not use tiers, it allows selecting
 * exact stat values and is mean to be used after Edge of Fate releases and
 * makes all stats have an incremental effect.
 */
export default function TierlessStatConstraintEditor({
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
  const handleStatChange = (constraint: ResolvedStatConstraint) =>
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

  return (
    <LoadoutEditSection
      title={t('LoadoutBuilder.StatConstraints')}
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
                    onStatChange={handleStatChange}
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
  onStatChange,
  equippedHashes,
}: {
  statConstraint: ResolvedStatConstraint;
  statRange?: MinMaxStat;
  index: number;
  onStatChange: (constraint: ResolvedStatConstraint) => void;
  equippedHashes: Set<number>;
}) {
  const defs = useD2Definitions()!;
  const statHash = statConstraint.statHash as ArmorStatHashes;
  const statDef = defs.Stat.get(statHash);
  const handleIgnore = () => onStatChange({ ...statConstraint, ignored: !statConstraint.ignored });
  const handleSelectStat = (statValue: number, setMax: boolean) =>
    setMax
      ? onStatChange({
          ...statConstraint,
          minStat: Math.min(statConstraint.minStat, statValue),
          maxStat: statValue,
        })
      : onStatChange({
          ...statConstraint,
          minStat: statValue,
          maxStat: Math.max(statConstraint.maxStat, statValue),
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
            <StatEditBar statConstraint={statConstraint} onSelected={handleSelectStat}>
              <StatBar
                statConstraint={statConstraint}
                range={statRange}
                equippedHashes={equippedHashes}
              />
            </StatEditBar>
          )}
        </div>
      )}
    </Draggable>
  );
}

function StatEditBar({
  statConstraint,
  onSelected,
  children,
}: {
  statConstraint: ResolvedStatConstraint;
  onSelected: (statValue: number, setMax: boolean) => void;
  children: React.ReactNode;
}) {
  const [min, setMin] = useState(statConstraint.minStat);
  const [max, setMax] = useState(statConstraint.maxStat);

  useEffect(() => {
    // If the stat range changes, update the min/max values
    if (statConstraint) {
      setMin(statConstraint.minStat);
      setMax(statConstraint.maxStat);
    }
  }, [statConstraint]);

  // TODO: enhance the tooltip w/ info about what the LO settings mean (locked, min/max, etc)
  // TODO: enhance the tooltip w/ info about why the numbers are greyed

  return (
    <div className={styles.statBar}>
      <input
        type="number"
        min={0}
        max={MAX_STAT}
        value={min}
        aria-label={t('LoadoutBuilder.StatMin')}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          setMin(value);
        }}
        onBlur={() => {
          onSelected(min, false);
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            onSelected(min, false);
          }
        }}
      />
      {children}
      <input
        type="number"
        min={0}
        max={MAX_STAT}
        value={max}
        aria-label={t('LoadoutBuilder.StatMax')}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          setMax(value);
        }}
        onBlur={() => {
          onSelected(max, true);
        }}
        onKeyUp={(e) => {
          if (e.key === 'Enter') {
            onSelected(max, true);
          }
        }}
      />
    </div>
  );
}

function StatBar({
  statConstraint,
  range,
}: {
  statConstraint: ResolvedStatConstraint;
  range?: MinMaxStat;
  equippedHashes: Set<number>;
}) {
  // TODO: tooltip? Or just show the numbers. Maybe show the effective max/min if it's not different from the statConstraint?

  // TODO: click to set minimum/maximum? drag?

  return (
    <div
      className={styles.statRange}
      title={
        range &&
        t('LoadoutBuilder.StatRangeTooltip', {
          min: range.minStat,
          max: range.maxStat,
        })
      }
    >
      {range && (
        <div
          className={clsx(styles.statBarFill)}
          style={{
            left: percent(range.minStat / MAX_STAT),
            width: percent((range.maxStat - range.minStat) / MAX_STAT),
          }}
        />
      )}
      {(!range || range.minStat !== statConstraint.minStat) && (
        <div
          key="min"
          className={styles.statBarMin}
          style={{ left: percent(statConstraint.minStat / MAX_STAT) }}
        />
      )}
      {(!range || range.maxStat !== statConstraint.maxStat) && (
        <div
          key="max"
          className={styles.statBarMax}
          style={{ left: percent(statConstraint.maxStat / MAX_STAT) }}
        />
      )}
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
