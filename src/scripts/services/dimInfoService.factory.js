import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimInfoService', InfoService);

function InfoService(toaster, $http, $translate, SyncService) {
  return {
    show: function(id, content, timeout) {
      timeout = timeout || 0;
      content = content || {};
      content.type = content.type || 'info';
      content.title = content.title || '';
      content.body = content.body || '';
      content.hide = content.hide || $translate.instant('Help.HidePopup');
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
          clickHandler: function(a, b) {
            if (b) {
              return true;
            }

            return false;
          },
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
        SyncService.remove(_.filter(_.keys(data), (k) => k.startsWith('info.')));
      });
    }
  };
}
