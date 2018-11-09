import * as React from 'react';
import { t } from 'i18next';
import classNames from 'classnames';
import CollapsibleTitle from '../dim-ui/CollapsibleTitle';
import { getDefinitions, D1ManifestDefinitions } from '../destiny1/d1-definitions.service';
import * as _ from 'lodash';
import { count } from '../util';
import { setSetting } from '../settings/actions';
import { D1Store } from '../inventory/store-types';
import { storesSelector } from '../inventory/reducer';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';
import { Loading } from '../dim-ui/Loading';
import { D1StoresService } from '../inventory/d1-stores.service';
import { refresh$ } from '../shell/refresh';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import Objective from '../progress/Objective';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Subscriptions } from '../rx-utils';
import './record-books.scss';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  hideCompletedRecords: boolean;
  stores: D1Store[];
}

const mapDispatchToProps = {
  setSetting
};
type DispatchProps = typeof mapDispatchToProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    hideCompletedRecords: state.settings.hideCompletedRecords,
    stores: storesSelector(state) as D1Store[]
  };
}

type Props = ProvidedProps & StoreProps & DispatchProps;

interface RecordBook {
  hash: string;
  name: string;
  recordCount: number;
  completedCount: number;
  icon: string;
  banner: string;
  startDate: string;
  expirationDate: string;
  pages: RecordBookPage[];
  complete: boolean;
  percentComplete?: number;
}

interface RecordBookPage {
  id: string;
  name: string;
  description: string;
  rewardsPage: boolean;
  records: any[];
  complete: boolean;
  completedCount: number;
}

interface State {
  defs?: D1ManifestDefinitions;
}

class RecordBooks extends React.Component<Props, State> {
  state: State = {};
  private subscriptions = new Subscriptions();

  componentDidMount() {
    getDefinitions().then((defs) => this.setState({ defs }));
    D1StoresService.getStoresStream(this.props.account);
    this.subscriptions.add(
      refresh$.subscribe(() => {
        D1StoresService.reloadStores();
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { stores, hideCompletedRecords } = this.props;
    const { defs } = this.state;

    if (!defs || !stores.length) {
      return (
        <div className="dim-page">
          <Loading />
        </div>
      );
    }

    const rawRecordBooks = stores[0].advisors.recordBooks;
    const recordBooks = _.sortBy(
      _.map(rawRecordBooks, (rb) => this.processRecordBook(defs, rb)),
      (rb) => [rb.complete, new Date(rb.startDate).getTime()]
    );

    return (
      <div
        className={classNames('record-books', 'dim-page', {
          'hide-complete': hideCompletedRecords
        })}
      >
        <h1>
          <div className="hide-completed">
            <label>
              <input
                type="checkbox"
                checked={hideCompletedRecords}
                onChange={this.hideCompletedRecordsChanged}
              />
              <span>{t('RecordBooks.HideCompleted')}</span>
            </label>
          </div>
        </h1>

        {recordBooks.map((book) => (
          <CollapsibleTitle
            key={book.hash}
            sectionId={'rb-' + book.hash}
            title={
              <>
                <BungieImage src={book.icon} className="book-icon" /> {book.name}
              </>
            }
            extra={
              <span className="record-book-completion">
                {book.completedCount} / {book.recordCount}
              </span>
            }
          >
            <div className="record-book">
              {book.pages.map(
                (page) =>
                  !page.rewardsPage && (
                    <div
                      key={page.id}
                      className={classNames('record-book-page', { complete: page.complete })}
                    >
                      <CollapsibleTitle
                        sectionId={'rbpage-' + page.id}
                        title={<span className="record-book-page-title">{page.name}</span>}
                        extra={
                          <span className="record-book-completion">
                            {page.completedCount} / {page.records.length}
                          </span>
                        }
                      >
                        <p>{page.description}</p>

                        {page.records.length && (
                          <div className="record-page-records">
                            {page.records.map((record) => (
                              <div
                                key={record.hash}
                                className={classNames('record', { complete: record.complete })}
                              >
                                <div
                                  className="record-icon"
                                  style={bungieBackgroundStyle(record.icon)}
                                />
                                <div className="record-info">
                                  <h3>{record.name}</h3>
                                  <p>{record.description}</p>
                                  {record.objectives.map((objective) => (
                                    <Objective
                                      key={objective.hash}
                                      defs={defs}
                                      objective={objective}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CollapsibleTitle>
                    </div>
                  )
              )}
            </div>
          </CollapsibleTitle>
        ))}
      </div>
    );
  }

  private hideCompletedRecordsChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.setSetting('hideCompletedRecords', e.currentTarget.checked);
  };

  // TODO: Ideally there would be an Advisors service that would
  // lazily load advisor info, and we'd get that info
  // here. Unfortunately we're also using advisor info to populate
  // extra info in Trials cards in Store service, and it's more
  // efficient to just fish the info out of there.

  private processRecordBook = (defs: D1ManifestDefinitions, rawRecordBook): RecordBook => {
    // TODO: rewards are in "spotlights"
    // TODO: rank

    const recordBookDef = defs.RecordBook.get(rawRecordBook.bookHash);
    const recordBook = {
      hash: rawRecordBook.bookHash,
      name: recordBookDef.displayName,
      recordCount: recordBookDef.recordCount,
      completedCount: rawRecordBook.completedCount,
      icon: recordBookDef.icon,
      banner: recordBookDef.bannerImage,
      startDate: rawRecordBook.startDate,
      expirationDate: rawRecordBook.expirationDate,
      pages: [] as RecordBookPage[],
      complete: false,
      percentComplete: undefined as number | undefined
    };

    const records = Object.values(rawRecordBook.records).map((r) => this.processRecord(defs, r));
    const recordByHash = _.keyBy(records, (r) => r.hash);

    let i = 0;
    recordBook.pages = recordBookDef.pages.map((page) => {
      const createdPage: RecordBookPage = {
        id: `${recordBook.hash}-${i++}`,
        name: page.displayName,
        description: page.displayDescription,
        rewardsPage: page.displayStyle === 1,
        records: page.records.map((r) => recordByHash[r.recordHash]),
        // rewards - map to items!
        // ItemFactory.processItems({ id: null }
        // may have to extract store service bits...
        complete: false,
        completedCount: 0
      };

      createdPage.complete = createdPage.records.every((r) => r.complete);
      createdPage.completedCount = count(createdPage.records, (r: any) => r.complete);

      return createdPage;
    });

    if (rawRecordBook.progression) {
      rawRecordBook.progression = {
        ...rawRecordBook.progression,
        ...defs.Progression.get(rawRecordBook.progression.progressionHash)
      };
      rawRecordBook.progress = rawRecordBook.progression;
      rawRecordBook.percentComplete =
        rawRecordBook.progress.currentProgress /
        _.sumBy(rawRecordBook.progress.steps, (s: any) => s.progressTotal);
    } else {
      recordBook.percentComplete = count(records, (r) => r.complete) / records.length;
    }

    recordBook.complete = recordBook.pages.every((p) => p.complete);

    return recordBook;
  };

  private processRecord = (defs: D1ManifestDefinitions, record) => {
    const recordDef = defs.Record.get(record.recordHash);

    return {
      hash: record.recordHash,
      icon: recordDef.icon,
      description: recordDef.description,
      name: recordDef.displayName,
      objectives: record.objectives,
      complete: record.objectives.every((o) => o.isComplete)
    };
  };
}

export default connect<StoreProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(RecordBooks);
