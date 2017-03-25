import _ from 'underscore';

import templateUrl from './record-books.html';
import './record-books.scss';

function RecordBooksController($scope, dimStoreService, dimDefinitions) {
  const vm = this;

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

    $scope.$applyAsync(() => {
      vm.recordBooks = stores[0].advisors.recordBooks;
    });
  }

  init();

  $scope.$on('dim-stores-updated', (e, args) => {
    init(args.stores);
  });
}

export const RecordBooksComponent = {
  controller: RecordBooksController,
  templateUrl: templateUrl
};
