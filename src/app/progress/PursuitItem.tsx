import React from 'react';
import { DimItem } from 'app/inventory/item-types';
import classNames from 'classnames';
import { percent } from 'app/shell/filters';
import BungieImage from 'app/dim-ui/BungieImage';
import { t } from 'app/i18next-t';
import styles from './PursuitItem.m.scss';
import pursuitComplete from 'images/pursuitComplete.svg';
import pursuitExpired from 'images/pursuitExpired.svg';
import trackedIcon from 'images/trackedIcon.svg';
import { showPursuitAsExpired } from './Pursuit';
import { RootState } from 'app/store/reducers';
import { searchFilterSelector } from 'app/search/search-filters';
import { connect } from 'react-redux';
import { count } from 'app/util';

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

function PursuitItem({ item, isNew, searchHidden }: Props) {
  const isCapped = item.amount === item.maxStackSize && item.uniqueStack;
  const expired = showPursuitAsExpired(item);
  const showProgressBar =
    item.objectives &&
    item.objectives.length > 0 &&
    !item.complete &&
    !expired &&
    // Either there's a counter progress bar, or multiple checkboxes
    (item.objectives.some((o) => o.displayStyle !== 'integer' && !o.boolean) ||
      count(item.objectives, (o) => o.boolean) > 1);
  const itemImageStyles = {
    'search-hidden': searchHidden,
    [styles.tracked]: item.tracked
  };
  return (
    <div id={item.index} className={classNames(styles.pursuit, itemImageStyles)}>
      {showProgressBar && (
        <div className={styles.progress}>
          <div className={styles.progressAmount} style={{ width: percent(item.percentComplete) }} />
        </div>
      )}
      <BungieImage src={item.icon} className={styles.image} />
      {item.maxStackSize > 1 && item.amount > 1 && (
        <div
          className={classNames(styles.amount, {
            [styles.fullstack]: item.maxStackSize > 1 && item.amount === item.maxStackSize
          })}
        >
          {isCapped ? t('Badge.Max') : item.amount.toString()}
        </div>
      )}
      {isNew && <div className={styles.newItem} />}
      {expired && <img className={styles.expired} src={pursuitExpired} />}
      {item.tracked && <img className={styles.trackedIcon} src={trackedIcon} />}
      {item.complete && <img className={styles.complete} src={pursuitComplete} />}
    </div>
  );
}

export default connect<StoreProps>(mapStateToProps)(PursuitItem);
