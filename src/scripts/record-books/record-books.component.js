import _ from 'underscore';
import angular from 'angular';
import { sum, count } from '../util';

import templateUrl from './record-books.html';
import './record-books.scss';

function RecordBooksController($scope, dimStoreService, dimDefinitions, dimSettingsService) {
  const vm = this;

  vm.settings = dimSettingsService;

  // TODO: Ideally there would be an Advisors service that would
  // lazily load advisor info, and we'd get that info
  // here. Unfortunately we're also using advisor info to populate
  // extra info in Trials cards in Store service, and it's more
  // efficient to just fish the info out of there.

  // TODO: it'll be nice to replace this pattern with RxJS observables
  function init(stores = dimStoreService.getStores()) {
    if (_.isEmpty(stores)) {
      return;
    }

    dimDefinitions.getDefinitions().then((defs) => {
      const rawRecordBooks = stores[0].advisors.recordBooks;
      vm.recordBooks = _.map(rawRecordBooks, (rb) => processRecordBook(defs, rb));
      // TODO: sort down by start date, put finished below
    });
  }

  init();

  $scope.$on('dim-stores-updated', (e, args) => {
    init(args.stores);
  });

  function processRecordBook(defs, rawRecordBook) {
    // TODO: rewards are in "spotlights"
    // "recordBookDef.bannerImage" is a huge background image

    // TODO: rank

    const recordBookDef = defs.RecordBook.get(rawRecordBook.bookHash);

    const recordBook = {
      name: recordBookDef.displayName,
      recordCount: recordBookDef.recordCount,
      completedCount: rawRecordBook.completedCount,
      icon: recordBookDef.icon,
      startDate: rawRecordBook.startDate,
      expirationDate: rawRecordBook.expirationDate
    };

    recordBook.objectives = (rawRecordBook.records || []).map((r) => processRecord(defs, recordBook, r));

    const recordByHash = _.indexBy(recordBook.objectives, 'hash');

    recordBook.pages = recordBookDef.pages.map((page) => {
      return {
        name: page.displayName,
        description: page.displayDescription,
        rewardsPage: page.displayStyle === 1,
        records: page.records.map((r) => recordByHash[r.recordHash])
        // rewards - map to items!
        // may have to extract store service bits...
      };
    });

    // TODO: organize the records into pages

    // TODO: show rewards?

    if (recordBook.progression) {
      recordBook.progression = angular.extend(recordBook.progression, defs.Progression.get(recordBook.progression.progressionHash));
      recordBook.progress = recordBook.progression;
      recordBook.percentComplete = recordBook.progress.currentProgress / sum(recordBook.progress.steps, 'progressTotal');
    } else {
      recordBook.percentComplete = count(recordBook.objectives, 'complete') / recordBook.objectives.length;
    }

    recordBook.complete = _.chain(recordBook.records)
      .pluck('objectives')
      .flatten()
      .all('isComplete')
      .value();

    console.log(recordBookDef, rawRecordBook, recordBook);
    return recordBook;
  }

  function processRecord(defs, recordBook, record) {
    // TODO: Really need Record objects, which can then have multiple objectives
    const objectiveDef = defs.Objective.get(record.objectives[0].objectiveHash);

    let display = undefined;
    if (record.recordValueUIStyle === '_investment_record_value_ui_style_time_in_milliseconds') {
      display = record.objectives[0].displayValue;
    }

    return {
      hash: record.recordHash,
      icon: record.icon,
      description: record.description,
      displayName: record.displayName,
      progress: record.objectives[0].progress,
      display: display,
      completionValue: objectiveDef.completionValue,
      complete: record.objectives[0].isComplete,
      boolean: objectiveDef.completionValue === 1
    };
  }
}

export const RecordBooksComponent = {
  controller: RecordBooksController,
  templateUrl: templateUrl
};
