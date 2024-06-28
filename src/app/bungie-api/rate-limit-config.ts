import { addLimiter, RateLimiterQueue } from './rate-limiter';

export default function setupRateLimiter() {
  addLimiter(new RateLimiterQueue(/www\.bungie\.net\/D1\/Platform\/Destiny\/TransferItem/, 1000));
  addLimiter(new RateLimiterQueue(/www\.bungie\.net\/D1\/Platform\/Destiny\/EquipItem/, 1000));

  // Destiny 2 has a faster rate limit!
  addLimiter(
    new RateLimiterQueue(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/TransferItem/, 100),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/PullFromPostmaster/,
      100,
    ),
  );
  addLimiter(
    new RateLimiterQueue(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/EquipItem/, 100),
  );
  addLimiter(
    new RateLimiterQueue(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/EquipItems/, 100),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/InsertSocketPlugFree/,
      500,
    ),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/InsertSocketPlug/,
      500,
    ),
  );
  addLimiter(
    new RateLimiterQueue(/www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/SetLockState/, 100),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/SetTrackedState/,
      1000,
    ),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/EquipLoadout/,
      1000,
    ),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/SnapshotLoadout/,
      1000,
    ),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/UpdateLoadoutIdentifiers/,
      1000,
    ),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/Actions\/Items\/ClearLoadout/,
      1000,
    ),
  );
  addLimiter(
    new RateLimiterQueue(
      /www\.bungie\.net\/Platform\/Destiny2\/\d+\/Profile\/\d+\/Character\/\d+\/Vendors\/\d+\//,
      100,
    ),
  );
}
