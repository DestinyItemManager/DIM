import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, dragHandleIcon } from 'app/shell/icons';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { StatHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { ArmorStatHashes, MinMax, MinMaxIgnored, StatFilters, StatRanges } from '../types';
import { statTier, statTierWithHalf } from '../utils';
import styles from './TierSelect.m.scss';

const IGNORE = 'ignore';
const INCLUDE = 'include';

const MinMaxSelect = React.memo(MinMaxSelectInner);

const defaultStatRanges: Readonly<StatRanges> = {
  [StatHashes.Mobility]: { min: 0, max: 100 },
  [StatHashes.Resilience]: { min: 0, max: 100 },
  [StatHashes.Recovery]: { min: 0, max: 100 },
  [StatHashes.Discipline]: { min: 0, max: 100 },
  [StatHashes.Intellect]: { min: 0, max: 100 },
  [StatHashes.Strength]: { min: 0, max: 100 },
};

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus reordering the stat priority.
 */
export default function TierSelect({
  stats,
  statRanges = defaultStatRanges,
  statRangesFiltered = defaultStatRanges,
  order,
  onStatOrderChanged,
  onStatFiltersChanged,
}: {
  stats: StatFilters;
  /** The ranges the stats could have gotten to, EXCLUDING all filters */
  statRanges?: Readonly<StatRanges>;
  /** The ranges the stats could have gotten to INCLUDING stat filters and mod compatibility */
  statRangesFiltered?: Readonly<StatRanges>;
  order: number[]; // stat hashes in user order
  onStatOrderChanged(order: ArmorStatHashes[]): void;
  onStatFiltersChanged(stats: StatFilters): void;
}) {
  const defs = useD2Definitions()!;
  const handleTierChange = (
    statHash: number,
    changed: { min?: number; max?: number; ignored: boolean }
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
            {order.map((statHash: number, index) => (
              <DraggableItem
                key={statHash}
                id={statHash.toString()}
                index={index}
                className={styles.row}
                name={
                  <span className={clsx({ [styles.ignored]: stats[statHash].ignored })}>
                    <BungieImage
                      className={styles.iconStat}
                      src={statDefs[statHash].displayProperties.icon}
                    />
                    {statDefs[statHash].displayProperties.name}
                  </span>
                }
              >
                <span className={styles.range}>
                  Max{' '}
                  {t('LoadoutBuilder.TierNumber', {
                    tier: statTierWithHalf(statRangesFiltered[statHash].max),
                  })}
                </span>
                <MinMaxSelect
                  statHash={statHash}
                  stat={stats[statHash]}
                  statRange={statRanges[statHash]}
                  type="Min"
                  handleTierChange={handleTierChange}
                />
                <MinMaxSelect
                  statHash={statHash}
                  stat={stats[statHash]}
                  statRange={statRanges[statHash]}
                  type="Max"
                  handleTierChange={handleTierChange}
                />
              </DraggableItem>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
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
  statRange,
  handleTierChange,
}: {
  statHash: number;
  type: 'Min' | 'Max';
  /** Filter config for a single stat */
  stat: MinMaxIgnored;
  /** The range this stat could have gotten to, EXCLUDING all filters */
  statRange: MinMax;
  handleTierChange(
    statHash: number,
    changed: {
      min: number;
      max: number;
      ignored: boolean;
    }
  ): void;
}) {
  const min = statTier(statRange.min);
  const max = statTier(statRange.max);
  const ignored = stat.ignored;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    let update: {
      min: number;
      max: number;
      ignored: boolean;
    };
    if (e.target.value === IGNORE || e.target.value === INCLUDE) {
      update = {
        min: stat.min,
        max: stat.max,
        ignored: e.target.value === IGNORE,
      };
    } else {
      const value = parseInt(e.target.value, 10);
      const lower = type.toLowerCase();
      const opposite = lower === 'min' ? 'max' : 'min';
      update = {
        [lower]: value,
        [opposite]: opposite === 'min' ? Math.min(stat.min, value) : Math.max(stat.max, value),
        ignored: false,
      } as typeof update;
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
      <option disabled={true}>
        {t(`LoadoutBuilder.Select${type}`, { contextList: 'minMax' })}
      </option>
      {_.range(min, max + 1).map((tier) => (
        <option
          key={tier}
          value={tier}
          className={clsx({
            [styles.hiddenOption]: ignored,
          })}
        >
          {t('LoadoutBuilder.TierNumber', {
            tier,
          })}
        </option>
      ))}
      <option key="-" value="-" className={styles.hiddenOption}>
        -
      </option>
      <option
        key={IGNORE}
        value={IGNORE}
        className={clsx({
          [styles.hiddenOption]: ignored,
        })}
      >
        {t('LoadoutBuilder.StatTierIgnoreOption')}
      </option>
      <option
        key={INCLUDE}
        value={INCLUDE}
        className={clsx({
          [styles.hiddenOption]: !ignored,
        })}
      >
        {t('LoadoutBuilder.StatTierIncludeOption')}
      </option>
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
