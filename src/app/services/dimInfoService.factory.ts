import { module } from 'angular';
import * as _ from 'underscore';

module('dimApp').factory('dimInfoService', InfoService);

/**
 * A service for showing an information toaster that can be permanently ignored.
 */
function InfoService(toaster, $i18next, SyncService) {
  return {
    show(id, content, timeout) {
      timeout = timeout || 0;
      content = content || {};
      content.type = content.type || 'info';
      content.title = content.title || '';
      content.body = content.body || '';
      content.hide = content.hide || $i18next.t('Help.HidePopup');
      content.func = content.func || (() => { return; });
      content.hideable = content.hideable === undefined ? true : content.hideable;

      function showToaster(body, timeout) {
        timeout = timeout || 0;

        body = `<p>${body}</p>`;

        if (content.hideable) {
          body += `<input id="info-${id}" type="checkbox">
            <label for="info-${id}">${content.hide}</label></p>`;
        }

        toaster.pop({
          type: content.type,
          title: content.title,
          body,
          timeout,
          bodyOutputType: 'trustedHtml',
          showCloseButton: true,
          clickHandler(_, closeButton) {
            // Only close when the close button is clicked
            return Boolean(closeButton);
          },
          onHideCallback() {
            const checkbox = document.getElementById(`info-${id}`) as HTMLInputElement;
            if (checkbox && checkbox.checked) {
              SyncService.set({
                [`info.${id}`]: 1
              });
            }
          }
        });
      }

      if (content.hideable) {
        SyncService.get().then((data) => {
          if (!data || data[`info.${id}`]) {
            return;
          }
          showToaster(content.body, timeout);
          content.func();
        });
      } else {
        showToaster(content.body, timeout);
        content.func();
      }
    },
    // Remove prefs for "don't show this again"
    resetHiddenInfos() {
      SyncService.get().then((data) => {
        SyncService.remove(_.filter(_.keys(data), (k) => k.startsWith('info.')));
      });
    }
  };
}
