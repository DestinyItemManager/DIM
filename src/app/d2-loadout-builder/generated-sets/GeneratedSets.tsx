import { t } from 'app/i18next-t';
import React from 'react';
import { InventoryBucket } from '../../inventory/inventory-buckets';
import { D2Item } from '../../inventory/item-types';
import { DimStore } from '../../inventory/store-types';
import { ArmorSet, LockedItemType, StatTypes } from '../types';
import { toggleLockedItem } from './utils';
import { WindowScroller, List } from 'react-virtualized';
import GeneratedSet from './GeneratedSet';
import { dimLoadoutService } from 'app/loadout/loadout.service';
import { newLoadout } from 'app/loadout/loadout-utils';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions.service';
import styles from './GeneratedSets.m.scss';
import _ from 'lodash';
import { isPhonePortrait } from 'app/mediaQueries';

interface Props {
  selectedStore: DimStore;
  sets: readonly ArmorSet[];
  lockedMap: Readonly<{ [bucketHash: number]: readonly LockedItemType[] }>;
  statOrder: StatTypes[];
  defs: D2ManifestDefinitions;
  onLockChanged(bucket: InventoryBucket, locked?: LockedItemType[]): void;
}

interface State {
  rowHeight: number;
  rowWidth: number;
}

/**
 * Renders the entire list of generated stat mixes, one per mix.
 */
export default class GeneratedSets extends React.Component<Props, State> {
  state: State = { rowHeight: 0, rowWidth: 0 };
  private windowScroller = React.createRef<WindowScroller>();

  private handleWindowResize = _.throttle(() => this.setState({ rowHeight: 0, rowWidth: 0 }), 300, {
    leading: false,
    trailing: true
  });

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate() {
    this.windowScroller.current && this.windowScroller.current.updatePosition();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  render() {
    const { lockedMap, selectedStore, sets, defs, statOrder } = this.props;
    const { rowHeight, rowWidth } = this.state;

    return (
      <div className={styles.sets}>
        <h2>
          {t('LoadoutBuilder.GeneratedBuilds')}{' '}
          <span className={styles.numSets}>
            ({t('LoadoutBuilder.NumStatMixes', { count: sets.length })})
          </span>
          <button
            className={`dim-button ${styles.newLoadout}`}
            onClick={() =>
              dimLoadoutService.editLoadout(newLoadout('', {}), { showClass: true, isNew: true })
            }
          >
            {t('LoadoutBuilder.NewEmptyLoadout')}
          </button>
        </h2>
        <p>
          {t('LoadoutBuilder.OptimizerExplanation')}{' '}
          {!isPhonePortrait && t('LoadoutBuilder.OptimizerExplanationDesktop')}
        </p>
        {sets.length > 0 && rowHeight === 0 ? (
          <GeneratedSet
            ref={this.setRowHeight}
            style={{}}
            set={sets[0]}
            selectedStore={selectedStore}
            lockedMap={lockedMap}
            toggleLockedItem={this.toggleLockedItem}
            toggleLockedPerk={this.toggleLockedPerk}
            defs={defs}
            statOrder={statOrder}
          />
        ) : (
          <WindowScroller ref={this.windowScroller}>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
              <List
                autoHeight={true}
                height={height}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                overscanRowCount={2}
                rowCount={sets.length}
                rowHeight={rowHeight || 160}
                rowRenderer={({ index, key, style }) => (
                  <GeneratedSet
                    key={key}
                    style={style}
                    set={sets[index]}
                    selectedStore={selectedStore}
                    lockedMap={lockedMap}
                    toggleLockedItem={this.toggleLockedItem}
                    toggleLockedPerk={this.toggleLockedPerk}
                    defs={defs}
                    statOrder={statOrder}
                  />
                )}
                noRowsRenderer={() => <h3>{t('LoadoutBuilder.NoBuildsFound')}</h3>}
                scrollTop={scrollTop}
                width={rowWidth}
              />
            )}
          </WindowScroller>
        )}
      </div>
    );
  }

  private toggleLockedItem = (lockedItem: LockedItemType) => {
    const bucket = (lockedItem.item as D2Item).bucket;
    toggleLockedItem(
      lockedItem,
      bucket,
      this.props.onLockChanged,
      this.props.lockedMap[bucket.hash]
    );
  };

  private toggleLockedPerk = (lockedItem: LockedItemType, bucket: InventoryBucket) => {
    toggleLockedItem(
      lockedItem,
      bucket,
      this.props.onLockChanged,
      this.props.lockedMap[bucket.hash]
    );
  };

  private setRowHeight = (element: HTMLDivElement | null) => {
    if (element && !this.state.rowHeight) {
      this.setState({ rowHeight: element.clientHeight, rowWidth: element.clientWidth });
    }
  };
}
