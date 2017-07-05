import angular from 'angular';
import template from './dimItemDiscuss.directive.html';

angular.module('dimApp')
  .directive('dimItemDiscuss', ItemDiscuss);

function ItemDiscuss() {
  return {
    controller: ItemDiscussCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {},
    template: template
  };
}

function ItemDiscussCtrl($scope, $rootScope, toaster, dimItemDiscussService, dimItemService, dimDestinyTrackerService) {
  const vm = this;
  vm.show = dimItemDiscussService.dialogOpen;
  vm.dtrRatingOptions = [1, 2, 3, 4, 5];

  $scope.$on('dim-store-item-discuss', (event, item) => {
    vm.show = true;

    vm.item = item.item;
  });

  vm.cancel = function cancel() {
    dimItemDiscussService.dialogOpen = false;
    vm.show = false;
  };

  vm.submitReview = function submitReview() {
    const item = vm.item;

    dimDestinyTrackerService.submitReview(item);

    return false;
  };

  vm.toUserReview = function(item) {
    const newRating = item.userRating;
    const review = item.userReview;
    const pros = item.userReviewPros;
    const cons = item.userReviewCons;

    const userReview = {
      rating: newRating,
      review: review,
      pros: pros,
      cons: cons
    };

    return userReview;
  };

  vm.reviewBlur = function() {
    const item = vm.item;
    const userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };
}
