(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimInfoService', InfoService);

  InfoService.$inject = ['toaster', '$http', 'SyncService'];

  function InfoService(toaster, $http, SyncService) {
    return {
      show: function(id, content) {
        content = content || {};
        content.title = content.title || '';
        content.body = content.body || '';
        content.hide = content.hide || 'Hide This Popup';

        function showToaster(body, save) {
          toaster.pop({
            type: 'info',
            title: content.title,
            body: [
              body,
              '<input style="margin-top: 1px; vertical-align: middle;" id="info-' + id + '" type="checkbox">',
              '<label for="info-' + id + '">' + content.hide + '</label></p>'
            ].join(''),
            timeout: 0,
            bodyOutputType: 'trustedHtml',
            showCloseButton: true,
            clickHandler: function(a, b, c, d, e, f, g) {
              if(b) {
                return true;
              }
              return false;
            },
            onHideCallback: function() {
              if($('#info-' + id)
                .is(':checked')) {
                save['info.' + id] = 1;
                SyncService.set(save);
              }
            }
          });
        }

        SyncService.get().then(function(data) {
          if(!data || data['info.' + id]) {
            return;
          }
          if(content.view) {
            $http.get(content.view).then(function(changelog) {
              showToaster(changelog.data, data);
            });
          } else {
            showToaster(content.body, data);
          }
        });
      }
    };
  }
})();

