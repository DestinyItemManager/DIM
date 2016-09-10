(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimInfoService', InfoService);

  InfoService.$inject = ['toaster', '$http', 'SyncService'];

  function InfoService(toaster, $http, SyncService) {
    return {
      show: function(id, content, timeout) {
        timeout = timeout || 0;
        content = content || {};
        content.type = content.type || 'info';
        content.title = content.title || '';
        content.body = content.body || '';
        content.hide = content.hide || 'Hide This Popup';
        content.func = content.func || function() {};

        function showToaster(body, save, timeout) {
          timeout = timeout || 0;
          toaster.pop({
            type: content.type,
            title: content.title,
            body: [
              '<p>' + body + '</p>',
              '<input id="info-' + id + '" type="checkbox">',
              '<label for="info-' + id + '">' + content.hide + '</label></p>'
            ].join(''),
            timeout: timeout,
            bodyOutputType: 'trustedHtml',
            showCloseButton: true,
            onHideCallback: function() {
              if ($('#info-' + id)
                .is(':checked')) {
                save['info.' + id] = 1;
                SyncService.set(save);
              }
            }
          });
        }

        SyncService.get().then(function(data) {
          if (!data || data['info.' + id]) {
            return;
          }
          if (content.view) {
            $http.get(content.view).then(function(changelog) {
              showToaster(changelog.data, data, timeout);
            });
          } else {
            showToaster(content.body, data, timeout);
          }
          content.func();
        });
      },
      // Remove prefs for "don't show this again"
      resetHiddenInfos: function() {
        SyncService.get().then(function(data) {
          SyncService.set(_.omit(data, (v, k) => k.startsWith('info.')), true);
        });
      }
    };
  }
})();

