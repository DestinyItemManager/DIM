(function() {
  angular.module('dimApp')
    .value('dimUserSystemIds', {
      xbl: {
        id: null,
        type: -1
      },
      psn: {
        id: null,
        type: -1
      }
    })
    .value('dimActiveId', null)
    .run(appRun);

  appRun.$inject = ['dimBungieService'];

  function appRun(dimBungieService) {
    var a = dimBungieService.getUser();
  }
})();
