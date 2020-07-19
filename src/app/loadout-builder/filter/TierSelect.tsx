import { t } from 'app/i18next-t';
import React from 'react';
import { StatTypes, MinMax, MinMaxIgnored } from '../types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { statHashes } from '../types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AppIcon, faGripLinesVertical } from 'app/shell/icons';
import styles from './TierSelect.m.scss';
import _ from 'lodash';
import BungieImage from 'app/dim-ui/BungieImage';
import clsx from 'clsx';

const IGNORE = 'ignore';
const INCLUDE = 'include';

const MinMaxSelect = React.memo(MinMaxSelectInner);

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus reordering the stat priority.
 */
export default function TierSelect({
  stats,
  statRanges,
  defs,
  rowClassName,
  order,
  onStatOrderChanged,
  onStatFiltersChanged,
}: {
  stats: { [statType in StatTypes]: MinMaxIgnored };
  statRanges: { [statType in StatTypes]: MinMax };
  defs: D2ManifestDefinitions;
  rowClassName: string;
  order: StatTypes[];
  onStatOrderChanged(order: StatTypes[]): void;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMaxIgnored }): void;
}) {
  const handleTierChange = (
    which: StatTypes,
    changed: { min?: number; max?: number; ignored: boolean }
  ) => {
    const newTiers = { ...stats, [which]: { ...stats[which], ...changed } };

    onStatFiltersChanged(newTiers);
  };

  const statDefs = _.mapValues(statHashes, (statHash) => defs.Stat.get(statHash));

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
            {_.sortBy(Object.keys(stats), (s: StatTypes) => order.indexOf(s)).map((stat, index) => (
              <DraggableItem
                key={stat}
                id={stat}
                index={index}
                className={rowClassName}
                name={
                  <span className={stats[stat].ignored ? styles.ignored : ''}>
                    <BungieImage
                      className={styles.iconStat}
                      src={statDefs[stat].displayProperties.icon}
                    />
                    {statDefs[stat].displayProperties.name}
                  </span>
                }
              >
                <MinMaxSelect
                  stat={stat}
                  stats={stats}
                  type="Min"
                  min={statRanges[stat].min}
                  max={statRanges[stat].max}
                  ignored={stats[stat].ignored}
                  handleTierChange={handleTierChange}
                />
                <MinMaxSelect
                  stat={stat}
                  stats={stats}
                  type="Max"
                  min={statRanges[stat].min}
                  max={statRanges[stat].max}
                  ignored={stats[stat].ignored}
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
          <span className={styles.grip} {...provided.dragHandleProps}>
            <AppIcon icon={faGripLinesVertical} />
          </span>
          <label {...provided.dragHandleProps}>{name}</label>
          {children}
        </div>
      )}
    </Draggable>
  );
}

function MinMaxSelectInner({
  stat,
  type,
  min,
  max,
  ignored,
  stats,
  handleTierChange,
}: {
  stat: string;
  type: 'Min' | 'Max';
  min: number;
  max: number;
  ignored: boolean;
  stats: { [statType in StatTypes]: MinMaxIgnored };
  handleTierChange(which: string, changed: any): void;
}) {
  function handleChange(e) {
    let update;
    if (e.target.value === IGNORE || e.target.value === INCLUDE) {
      update = {
        min: stats[stat].min,
        max: stats[stat].max,
        ignored: e.target.value === IGNORE,
      };
    } else {
      const value = parseInt(e.target.value, 10);
      const lower = type.toLowerCase();
      const opposite = lower === 'min' ? 'max' : 'min';
      update = {
        [lower]: value,
        [opposite]:
          opposite === 'min' ? Math.min(stats[stat].min, value) : Math.max(stats[stat].max, value),
        ignored: false,
      };
    }

    handleTierChange(stat, update);
  }

  const value = type === 'Min' ? Math.max(min, stats[stat].min) : Math.min(max, stats[stat].max);
  return (
    <select value={ignored ? '-' : value} onChange={handleChange}>
      <option disabled={true}>{t(`LoadoutBuilder.Select${type}`)}</option>
      {/*
        t('LoadoutBuilder.SelectMin')
        t('LoadoutBuilder.SelectMax')
       */}
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
