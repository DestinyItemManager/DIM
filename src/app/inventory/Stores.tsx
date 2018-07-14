import * as React from 'react';
import { DimStore, DimVault } from './store-types';
import StoreBucket from './StoreBucket';
import { sortStores } from '../shell/dimAngularFilters.filter';
import { Settings } from '../settings/settings';
import { InventoryBuckets } from './inventory-buckets';
import classNames from 'classnames';
import { t } from 'i18next';
import './dimStores.scss';
import StoreHeading from './StoreHeading';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { isPhonePortrait } from '../mediaQueries';

interface Props {
  stores: DimStore[];
  isPhonePortrait: boolean;
  settings: Readonly<Settings>;
  buckets: InventoryBuckets;
}

function mapStateToProps(state: RootState): Partial<Props> {
  return {
    stores: state.inventory.stores,
    // TODO: throw this into state
    isPhonePortrait: isPhonePortrait(),
    settings: state.settings.settings as Settings,
    buckets: state.inventory.buckets
  };
}

export class Stores extends React.Component<Props> {
  render() {
    const { stores, isPhonePortrait, settings, buckets } = this.props;

    if (!stores.length) {
      return null;
    }

    const sortedStores = sortStores(stores, settings.characterOrder);
    const vault = stores.find((s) => s.isVault) as DimVault;
    const currentStore = stores.find((s) => s.current)!;

    // TODO: if phone portrait, set things up differently!

    return (
      <div
        className={classNames('inventory-content', {
          'phone-portrait': isPhonePortrait
        })}
      >
        <div className="bucket-padding">
          <div className="store-row store-header">
            {sortedStores.map((store) => (
              <div className="store-cell" key={store.id}>
                <StoreHeading internalLoadoutMenu={true} store={store} />
              </div>
            ))}
          </div>
          {Object.keys(buckets.byCategory).map((category) => (
            <div key={category} className="section">
              <div className="title">
                <span
                  className="collapse-handle"
                  onClick={() => this.toggleSection(category)}
                >
                  <i
                    className={classNames(
                      'fa collapse',
                      settings.collapsedSections[category]
                        ? 'fa-plus-square-o'
                        : 'fa-minus-square-o'
                    )}
                  />{' '}
                  <span>{t(`Bucket.${category}`)}</span>
                </span>
                {stores[0].destinyVersion !== 2 &&
                  buckets[0].vaultBucket && (
                    <span className="bucket-count">
                      {vault.vaultCounts[buckets[0].vaultBucket.id].count}/{
                        buckets[0].vaultBucket.capacity
                      }
                    </span>
                  )}
              </div>
              {!settings.collapsedSections[category] &&
                buckets.byCategory[category].map((bucket) => (
                  <div key={bucket.id} className="store-row items">
                    <i
                      onClick={() => this.toggleSection(bucket.id)}
                      className={classNames(
                        'fa collapse',
                        settings.collapsedSections[bucket.id]
                          ? 'fa-plus-square-o'
                          : 'fa-minus-square-o'
                      )}
                    />
                    {settings.collapsedSections[bucket.id] ? (
                      <div
                        onClick={() => this.toggleSection(bucket.id)}
                        className="store-text collapse"
                      >
                        <span>{t('Bucket.Show', { bucket: bucket.name })}</span>
                      </div>
                    ) : bucket.accountWide ? (
                      <>
                        <div className="store-cell account-wide">
                          <StoreBucket
                            items={currentStore.buckets[bucket.id]}
                            settings={settings}
                          />
                        </div>
                        <div className="store-cell vault">
                          <StoreBucket
                            items={vault.buckets[bucket.id]}
                            settings={settings}
                          />
                        </div>
                      </>
                    ) : (
                      sortedStores.map((store) => (
                        <div
                          key={store.id}
                          className={classNames('store-cell', {
                            vault: store.isVault
                          })}
                        >
                          {(!store.isVault || bucket.vaultBucket) && (
                            <StoreBucket
                              items={store.buckets[bucket.id]}
                              settings={settings}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  toggleSection(id: string) {
    const settings = this.props.settings;
    settings.collapsedSections[id] = !settings.collapsedSections[id];
    settings.save();
  }
}

export default connect(mapStateToProps)(Stores);
