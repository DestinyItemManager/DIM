import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimInfoService', InfoService);

function InfoService(toaster, $translate, SyncService) {
  return {
    show: function(id, content, timeout) {
      timeout = timeout || 0;
      content = content || {};
      content.type = content.type || 'info';
      content.title = content.title || '';
      content.body = content.body || '';
      content.hide = content.hide || $translate.instant('Help.HidePopup');
      content.func = content.func || function() {};
      content.hideable = content.hideable === undefined ? true : content.hideable;

      function showToaster(body, save, timeout) {
        timeout = timeout || 0;

        body = `<p>${body}</p>`;

        if (content.hideable) {
          body += `<input id="info-${id}" type="checkbox">
            <label for="info-${id}">${content.hide}</label></p>`;
        }

        toaster.pop({
          type: content.type,
          title: content.title,
          body: body,
          timeout: timeout,
          bodyOutputType: 'trustedHtml',
          showCloseButton: true,
          clickHandler: function(_, closeButton) {
            // Only close when the close button is clicked
            return Boolean(closeButton);
          },
          onHideCallback: function() {
            if ($(`#info-${id}`).is(':checked')) {
              save[`info.${id}`] = 1;
              SyncService.set(save);
            }
          }
        });
      }

      if (content.hideable) {
        SyncService.get().then((data) => {
          if (!data || data[`info.${id}`]) {
            return;
          }
          showToaster(content.body, data, timeout);
          content.func();
        });
      } else {
        showToaster(content.body, {}, timeout);
        content.func();
      }
    },
    // Remove prefs for "don't show this again"
    resetHiddenInfos: function() {
      SyncService.get().then((data) => {
        SyncService.remove(_.filter(_.keys(data), (k) => k.startsWith('info.')));
      });
    }
  };
}
