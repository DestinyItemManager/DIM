(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimInfoService', InfoService);

  InfoService.$inject = ['toaster', '$http'];

  function InfoService(toaster, $http) {
    return {
      show: function(id, content, timeout = 0) {
        content = content || {};
        content.type = content.type || 'info';
        content.title = content.title || '';
        content.body = content.body || '';
        content.hide = content.hide || 'Hide This Popup';

        function showToaster(body, timeout = 0) {
          toaster.pop({
            type: content.type,
            title: content.title,
            body: [
              '<p>' + body + '</p>',
              '<input style="margin-top: 1px; vertical-align: middle;" id="info-' + id + '" type="checkbox">',
              '<label for="info-' + id + '">' + content.hide + '</label></p>'
            ].join(''),
            timeout: timeout,
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
                var save = {};
                save['info.' + id] = 1;
                chrome.storage.sync.set(save, function(e) {});
              }
            }
          });
        }

        chrome.storage.sync.get('info.' + id, function(data) {
          if(_.isNull(data) || _.isEmpty(data)) {
            if(content.view) {
              $http.get(content.view).then(function(changelog) {
                showToaster(changelog.data, timeout);
              });
            } else {
              showToaster(content.body, timeout);
            }
          }
        });
      }
    };
  }
})();
