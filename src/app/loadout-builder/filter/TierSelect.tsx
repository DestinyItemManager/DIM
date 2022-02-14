import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, dragHandleIcon } from 'app/shell/icons';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { ArmorStatHashes, MinMaxIgnored, StatFilters, StatRanges } from '../types';
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
                  <span
                    className={clsx(
                      { [styles.ignored]: stats[statHash].ignored },
                      styles.statDisplayInfo
                    )}
                  >
                    <BungieImage
                      className={styles.iconStat}
                      src={statDefs[statHash].displayProperties.icon}
                    />
                    <span
                      className={styles.statName}
                      title={statDefs[statHash].displayProperties.name}
                    >
                      {statDefs[statHash].displayProperties.name}
                    </span>
                  </span>
                }
              >
                <span className={styles.range}>
                  {statRangesFiltered
                    ? t('LoadoutBuilder.MaxTier', {
                        tier: t('LoadoutBuilder.TierNumber', {
                          tier: statTierWithHalf(statRangesFiltered[statHash].max),
                        }),
                      })
                    : '-'}
                </span>
                <MinMaxSelect
                  statHash={statHash}
                  stat={stats[statHash]}
                  type="Min"
                  handleTierChange={handleTierChange}
                />
                <MinMaxSelect
                  statHash={statHash}
                  stat={stats[statHash]}
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
  handleTierChange,
}: {
  statHash: number;
  type: 'Min' | 'Max';
  /** Filter config for a single stat */
  stat: MinMaxIgnored;
  handleTierChange(
    statHash: number,
    changed: {
      min: number;
      max: number;
      ignored: boolean;
    }
  ): void;
}) {
  const min = 0;
  const max = 10;
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
      <option disabled>{t(`LoadoutBuilder.Select${type}`, { contextList: 'minMax' })}</option>
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
