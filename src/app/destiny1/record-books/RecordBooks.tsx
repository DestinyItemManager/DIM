import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import Switch from 'app/dim-ui/Switch';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { useD1Definitions } from 'app/manifest/selectors';
import { useSetting } from 'app/settings/hooks';
import { count, sumBy } from 'app/utils/collections';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { usePageTitle } from 'app/utils/hooks';
import clsx from 'clsx';
import { keyBy } from 'es-toolkit';
import { useSelector } from 'react-redux';
import { DestinyAccount } from '../../accounts/destiny-account';
import BungieImage, { bungieBackgroundStyle } from '../../dim-ui/BungieImage';
import CollapsibleTitle from '../../dim-ui/CollapsibleTitle';
import { storesSelector } from '../../inventory/selectors';
import { D1Store } from '../../inventory/store-types';
import Objective from '../../progress/Objective';
import { D1ManifestDefinitions } from '../d1-definitions';
import { D1ObjectiveProgress, D1RecordBook, D1RecordComponent } from '../d1-manifest-types';
import styles from './RecordBooks.m.scss';

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

export default function RecordBooks({ account }: { account: DestinyAccount }) {
  usePageTitle(t('RecordBooks.RecordBooks'));
  const defs = useD1Definitions();
  const stores = useSelector(storesSelector) as D1Store[];
  const [hideCompletedRecords, setHideCompletedRecords] = useSetting('hideCompletedRecords');

  const storesLoaded = useLoadStores(account);
  if (!defs || !storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const processRecordBook = (
    defs: D1ManifestDefinitions,
    rawRecordBook: D1RecordBook,
  ): RecordBook => {
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
    const recordByHash = keyBy(records, (r) => r.hash);

    let i = 0;
    recordBook.pages = recordBookDef.pages.map((page) => {
      const createdPage: RecordBookPage = {
        id: `${recordBook.hash}-${i++}`,
        name: page.displayName,
        description: page.displayDescription,
        rewardsPage: page.displayStyle === 1,
        records: page.records.map((r) => recordByHash[r.recordHash]),
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
        sumBy(rawRecordBook.progress.steps, (s) => s.progressTotal);
    } else {
      recordBook.percentComplete = count(records, (r) => r.complete) / records.length;
    }

    recordBook.complete = recordBook.pages.every((p) => p.complete);

    return recordBook;
  };

  const rawRecordBooks = stores[0].advisors.recordBooks;
  const recordBooks = Object.values(rawRecordBooks ?? {})
    .map((rb) => processRecordBook(defs, rb))
    .sort(
      chainComparator(
        compareBy((rb) => rb.complete),
        compareBy((rb) => new Date(rb.startDate).getTime()),
      ),
    );

  return (
    <div className={styles.recordBooks}>
      <div className={styles.hideCompleted}>
        <label>
          <Switch
            checked={hideCompletedRecords}
            onChange={setHideCompletedRecords}
            name="hideCompleted"
          />
          <span>{t('RecordBooks.HideCompleted')}</span>
        </label>
      </div>

      {recordBooks.map((book) => (
        <CollapsibleTitle
          key={book.hash}
          sectionId={`rb-${book.hash}`}
          title={
            <>
              <BungieImage src={book.icon} className={styles.bookIcon} /> {book.name}
            </>
          }
          extra={
            <>
              {book.completedCount} / {book.recordCount}
            </>
          }
        >
          <div className={styles.recordBook}>
            {book.pages.map(
              (page) =>
                !page.rewardsPage &&
                !(page.complete && hideCompletedRecords) && (
                  <div key={page.id} className={styles.recordBookPage}>
                    <CollapsibleTitle
                      sectionId={`rbpage-${page.id}`}
                      title={page.name}
                      extra={
                        <>
                          {page.completedCount} / {page.records.length}
                        </>
                      }
                    >
                      <p>{page.description}</p>

                      {page.records.length > 0 && (
                        <div className={styles.records}>
                          {page.records.map(
                            (record) =>
                              !(record.complete && hideCompletedRecords) && (
                                <div
                                  key={record.hash}
                                  className={clsx(styles.record, {
                                    [styles.complete]: record.complete,
                                  })}
                                >
                                  <div
                                    className={styles.recordIcon}
                                    style={bungieBackgroundStyle(record.icon)}
                                  />
                                  <div className={styles.recordInfo}>
                                    <h3>{record.name}</h3>
                                    <p>{record.description}</p>
                                    {record.objectives.map((objective) => (
                                      <Objective
                                        key={objective.objectiveHash}
                                        objective={objective}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ),
                          )}
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
