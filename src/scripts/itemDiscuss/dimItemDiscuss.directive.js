import angular from 'angular';
import template from './dimItemDiscuss.directive.template.html';

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
  var vm = this;
  vm.show = dimItemDiscussService.dialogOpen;
  vm.dtrRatingOptions = [1, 2, 3, 4, 5];

  $scope.$on('dim-store-item-discuss', function(event, item) {
    vm.show = true;

    vm.item = item.item;
  });

  vm.cancel = function cancel() {
    dimItemDiscussService.dialogOpen = false;
    vm.show = false;
  };

  vm.submitReview = function submitReview() {
    var item = vm.item;
    var userReview = vm.toUserReview(item);

    $rootScope.$broadcast('review-submitted', item, userReview);

    return false;
  };

  vm.toUserReview = function(item) {
    var newRating = item.userRating;
    var review = item.userReview;
    var pros = item.userReviewPros;
    var cons = item.userReviewCons;

    var userReview = {
      rating: newRating,
      review: review,
      pros: pros,
      cons: cons
    };

    return userReview;
  };

  vm.reviewBlur = function() {
    var item = vm.item;
    var userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };
}
