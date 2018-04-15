import * as _ from 'underscore';
import { extend, IComponentOptions, IController, IScope } from 'angular';
import { sum, count } from '../util';
import { subscribeOnScope } from '../rx-utils';
import { settings } from '../settings/settings';
import { getDefinitions, D1ManifestDefinitions } from '../destiny1/d1-definitions.service';

import template from './record-books.html';
import './record-books.scss';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { StoreServiceType } from '../inventory/d2-stores.service';

export const RecordBooksComponent: IComponentOptions = {
  controller: RecordBooksController,
  template,
  bindings: {
    account: '<'
  }
};

function RecordBooksController(
  this: IController & {
    account: DestinyAccount;
  },
  $scope: IScope,
  dimStoreService: StoreServiceType,
  $filter
) {
  'ngInject';

  const vm = this;

  vm.settings = settings;

  // TODO: it's time for a directive
  vm.toggleSection = (id) => {
    vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
    vm.settings.save();
  };

  vm.settingsChanged = () => {
    vm.settings.save();
  };

  this.$onInit = () => {
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

    getDefinitions().then((defs) => {
      const rawRecordBooks = stores[0].advisors.recordBooks;
      vm.recordBooks = _.map(rawRecordBooks, (rb) => processRecordBook(defs, rb));
    });
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

  function processRecordBook(defs: D1ManifestDefinitions, rawRecordBook) {
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
      percentComplete: undefined as (number | undefined)
    };

    const records = Object.values(rawRecordBook.records).map((r) => processRecord(defs, r));
    const recordByHash = _.indexBy(records, 'hash');

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

    // TODO: show rewards

    if (rawRecordBook.progression) {
      rawRecordBook.progression = extend(rawRecordBook.progression, defs.Progression.get(rawRecordBook.progression.progressionHash));
      rawRecordBook.progress = rawRecordBook.progression;
      rawRecordBook.percentComplete = rawRecordBook.progress.currentProgress / sum(rawRecordBook.progress.steps, (s: any) => s.progressTotal);
    } else {
      // TODO: not accurate for multi-objectives
      recordBook.percentComplete = count(records, (r) => r.complete) / records.length;
    }

    recordBook.complete = recordBook.pages.every((p) => p.complete);

    return recordBook;
  }

  function processRecord(defs: D1ManifestDefinitions, record) {
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
        progress,
        display,
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
      objectives,
      complete: objectives.every((o) => o.complete)
    };
  }
}
