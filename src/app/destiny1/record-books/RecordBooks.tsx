import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { useD1Definitions } from 'app/manifest/selectors';
import { useSetting } from 'app/settings/hooks';
import { count } from 'app/utils/collections';
import { usePageTitle } from 'app/utils/hooks';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { DestinyAccount } from '../../accounts/destiny-account';
import BungieImage, { bungieBackgroundStyle } from '../../dim-ui/BungieImage';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { storesSelector } from '../../inventory/selectors';
import { D1Store } from '../../inventory/store-types';
import Objective from '../../progress/Objective';
import { D1ManifestDefinitions } from '../d1-definitions';
import { D1ObjectiveProgress, D1RecordBook, D1RecordComponent } from '../d1-manifest-types';
import './record-books.scss';

interface Props {
  account: DestinyAccount;
}

interface RecordBook {
  hash: number;
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
  records: {
    hash: number;
    complete: boolean;
    icon: string;
    name: string;
    description: string;
    objectives: D1ObjectiveProgress[];
  }[];
  complete: boolean;
  completedCount: number;
}

export default function RecordBooks({ account }: Props) {
  usePageTitle(t('RecordBooks.RecordBooks'));
  const defs = useD1Definitions();
  const stores = useSelector(storesSelector) as D1Store[];
  const [hideCompletedRecords, setHideCompletedRecords] = useSetting('hideCompletedRecords');

  const storesLoaded = useLoadStores(account);
  if (!defs || !storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }
  const hideCompletedRecordsChanged = (e: React.ChangeEvent<HTMLInputElement>) =>
    setHideCompletedRecords(e.currentTarget.checked);

  // TODO: Ideally there would be an Advisors service that would
  // lazily load advisor info, and we'd get that info
  // here. Unfortunately we're also using advisor info to populate
  // extra info in Trials cards in Store service, and it's more
  // efficient to just fish the info out of there.

  const processRecordBook = (
    defs: D1ManifestDefinitions,
    rawRecordBook: D1RecordBook,
  ): RecordBook => {
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
      percentComplete: undefined as number | undefined,
    };

    const processRecord = (defs: D1ManifestDefinitions, record: D1RecordComponent) => {
      const recordDef = defs.Record.get(record.recordHash);
      return {
        hash: record.recordHash,
        icon: recordDef.icon,
        description: recordDef.description,
        name: recordDef.displayName,
        objectives: record.objectives,
        complete: record.objectives.every((o) => o.isComplete),
      };
    };

    const records = Object.values(rawRecordBook.records).map((r) => processRecord(defs, r));
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
        completedCount: 0,
      };

      createdPage.complete = createdPage.records.every((r) => r.complete);
      createdPage.completedCount = count(createdPage.records, (r) => r.complete);

      return createdPage;
    });

    if (rawRecordBook.progression) {
      rawRecordBook.progression = {
        ...rawRecordBook.progression,
        ...defs.Progression.get(rawRecordBook.progression.progressionHash),
      };
      rawRecordBook.progress = rawRecordBook.progression;
      rawRecordBook.percentComplete =
        rawRecordBook.progress.currentProgress /
        _.sumBy(rawRecordBook.progress.steps, (s) => s.progressTotal);
    } else {
      recordBook.percentComplete = count(records, (r) => r.complete) / records.length;
    }

    recordBook.complete = recordBook.pages.every((p) => p.complete);

    return recordBook;
  };

  const rawRecordBooks = stores[0].advisors.recordBooks;
  const recordBooks = _.sortBy(
    Object.values(rawRecordBooks ?? {}).map((rb) => processRecordBook(defs, rb)),
    (rb) => [rb.complete, new Date(rb.startDate).getTime()],
  );

  return (
    <div
      className={clsx('record-books', 'dim-page', {
        'hide-complete': hideCompletedRecords,
      })}
    >
      <h1>
        <div className="hide-completed">
          <label>
            <input
              type="checkbox"
              checked={hideCompletedRecords}
              onChange={hideCompletedRecordsChanged}
            />
            <span>{t('RecordBooks.HideCompleted')}</span>
          </label>
        </div>
      </h1>

      {recordBooks.map((book) => (
        <CollapsibleTitle
          key={book.hash}
          sectionId={`rb-${book.hash}`}
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
                    className={clsx('record-book-page', { complete: page.complete })}
                  >
                    <CollapsibleTitle
                      sectionId={`rbpage-${page.id}`}
                      title={<span className="record-book-page-title">{page.name}</span>}
                      extra={
                        <span className="record-book-completion">
                          {page.completedCount} / {page.records.length}
                        </span>
                      }
                    >
                      <p>{page.description}</p>

                      {page.records.length > 0 && (
                        <div className="record-page-records">
                          {page.records.map((record) => (
                            <div
                              key={record.hash}
                              className={clsx('record', { complete: record.complete })}
                            >
                              <div
                                className="record-icon"
                                style={bungieBackgroundStyle(record.icon)}
                              />
                              <div className="record-info">
                                <h3>{record.name}</h3>
                                <p>{record.description}</p>
                                {record.objectives.map((objective) => (
                                  <Objective key={objective.objectiveHash} objective={objective} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleTitle>
                  </div>
                ),
            )}
          </div>
        </CollapsibleTitle>
      ))}
    </div>
  );
}
