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
import { Dispatch, useEffect, useId, useRef, useState } from 'react';
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
  processing,
}: {
  store: DimStore;
  resolvedStatConstraints: ResolvedStatConstraint[];
  /** The ranges the stats could have gotten to INCLUDING stat filters and mod compatibility */
  statRangesFiltered?: Readonly<StatRanges>;
  equippedHashes: Set<number>;
  className?: string;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  processing: boolean;
}) {
  // Actually change the stat constraints in the LO state, which triggers recalculation of sets.
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

  // Handle dropping the stat constraints in a new order
  const handleDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    if (sourceIndex !== destinationIndex) {
      lbDispatch({
        type: 'statOrderChanged',
        sourceIndex,
        destinationIndex: result.destination.index,
      });
    }
  };

  return (
    <LoadoutEditSection
      title={t('LoadoutBuilder.StatConstraints')}
      className={className}
      onClear={handleClear}
      onSyncFromEquipped={handleSyncFromEquipped}
      onRandomize={handleRandomize}
    >
      <DragDropContext onDragEnd={handleDragEnd} sensors={[useButtonSensor]}>
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
                    processing={processing}
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
  processing,
}: {
  statConstraint: ResolvedStatConstraint;
  statRange?: MinMaxStat;
  index: number;
  onStatChange: (constraint: ResolvedStatConstraint) => void;
  equippedHashes: Set<number>;
  processing: boolean;
}) {
  const defs = useD2Definitions()!;
  const statHash = statConstraint.statHash as ArmorStatHashes;
  const statDef = defs.Stat.get(statHash);
  const handleIgnore = () => onStatChange({ ...statConstraint, ignored: !statConstraint.ignored });

  const setMin = (value: number) => {
    if (value !== statConstraint.minStat) {
      onStatChange({
        ...statConstraint,
        minStat: value,
        maxStat: Math.max(value, statConstraint.maxStat),
      });
    }
  };
  const setMax = (value: number) => {
    if (value !== statConstraint.maxStat) {
      onStatChange({
        ...statConstraint,
        minStat: Math.min(value, statConstraint.minStat),
        maxStat: value,
      });
    }
  };

  const min = statConstraint.minStat;
  const max = statConstraint.maxStat;

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
            <StatEditBar min={min} max={max} setMin={setMin} setMax={setMax}>
              <StatBar
                range={statRange}
                equippedHashes={equippedHashes}
                min={min}
                max={max}
                setMin={setMin}
                setMax={setMax}
                processing={processing}
              />
            </StatEditBar>
          )}
        </div>
      )}
    </Draggable>
  );
}

function StatEditBar({
  min,
  max,
  setMin,
  setMax,
  children,
}: {
  min: number;
  max: number;
  setMin: (value: number) => void;
  setMax: (value: number) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  const [minText, setMinText] = useState(min.toString());
  const [maxText, setMaxText] = useState(max.toString());
  useEffect(() => {
    setMinText(min.toString());
  }, [min]);
  useEffect(() => {
    setMaxText(max.toString());
  }, [max]);

  const setMinMaxFromText = (text: string, setter: (s: number) => void) => {
    const value = parseInt(text, 10);
    if (isNaN(value) || value < 0 || value > MAX_STAT) {
      return;
    }
    setter(value);
  };
  const setMinFromText = setMinMaxFromText.bind(null, minText, setMin);
  const setMaxFromText = setMinMaxFromText.bind(null, maxText, setMax);

  const handleEnter = (setter: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setter();
    }
  };

  return (
    <div className={styles.statBar}>
      <input
        id={`${id}-min`}
        type="number"
        min={0}
        max={MAX_STAT}
        value={minText}
        aria-label={t('LoadoutBuilder.StatMin')}
        onChange={(e) => {
          setMinText(e.target.value);
        }}
        onBlur={setMinFromText}
        onKeyDown={handleEnter(setMinFromText)}
      />
      {children}
      <input
        id={`${id}-max`}
        type="number"
        min={0}
        max={MAX_STAT}
        value={maxText}
        aria-label={t('LoadoutBuilder.StatMax')}
        onChange={(e) => {
          setMaxText(e.target.value);
        }}
        onBlur={setMaxFromText}
        onKeyDown={handleEnter(setMaxFromText)}
      />
    </div>
  );
}

function StatBar({
  min,
  max,
  range,
  setMin,
  setMax,
  processing,
}: {
  range?: MinMaxStat;
  equippedHashes: Set<number>;
  min: number;
  max: number;
  setMin: (value: number) => void;
  setMax: (value: number) => void;
  processing: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  // Whether we're dragging the max or min value
  const draggingMax = useRef(false);
  const lastClickTime = useRef(0);

  // Set the live value of min or max based on where the pointer is
  const setValueToPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const value = Math.round(ratio * MAX_STAT);
    setDragValue(value);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setValueToPointer(e);
  };

  // Commit the value on pointer up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    bar.releasePointerCapture(e.pointerId);
    // Detect double-click
    if (performance.now() - lastClickTime.current < 200 && !draggingMax.current && range) {
      setMin(range.maxStat);
    } else {
      draggingMax.current ? setMax(dragValue) : setMin(dragValue);
    }
    setDragging(false);
    lastClickTime.current = performance.now();
  };
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If you shift-click you set max, or if you click on the max bar first.
    draggingMax.current = e.shiftKey || (e.target as Element).classList.contains(styles.statBarMax);
    const bar = e.currentTarget;
    bar.setPointerCapture(e.pointerId);
    setValueToPointer(e);
    setDragging(true);
  };

  const effectiveMin = dragging && !draggingMax.current ? dragValue : min;
  const effectiveMax = dragging && draggingMax.current ? dragValue : max;

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
      onPointerDown={handlePointerDown}
      onPointerUp={dragging ? handlePointerUp : undefined}
      onPointerMove={dragging ? handlePointerMove : undefined}
    >
      {range && range.minStat < range.maxStat && (
        <div
          className={clsx(styles.statBarFill, { [styles.processing]: processing })}
          style={{
            left: percent(range.minStat / MAX_STAT),
            width: percent((range.maxStat - range.minStat) / MAX_STAT),
          }}
        />
      )}
      {(!range || range.minStat !== max) && (
        <div
          key="min"
          className={styles.statBarMin}
          style={{ left: percent(effectiveMin / MAX_STAT) }}
        />
      )}
      {(!range || range.maxStat !== max) && (
        <div
          key="max"
          className={styles.statBarMax}
          style={{ left: percent(effectiveMax / MAX_STAT) }}
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
