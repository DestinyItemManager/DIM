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
import { useD2Definitions } from 'app/manifest/selectors';
import {
  AppIcon,
  dragHandleIcon,
  enabledIcon,
  lockIcon,
  moveDownIcon,
  moveUpIcon,
  unlockedIcon,
  unselectedCheckIcon,
} from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import { delay } from 'app/utils/promises';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';
import _ from 'lodash';
import React, { Dispatch, useEffect, useRef } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorStatHashes, MinMax, ResolvedStatConstraint, StatRanges } from '../types';
import styles from './StatConstraintEditor.m.scss';

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus reordering the stat priority.
 */
export default function StatConstraintEditor({
  resolvedStatConstraints,
  statRangesFiltered,
  lbDispatch,
}: {
  resolvedStatConstraints: ResolvedStatConstraint[];
  /** The ranges the stats could have gotten to INCLUDING stat filters and mod compatibility */
  statRangesFiltered?: Readonly<StatRanges>;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const handleTierChange = (constraint: ResolvedStatConstraint) =>
    lbDispatch({ type: 'statConstraintChanged', constraint });

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
    <DragDropContext onDragEnd={onDragEnd} sensors={[useButtonSensor]}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div ref={provided.innerRef}>
            {resolvedStatConstraints.map((c, index) => {
              const statHash = c.statHash as ArmorStatHashes;
              return (
                <StatRow
                  key={statHash}
                  statConstraint={c}
                  index={index}
                  statRange={statRangesFiltered?.[statHash]}
                  onTierChange={handleTierChange}
                />
              );
            })}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function StatRow({
  statConstraint,
  statRange,
  index,
  onTierChange,
}: {
  statConstraint: ResolvedStatConstraint;
  statRange?: MinMax;
  index: number;
  onTierChange: (constraint: ResolvedStatConstraint) => void;
}) {
  const defs = useD2Definitions()!;
  const c = statConstraint;
  const statHash = c.statHash as ArmorStatHashes;
  const statDef = defs.Stat.get(statHash);
  const focused = useRef<number | undefined>(undefined);
  const statBarRef = useRef<HTMLDivElement>(null);

  // TODO: enhance the tooltip w/ info about what the LO settings mean (locked, min/max, etc)
  // TODO: enhance the tooltip w/ info about why the numbers are greyed
  // TODO: show max stat here
  // TODO: populate tooltip equipped hashes
  // TODO: actually implement the up and down buttons, lock icon
  // TODO: button titles
  // TODO: Maybe have an "auto choose best tier" mode?
  // TODO: "Stat preference" heading?

  const statLocked = statConstraint.minTier === statConstraint.maxTier;
  const handleToggleLocked = () =>
    onTierChange({ ...statConstraint, maxTier: statLocked ? 10 : statConstraint.minTier });

  const handleIgnore = () => onTierChange({ ...statConstraint, ignored: !statConstraint.ignored });

  // Support keyboard interaction
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const tierNum = statConstraint.minTier;
    if (event.repeat) {
      return;
    }
    switch (event.key) {
      case '-':
      case '_':
      case 'ArrowLeft': {
        if (tierNum > 0) {
          onTierChange({ ...statConstraint, minTier: tierNum - 1 });
        }
        focused.current = tierNum - 1;
        break;
      }
      case '=':
      case '+':
      case 'ArrowRight': {
        if (tierNum < 10) {
          onTierChange({ ...statConstraint, minTier: tierNum + 1 });
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
        onTierChange({ ...statConstraint, minTier: num });
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

  const name = (
    <span className={clsx({ [styles.ignored]: c.ignored }, styles.statDisplayInfo)}>
      <BungieImage className={styles.iconStat} src={statDef.displayProperties.icon} />
      <span className={styles.statName} title={statDef.displayProperties.name}>
        {statDef.displayProperties.name}
      </span>
    </span>
  );
  return (
    <DraggableItem id={statHash.toString()} index={index} className={styles.row} name={name}>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.rowControl}
          title={t('LoadoutBuilder.LockStat')}
          onClick={handleToggleLocked}
          disabled={statConstraint.ignored}
        >
          <AppIcon icon={statLocked ? lockIcon : unlockedIcon} />
        </button>
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
        <button
          type="button"
          className={styles.rowControl}
          onClick={handleIgnore}
          title={t('LoadoutBuilder.IgnoreStat')}
        >
          <AppIcon icon={statConstraint.ignored ? unselectedCheckIcon : enabledIcon} />
        </button>
      </div>
      <AnimatePresence>
        {!statConstraint.ignored && (
          <div className={styles.statBar} role="group" ref={statBarRef}>
            {_.times(11, (tierNum) => (
              <div
                role="button"
                tabIndex={tierNum === statConstraint.minTier ? 0 : -1}
                key={tierNum}
                className={clsx(styles.statBarSegment, {
                  [styles.selectedStatBar]: statConstraint.minTier >= tierNum,
                  [styles.maxed]: tierNum > (statRange?.max ?? 100) / 10,
                  [styles.locked]: tierNum > statConstraint.maxTier,
                })}
                onClick={() => onTierChange({ ...statConstraint, minTier: tierNum })}
                onKeyDown={handleKeyDown}
                data-tier={tierNum}
              >
                <PressTip
                  tooltip={
                    <StatTooltip
                      stat={{
                        hash: statHash,
                        value: tierNum * 10,
                        name: statDef.displayProperties.name,
                        description: statDef.displayProperties.description,
                      }}
                      equippedHashes={new Set()}
                    />
                  }
                >
                  {tierNum}
                </PressTip>
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </DraggableItem>
  );
}

function DraggableItem({
  id,
  index,
  name,
  className,
  children,
}: {
  id: string;
  index: number;
  className: string;
  name: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          className={className}
          data-index={index}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <label {...provided.dragHandleProps}>
            <span className={styles.grip}>
              <AppIcon icon={dragHandleIcon} />
            </span>
            {name}
          </label>
          {children}
        </div>
      )}
    </Draggable>
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
        await delay(3000);
        actions.drop();
      })();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [api]);
}
