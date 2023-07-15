import { StatConstraint } from '@destinyitemmanager/dim-api-types';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, dragHandleIcon } from 'app/shell/icons';
import { DestinyStatDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import _ from 'lodash';
import React, { memo } from 'react';
import { statFiltersFromStatConstraints, statOrderFromStatConstraints } from '../loadout-params';
import { ArmorStatHashes, MinMaxIgnored, StatRanges } from '../types';
import { statTierWithHalf } from '../utils';
import styles from './TierSelect.m.scss';

const IGNORE = 'ignore';
const INCLUDE = 'include';

const MinMaxSelect = memo(MinMaxSelectInner);

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus reordering the stat priority.
 */
export default function TierSelect({
  statConstraints,
  statRangesFiltered,
  onStatConstraintsChanged,
}: {
  statConstraints: StatConstraint[];
  /** The ranges the stats could have gotten to INCLUDING stat filters and mod compatibility */
  statRangesFiltered?: Readonly<StatRanges>;
  onStatConstraintsChanged: (constraints: StatConstraint[]) => void;
}) {
  const defs = useD2Definitions()!;
  const order = statOrderFromStatConstraints(statConstraints);
  const stats = statFiltersFromStatConstraints(statConstraints);
  const handleTierChange = (
    statHash: ArmorStatHashes,
    changed: { min: number; max: number; ignored: boolean }
  ) => {
    // TODO: really annoying that ignored stats are missing from the list
    // TODO: handle the case where a previously ignored stat was un-ignored
    const newStatConstraints = _.compact(
      statConstraints.map((s) => {
        if (s.statHash !== statHash) {
          return s;
        }

        if (changed.ignored) {
          return undefined;
        }

        const newStat = { ...s };
        if (changed.min > 0) {
          newStat.minTier = changed.min;
        } else {
          delete newStat.minTier;
        }
        if (changed.max < 10) {
          newStat.maxTier = changed.max;
        } else {
          delete newStat.maxTier;
        }
        return newStat;
      })
    );
    onStatConstraintsChanged(newStatConstraints);
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
    let newStatConstraints = statConstraints;
    let sourceIndex = result.source.index;
    if (result.source.index >= statConstraints.length) {
      newStatConstraints = [...statConstraints, { statHash: order[sourceIndex] }];
      sourceIndex = newStatConstraints.length - 1;
    }
    const newOrder = reorder(newStatConstraints, sourceIndex, result.destination.index);
    onStatConstraintsChanged(newOrder);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div ref={provided.innerRef}>
            {order.map((statHash: ArmorStatHashes, index) => (
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
  handleTierChange: (
    statHash: number,
    changed: {
      min: number;
      max: number;
      ignored: boolean;
    }
  ) => void;
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
