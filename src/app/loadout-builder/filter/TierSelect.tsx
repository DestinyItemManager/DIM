import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import { useD2Definitions } from 'app/manifest/selectors';
import { AppIcon, dragHandleIcon } from 'app/shell/icons';
import clsx from 'clsx';
import _ from 'lodash';
import React, { Dispatch, memo } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorStatHashes, ResolvedStatConstraint, StatRanges } from '../types';
import { statTierWithHalf } from '../utils';
import styles from './TierSelect.m.scss';

const IGNORE = 'ignore';
const INCLUDE = 'include';

const MinMaxSelect = memo(MinMaxSelectInner);

/**
 * A selector that allows for choosing minimum and maximum stat ranges, plus reordering the stat priority.
 */
export default function TierSelect({
  resolvedStatConstraints,
  statRangesFiltered,
  lbDispatch,
}: {
  resolvedStatConstraints: ResolvedStatConstraint[];
  /** The ranges the stats could have gotten to INCLUDING stat filters and mod compatibility */
  statRangesFiltered?: Readonly<StatRanges>;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const defs = useD2Definitions()!;

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
      statHash: resolvedStatConstraints[sourceIndex].statHash,
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
              const statDef = defs.Stat.get(statHash);
              return (
                <DraggableItem
                  key={statHash}
                  id={statHash.toString()}
                  index={index}
                  className={styles.row}
                  name={
                    <span className={clsx({ [styles.ignored]: c.ignored }, styles.statDisplayInfo)}>
                      <BungieImage
                        className={styles.iconStat}
                        src={statDef.displayProperties.icon}
                      />
                      <span className={styles.statName} title={statDef.displayProperties.name}>
                        {statDef.displayProperties.name}
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
                    stat={c}
                    type="min"
                    handleTierChange={handleTierChange}
                  />
                  <MinMaxSelect
                    statHash={statHash}
                    stat={c}
                    type="max"
                    handleTierChange={handleTierChange}
                  />
                </DraggableItem>
              );
            })}

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
  type: 'min' | 'max';
  /** Filter config for a single stat */
  stat: ResolvedStatConstraint;
  handleTierChange: (changed: ResolvedStatConstraint) => void;
}) {
  const min = 0;
  const max = 10;
  const ignored = stat.ignored;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    let update: ResolvedStatConstraint;
    if (e.target.value === IGNORE || e.target.value === INCLUDE) {
      update = {
        ...stat,
        ignored: e.target.value === IGNORE,
      };
    } else {
      const value = parseInt(e.target.value, 10);
      const lower = `${type}Tier` as const;
      const opposite = lower === 'minTier' ? 'maxTier' : 'minTier';
      update = {
        statHash,
        [lower]: value,
        [opposite]:
          opposite === 'minTier' ? Math.min(stat.minTier, value) : Math.max(stat.maxTier, value),
        ignored: false,
      } as unknown as ResolvedStatConstraint;
    }

    handleTierChange(update);
  }

  const value = type === 'min' ? Math.max(min, stat.minTier) : Math.min(max, stat.maxTier);
  return (
    <select
      className={type === 'min' ? styles.minimum : styles.maximum}
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
