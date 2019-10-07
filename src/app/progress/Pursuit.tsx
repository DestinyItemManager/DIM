import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import ItemExpiration from 'app/item-popup/ItemExpiration';
import PursuitItem from './PursuitItem';
import { percent } from 'app/shell/filters';
import { RootState } from 'app/store/reducers';
import { searchFilterSelector } from 'app/search/search-filters';
import { connect } from 'react-redux';
import clsx from 'clsx';

// Props provided from parents
interface ProvidedProps {
  item: DimItem;
}

// Props from Redux via mapStateToProps
interface StoreProps {
  isNew: boolean;
  searchHidden?: boolean;
}

function mapStateToProps(state: RootState, props: ProvidedProps): StoreProps {
  const { item } = props;

  const settings = state.settings;

  return {
    isNew: settings.showNewItems ? state.inventory.newItems.has(item.id) : false,
    searchHidden: !searchFilterSelector(state)(item)
  };
}

type Props = ProvidedProps & StoreProps;

/**
 * A Pursuit is an inventory item that represents a bounty or quest. This displays
 * a pursuit tile for the Progress page.
 */
function Pursuit({ item, isNew, searchHidden }: Props) {
  const expired = showPursuitAsExpired(item);

  const nonIntegerObjectives = item.objectives
    ? item.objectives.filter((o) => o.displayStyle !== 'integer')
    : [];

  const showObjectiveDetail = nonIntegerObjectives.length === 1 && !nonIntegerObjectives[0].boolean;

  const showObjectiveProgress =
    nonIntegerObjectives.length > 1 ||
    (nonIntegerObjectives.length === 1 && !nonIntegerObjectives[0].boolean);

  return (
    <ItemPopupTrigger item={item}>
      {(ref, onClick) => (
        <div
          className={clsx('milestone-quest', { 'search-hidden': searchHidden })}
          key={item.index}
          onClick={onClick}
        >
          <div className="milestone-icon">
            <PursuitItem item={item} isNew={isNew} ref={ref} />
            {!item.complete && !expired && showObjectiveProgress && (
              <span>
                {item.objectives && showObjectiveDetail ? (
                  <>
                    {nonIntegerObjectives[0].progress.toLocaleString()}
                    <wbr />/<wbr />
                    {nonIntegerObjectives[0].completionValue.toLocaleString()}
                  </>
                ) : (
                  percent(item.percentComplete)
                )}
              </span>
            )}
          </div>
          <div className="milestone-info">
            <span className="milestone-name">
              <ItemExpiration item={item} compact={true} />
              {item.name}
            </span>
            <div className="milestone-description">{item.description}</div>
          </div>
        </div>
      )}
    </ItemPopupTrigger>
  );
}

export default connect<StoreProps>(mapStateToProps)(Pursuit);

/**
 * Should this item be displayed as expired (no longer completable)?
 */
export function showPursuitAsExpired(item: DimItem) {
  // Suppress description when expiration is shown
  const suppressExpiration =
    item.isDestiny2() &&
    item.pursuit &&
    item.pursuit.suppressExpirationWhenObjectivesComplete &&
    item.complete;

  const expired =
    !suppressExpiration && item.isDestiny2() && item.pursuit && item.pursuit.expirationDate
      ? item.pursuit.expirationDate.getTime() < Date.now()
      : false;

  return expired;
}
