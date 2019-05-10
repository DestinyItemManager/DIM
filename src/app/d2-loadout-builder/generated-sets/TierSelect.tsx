import { t } from 'app/i18next-t';
import React from 'react';
import { StatTypes, MinMax } from '../types';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import { statHashes } from '../process';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AppIcon } from 'app/shell/icons';
import styles from './TierSelect.m.scss';
import _ from 'lodash';
import { faGripLinesVertical } from '@fortawesome/free-solid-svg-icons';

const MinMaxSelect = React.memo(MinMaxSelectInner);

export default function TierSelect({
  stats,
  statRanges,
  defs,
  rowClassName,
  order,
  onStatOrderChanged,
  onStatFiltersChanged
}: {
  stats: { [statType in StatTypes]: MinMax };
  statRanges: { [statType in StatTypes]: MinMax };
  defs: D2ManifestDefinitions;
  rowClassName: string;
  order: StatTypes[];
  onStatOrderChanged(order: StatTypes[]): void;
  onStatFiltersChanged(stats: { [statType in StatTypes]: MinMax }): void;
}) {
  const handleTierChange = (which: StatTypes, changed: { min?: number; max?: number }) => {
    const newTiers = { ...stats, [which]: { ...stats[which], ...changed } };

    onStatFiltersChanged(newTiers);
  };

  const statDefs = {
    Mobility: defs.Stat.get(statHashes.Mobility),
    Resilience: defs.Stat.get(statHashes.Resilience),
    Recovery: defs.Stat.get(statHashes.Recovery)
  };

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const newOrder = reorder(order, result.source.index, result.destination.index);
    onStatOrderChanged(newOrder);
    // TODO: onOrderChanged!
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
                  <>
                    <span className={styles[`icon${stat}`]} />{' '}
                    {statDefs[stat].displayProperties.name}
                  </>
                }
              >
                <MinMaxSelect
                  stat={stat}
                  stats={stats}
                  type="Min"
                  min={statRanges[stat].min}
                  max={statRanges[stat].max}
                  handleTierChange={handleTierChange}
                />
                <MinMaxSelect
                  stat={stat}
                  stats={stats}
                  type="Max"
                  min={statRanges[stat].min}
                  max={statRanges[stat].max}
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
  children
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
            <AppIcon icon={faGripLinesVertical} className="reorder-handle" />
          </span>
          <label className="name" {...provided.dragHandleProps}>
            {name}
          </label>
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
  stats,
  handleTierChange
}: {
  stat: string;
  type: string;
  min: number;
  max: number;
  stats: { [statType in StatTypes]: MinMax };
  handleTierChange(which: string, changed: any): void;
}) {
  function handleChange(e) {
    const lower = type.toLowerCase();
    const update = { [lower]: parseInt(e.target.value, 10) };
    handleTierChange(stat, update);
  }

  const value = type === 'Min' ? Math.max(min, stats[stat].min) : Math.min(max, stats[stat].max);

  return (
    <select value={value} onChange={handleChange}>
      <option disabled={true}>{t(`LoadoutBuilder.Select${type}`)}</option>
      {/*
        t('LoadoutBuilder.SelectMin')
        t('LoadoutBuilder.SelectMax')
       */}
      {_.range(min, max + 1).map((tier) => (
        <option key={tier}>{tier}</option>
      ))}
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
