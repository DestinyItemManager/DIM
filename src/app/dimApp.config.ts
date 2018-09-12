import { RateLimiterConfig, RateLimiterQueue } from './bungie-api/rate-limiter';
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

  // Bungie's API will start throttling an API if it's called more than once per second. It does this
  // by making responses take 2s to return, not by sending an error code or throttling response. Choosing
  // our throttling limit to be 1 request every 1100ms lets us achieve best throughput while accounting for
  // what I assume is clock skew between Bungie's hosts when they calculate a global rate limit.
  RateLimiterConfig.addLimiter(
    new RateLimiterQueue(/www\.bungie\.net\/D1\/Platform\/Destiny\/TransferItem/, 1, 1100)
  );
  RateLimiterConfig.addLimiter(
    new RateLimiterQueue(/www\.bungie\.net\/D1\/Platform\/Destiny\/EquipItem/, 1, 1100)
  );
  RateLimiterConfig.addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/TransferItem/,
      1,
      100
    )
  );
  RateLimiterConfig.addLimiter(
    new RateLimiterQueue(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/EquipItem/, 1, 100)
  );

  // https://github.com/likeastore/ngDialog/issues/327
  ngDialogProvider.setDefaults({
    appendTo: '.app',
    disableAnimation: true,
    plain: true
  });
}
