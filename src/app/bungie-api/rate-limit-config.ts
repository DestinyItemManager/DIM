import { RateLimiterConfig, RateLimiterQueue } from './rate-limiter';

export default function setupRateLimiter() {
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

  // Destiny 2 has a faster rate limit!
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
}
