window._ = require('underscore');

window.$ = window.jQuery = require('jquery');
require('jquery-textcomplete');
require('jquery-ui/ui/position');

window.humanizeDuration = require('humanize-duration');
require('imports?define=>false,module=>false,self=>window!idb-keyval');
// window.JSZip = require('jszip');
window.LZString = require('lz-string');
window.MessageFormat = require('messageformat');
window.moment = require('moment');
window.SQL = require('sql.js');
require('imports?this=>window!zip-js/WebContent/zip.js');

window.angular = require('exports?window.angular!angular');

require('angular-aria');
require('angular-chrome-storage/angular-chrome-storage');
require('angular-hotkeys');
require('angular-messages');
require('angular-moment');
require('angular-native-dragdrop');
require('angular-promise-tracker');
require('angular-timer');
require('angular-translate');
require('angular-translate-interpolation-messageformat');
require('angular-ui-router');
require('angular-uuid2/dist/angular-uuid2.js');
require('angularjs-slider');
require('angularjs-toaster');
require('ng-dialog');
require('ng-http-rate-limiter');
