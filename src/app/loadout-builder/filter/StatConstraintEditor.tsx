import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import BungieImage from 'app/dim-ui/BungieImage';
import { PressTip } from 'app/dim-ui/PressTip';
import { useD2Definitions } from 'app/manifest/selectors';
import {
  AppIcon,
  dragHandleIcon,
  enabledIcon,
  moveDownIcon,
  moveUpIcon,
  unlockedIcon,
  unselectedCheckIcon,
} from 'app/shell/icons';
import StatTooltip from 'app/store-stats/StatTooltip';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';
import _ from 'lodash';
import React, { Dispatch } from 'react';
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
    <DragDropContext onDragEnd={onDragEnd}>
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

  // TODO: enhance the tooltip w/ info about what the LO settings mean (locked, min/max, etc)
  // TODO: enhance the tooltip w/ info about why the numbers are greyed
  // TODO: show max stat here
  // TODO: populate tooltip equipped hashes
  // TODO: actually implement the up and down buttons, lock icon
  // TODO: button titles
  // TODO: Maybe have an "auto choose best tier" mode?
  // TODO: "Stat preference" heading?

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
        <button type="button" className={styles.rowControl}>
          <AppIcon icon={unlockedIcon} />
        </button>
        <button type="button" className={styles.rowControl}>
          <AppIcon icon={moveUpIcon} />
        </button>
        <button type="button" className={styles.rowControl}>
          <AppIcon icon={moveDownIcon} />
        </button>
        <button
          type="button"
          className={styles.rowControl}
          onClick={() => onTierChange({ ...statConstraint, ignored: !statConstraint.ignored })}
        >
          <AppIcon icon={!statConstraint.ignored ? enabledIcon : unselectedCheckIcon} />
        </button>
      </div>
      <AnimatePresence>
        {!statConstraint.ignored && (
          <div className={styles.statBar}>
            {_.times(11, (tierNum) => (
              <div
                key={tierNum}
                className={clsx(styles.statBarSegment, {
                  [styles.selectedStatBar]: statConstraint.minTier >= tierNum,
                  [styles.maxed]: tierNum > (statRange?.max ?? 100) / 10,
                  [styles.locked]: tierNum >= statConstraint.maxTier,
                })}
                onClick={() => onTierChange({ ...statConstraint, minTier: tierNum })}
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
