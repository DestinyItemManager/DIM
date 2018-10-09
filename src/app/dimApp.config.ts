import { ICompileProvider } from 'angular';

export default function config(
  $compileProvider: ICompileProvider,
  hotkeysProvider,
  ngDialogProvider
) {
  'ngInject';

  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?:|data:image\/)/);

  hotkeysProvider.includeCheatSheet = true;

  // bugbug: if we get feedback from https://github.com/DestinyItemManager/DIM/issues/2601 then this is the property to set.
  // It defaults to '?' the way that angular-hotkeys ships.
  // hotkeysProvider.cheatSheetHotkey = '?';

  // https://github.com/likeastore/ngDialog/issues/327
  ngDialogProvider.setDefaults({
    appendTo: '.app',
    disableAnimation: true,
    plain: true
  });
}
