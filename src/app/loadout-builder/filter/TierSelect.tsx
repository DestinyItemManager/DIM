import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, dragHandleIcon } from 'app/shell/icons';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import produce from 'immer';
import _ from 'lodash';
import React from 'react';
import {
  ArmorStatHashes,
  MinMax,
  MinMaxPriority,
  Priority,
  StatFilters,
  StatRanges,
} from '../types';
import { statTierWithHalf } from '../utils';
import styles from './TierSelect.m.scss';

const IGNORE = 'ignore';
const INCLUDE = 'include';
const MinMaxSelect = React.memo(MinMaxSelectInner);

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus reordering the stat priority.
 */
export default function TierSelect({
  stats,
  statRangesFiltered,
  order,
  onStatOrderChanged,
  onStatFiltersChanged,
}: {
  stats: StatFilters;
  /** The ranges the stats could have gotten to INCLUDING stat filters and mod compatibility */
  statRangesFiltered?: Readonly<StatRanges>;
  order: ArmorStatHashes[]; // stat hashes in user order
  onStatOrderChanged(order: ArmorStatHashes[]): void;
  onStatFiltersChanged(stats: StatFilters): void;
}) {
  const defs = useD2Definitions()!;
  const statDefs: { [statHash: number]: DestinyStatDefinition } = {};
  for (const statHash of order) {
    statDefs[statHash] = defs.Stat.get(statHash);
  }

  // TODO All of this looks awful because lints yell against trivial React node closures in map
  // and we have to handle both the "vanilla" stat order and the priority stat order here.

  const statBox = (
    statHash: ArmorStatHashes,
    index: number,
    handleTierChange: (statHash: ArmorStatHashes, changed: MinMaxPriority) => void
  ) => (
    <StatBox
      key={statHash}
      statHash={statHash}
      index={index}
      stat={stats[statHash]}
      statDef={statDefs[statHash]}
      statRange={statRangesFiltered?.[statHash]}
      handleTierChange={handleTierChange}
    />
  );

  if ($featureFlags.experimentalLoSettings) {
    const statDefs: { [statHash: number]: DestinyStatDefinition } = {};
    for (const statHash of order) {
      statDefs[statHash] = defs.Stat.get(statHash);
    }

    const statsByArea: { [key in Priority]?: ArmorStatHashes[] } = {
      prioritized: order.filter((hash) => stats[hash].priority === 'prioritized'),
      considered: order.filter((hash) => stats[hash].priority === 'considered'),
      ignored: order.filter((hash) => stats[hash].priority === 'ignored'),
    };

    const moveTo = (
      sourceArea: Priority,
      sourceIndex: number,
      destArea: Priority,
      destIndex: number,
      update: MinMaxPriority | undefined
    ) => {
      const [newStatsByArea, newFilters] = produce(
        [statsByArea, stats],
        ([draftHashes, draftFilters]) => {
          const [statHash] = draftHashes[sourceArea]!.splice(sourceIndex, 1);
          (draftHashes[destArea] ??= []).splice(destIndex, 0, statHash);
          draftFilters[statHash] = { ...stats[statHash], ...update, priority: destArea };
        }
      );
      const newOrder = ['prioritized', 'considered', 'ignored'].flatMap(
        (area) => newStatsByArea[area] ?? []
      );
      onStatOrderChanged(newOrder);
      onStatFiltersChanged(newFilters);
    };

    const handleTierChange = (statHash: ArmorStatHashes, changed: MinMaxPriority) => {
      const sourceArea = stats[statHash].priority;
      const sourceIndex = statsByArea[sourceArea]!.findIndex((hash) => hash === statHash)!;
      if (sourceArea !== changed.priority) {
        const destIndex =
          changed.priority === 'ignored'
            ? 0
            : changed.priority === 'prioritized'
            ? statsByArea.prioritized?.length ?? 0
            : sourceArea === 'prioritized'
            ? 0
            : statsByArea.considered?.length ?? 0;

        moveTo(sourceArea, sourceIndex, changed.priority, destIndex, changed);
      } else {
        moveTo(sourceArea, sourceIndex, sourceArea, sourceIndex, changed);
      }
    };

    const onDragEnd = (result: DropResult) => {
      // dropped outside the list
      if (!result.destination) {
        return;
      }

      moveTo(
        result.source.droppableId as Priority,
        result.source.index,
        result.destination.droppableId as Priority,
        result.destination.index,
        undefined
      );
    };

    const priorityArea = (
      label: string,
      dropLabel: string,
      id: Priority,
      relevantStats: ArmorStatHashes[] | undefined
    ) => (
      <Droppable droppableId={id}>
        {(provided) => (
          <div className={clsx(styles.dropArea, { [styles.empty]: !relevantStats?.length })}>
            <span className={styles.areaDesignation}>{label}</span>
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {relevantStats?.length ? (
                relevantStats.map((val, idx) => statBox(val, idx, handleTierChange))
              ) : (
                <div className={styles.areaPlaceHolder}>
                  <i>{dropLabel}</i>
                </div>
              )}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    );

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        {priorityArea(
          'Prioritized',
          'Drag here to prioritize',
          'prioritized',
          statsByArea.prioritized
        )}
        {priorityArea('Considered', 'Drag here to consider', 'considered', statsByArea.considered)}
        {priorityArea('Ignored', 'Drag here to ignore', 'ignored', statsByArea.ignored)}
      </DragDropContext>
    );
  } else {
    const handleTierChange = (
      statHash: ArmorStatHashes,
      changed: { min?: number; max?: number; priority: Priority }
    ) => {
      const newTiers = {
        ...stats,
        [statHash]: { ...stats[statHash], ...changed },
      };

      onStatFiltersChanged(newTiers);
    };

    const statDefs: { [statHash: number]: DestinyStatDefinition } = {};
    for (const statHash of order) {
      statDefs[statHash] = defs.Stat.get(statHash);
    }

    const onDragEnd = (result: DropResult) => {
      // dropped outside the list
      if (!result.destination) {
        return;
      }
      const newOrder = reorder(order, result.source.index, result.destination.index);
      onStatOrderChanged(newOrder);
    };

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div ref={provided.innerRef}>
              {order.map((val, idx) => statBox(val, idx, handleTierChange))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

function StatBox({
  statHash,
  index,
  stat,
  statDef,
  statRange,
  handleTierChange,
}: {
  statHash: ArmorStatHashes;
  index: number;
  stat: MinMaxPriority;
  statDef: DestinyStatDefinition;
  statRange: MinMax | undefined;
  handleTierChange: (statHash: ArmorStatHashes, changed: MinMaxPriority) => void;
}) {
  return (
    <DraggableItem
      id={statHash.toString()}
      index={index}
      className={styles.row}
      name={
        <span
          className={clsx(
            { [styles.ignored]: stat.priority === 'ignored' },
            styles.statDisplayInfo
          )}
        >
          <BungieImage className={styles.iconStat} src={statDef.displayProperties.icon} />
          <span className={styles.statName} title={statDef.displayProperties.name}>
            {statDef.displayProperties.name}
          </span>
        </span>
      }
    >
      <span className={styles.range}>
        {statRange
          ? t('LoadoutBuilder.MaxTier', {
              tier: t('LoadoutBuilder.TierNumber', {
                tier: statTierWithHalf(statRange.max),
              }),
            })
          : '-'}
      </span>
      <MinMaxSelect
        statHash={statHash}
        stat={stat}
        type="Min"
        handleTierChange={handleTierChange}
      />
      <MinMaxSelect
        statHash={statHash}
        stat={stat}
        type="Max"
        handleTierChange={handleTierChange}
      />
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

function MinMaxSelectInner({
  statHash,
  type,
  stat,
  handleTierChange,
}: {
  statHash: number;
  type: 'Min' | 'Max';
  /** Filter config for a single stat */
  stat: MinMaxPriority;
  handleTierChange(statHash: number, stat: MinMaxPriority): void;
}) {
  const min = 0;
  const max = 10;
  const ignored = stat.priority === 'ignored';

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    let update: MinMaxPriority;
    if (e.target.value === IGNORE || e.target.value === INCLUDE) {
      update = {
        min: stat.min,
        max: stat.max,
        priority: e.target.value === IGNORE ? 'ignored' : 'considered',
      };
    } else {
      const value = parseInt(e.target.value, 10);
      update =
        type === 'Min'
          ? {
              min: value,
              max: Math.max(stat.max, value),
              priority: stat.priority,
            }
          : {
              min: Math.min(stat.min, value),
              max: value,
              priority: stat.priority,
            };
    }

    handleTierChange(statHash, update);
  }

  const value = type === 'Min' ? Math.max(min, stat.min) : Math.min(max, stat.max);
  return (
    <select
      className={type === 'Min' ? styles.minimum : styles.maximum}
      value={ignored ? '-' : value}
      onChange={handleChange}
    >
      <option disabled>
        {t(`LoadoutBuilder.Select${type}`, { metadata: { keys: 'minMax' } })}
      </option>
      {!ignored &&
        _.range(min, max + 1).map((tier) => (
          <option key={tier} value={tier}>
            {t('LoadoutBuilder.TierNumber', {
              tier,
            })}
          </option>
        ))}
      <option key="-" value="-" disabled>
        -
      </option>
      {ignored ? (
        <option key={INCLUDE} value={INCLUDE}>
          {t('LoadoutBuilder.StatTierIncludeOption')}
        </option>
      ) : (
        <option key={IGNORE} value={IGNORE}>
          {t('LoadoutBuilder.StatTierIgnoreOption')}
        </option>
      )}
    </select>
  );
}

// a little function to help us with reordering the result
function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}
