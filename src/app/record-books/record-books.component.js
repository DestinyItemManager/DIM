import _ from 'underscore';
import angular from 'angular';
import { sum, count } from '../util';
import { subscribeOnScope } from '../rx-utils';
import { settings } from '../settings/settings';

import template from './record-books.html';
import './record-books.scss';

export const RecordBooksComponent = {
  controller: RecordBooksController,
  template,
  bindings: {
    account: '<'
  }
};

function RecordBooksController($scope, dimStoreService, dimDefinitions, $filter) {
  'ngInject';

  const vm = this;

  vm.settings = settings;

  // TODO: it's time for a directive
  vm.toggleSection = function(id) {
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  vm.settingsChanged = function() {
    vm.settings.save();
  };

  this.$onInit = function() {
    subscribeOnScope($scope, dimStoreService.getStoresStream(vm.account), init);
  };

  $scope.$on('dim-refresh', () => {
    // TODO: refresh just advisors
    dimStoreService.reloadStores();
  });

  // TODO: Ideally there would be an Advisors service that would
  // lazily load advisor info, and we'd get that info
  // here. Unfortunately we're also using advisor info to populate
  // extra info in Trials cards in Store service, and it's more
  // efficient to just fish the info out of there.

  function init(stores) {
    if (_.isEmpty(stores)) {
      return;
    }

    dimDefinitions.getDefinitions().then((defs) => {
      const rawRecordBooks = stores[0].advisors.recordBooks;
      vm.recordBooks = _.map(rawRecordBooks, (rb) => processRecordBook(defs, rb));
    });
  }

  function processRecordBook(defs, rawRecordBook) {
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
      expirationDate: rawRecordBook.expirationDate
    };

    const records = _.values(rawRecordBook.records).map((r) => processRecord(defs, r));
    const recordByHash = _.indexBy(records, 'hash');

    let i = 0;
    recordBook.pages = recordBookDef.pages.map((page) => {
      const createdPage = {
        id: `${recordBook.hash}-${i++}`,
        name: page.displayName,
        description: page.displayDescription,
        rewardsPage: page.displayStyle === 1,
        records: page.records.map((r) => recordByHash[r.recordHash])
        // rewards - map to items!
        // ItemFactory.processItems({ id: null }
        // may have to extract store service bits...
      };

      createdPage.complete = _.all(createdPage.records, 'complete');
      createdPage.completedCount = count(createdPage.records, 'complete');

      return createdPage;
    });

    // TODO: show rewards

    if (rawRecordBook.progression) {
      rawRecordBook.progression = angular.extend(rawRecordBook.progression, defs.Progression.get(rawRecordBook.progression.progressionHash));
      rawRecordBook.progress = rawRecordBook.progression;
      rawRecordBook.percentComplete = rawRecordBook.progress.currentProgress / sum(rawRecordBook.progress.steps, 'progressTotal');
    } else {
      // TODO: not accurate for multi-objectives
      recordBook.percentComplete = count(records, 'complete') / records.length;
    }

    recordBook.complete = _.all(recordBook.pages, 'complete');

    return recordBook;
  }

  function processRecord(defs, record) {
    const recordDef = defs.Record.get(record.recordHash);

    const objectives = record.objectives.map((objective) => {
      const objectiveDef = defs.Objective.get(objective.objectiveHash);

      let progress = objective.progress;
      let display = `${objective.progress}/${objectiveDef.completionValue}`;
      if (recordDef.recordValueUIStyle === '_investment_record_value_ui_style_time_in_milliseconds') {
        display = objective.isComplete
          ? objective.displayValue
          : $filter('duration')(objectiveDef.completionValue, 'mm:ss.sss');
        if (objectiveDef.isCountingDownward) {
          // Otherwise the bar will always look full
          progress = 0;
        }
      }

      return {
        progress: progress,
        display: display,
        completionValue: objectiveDef.completionValue,
        complete: objective.isComplete,
        boolean: objectiveDef.completionValue === 1
      };
    });

    return {
      hash: record.recordHash,
      icon: recordDef.icon,
      description: recordDef.description,
      name: recordDef.displayName,
      objectives: objectives,
      complete: _.all(objectives, 'complete')
    };
  }
}
