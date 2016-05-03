(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimInfoService', InfoService);

  InfoService.$inject = ['toaster', '$http'];

  function InfoService(toaster, $http) {
    return {
      show: function(id, content) {
        content = content || {};
        content.title = content.title || '';
        content.body = content.body || '';
        content.hide = content.hide || 'Hide This Popup';

        function showToaster(body) {
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
                showToaster(changelog.data);
              });
            } else {
              showToaster(content.body);
            }
          }
        });
      }
    };
  }
})();


        SyncService.get()
          .then(function(data) {
            if (data) {
              var toastViewedFlag = data['220160411v35'] || null;
              if (_.isNull(toastViewedFlag)) {
                $timeout(function() {
                  $http.get('views/changelog-toaster.html?v=v3.5.1')
                    .then(function(changelog) {
                      toaster.pop({
                        type: 'info',
                        title: 'DIM v3.5.1 Released',
                        body: changelog.data,
                        timeout: 0,
                        bodyOutputType: 'trustedHtml',
                        showCloseButton: true,
                        clickHandler: function(a, b, c, d, e, f, g) {
                          if (b) {
                            return true;
                          }

                          return false;
                        },
                        onHideCallback: function() {

                          if ($('#20160411v35')
                            .is(':checked')) {
                            data['220160411v35'] = 1;
                            SyncService.set(data);
                          }
                        }
                      });
                    }, 3000);
                });
              }
            }
          });


