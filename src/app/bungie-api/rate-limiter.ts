import { noop } from 'lodash';

/**
 * A rate limiter queue applies when the path of a request matches its regex. It will implement the semantics of
 * Bungie.net's rate limiter (expressed in API docs via ThrottleSecondsBetweenActionPerUser), which requires that
 * we wait a specified amount between certain actions.
 */
export class RateLimiterQueue {
  pattern: RegExp;
  /** In milliseconds */
  timeLimit: number;
  queue: {
    fetcher: typeof fetch;
    request: RequestInfo | URL;
    options?: RequestInit;
    resolver: (value?: any) => void;
    rejecter: (value?: any) => void;
  }[] = [];
  /** number of requests in the current period */
  count = 0;
  /** The time the latest request finished */
  lastRequestTime = window.performance.now();
  timer?: number;

  constructor(pattern: RegExp, timeLimit: number) {
    this.pattern = pattern;
    this.timeLimit = timeLimit;
  }

  matches(url: string) {
    return url.match(this.pattern);
  }

  // Add a request to the queue, acting on it immediately if possible
  add<T>(fetcher: typeof fetch, request: RequestInfo | URL, options?: RequestInit): Promise<T> {
    let resolver: (value?: any) => void = noop;
    let rejecter: (value?: any) => void = noop;
    const promise = new Promise<T>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    this.queue.push({
      fetcher,
      request,
      options,
      resolver,
      rejecter,
    });
    this.processQueue();

    return promise;
  }

  // Schedule processing the queue at the next soonest time.
  scheduleProcessing() {
    if (!this.timer) {
      const nextTryIn = Math.max(
        0,
        this.timeLimit - (window.performance.now() - this.lastRequestTime),
      );
      this.timer = window.setTimeout(() => {
        this.timer = undefined;
        this.processQueue();
      }, nextTryIn);
    }
  }

  processQueue() {
    if (this.queue.length) {
      if (this.canProcess()) {
        const config = this.queue.shift()!;
        this.count++;
        this.lastRequestTime = window.performance.now();
        config
          .fetcher(config.request, config.options)
          .finally(() => {
            this.count--;
            this.processQueue();
          })
          .then(config.resolver, config.rejecter);
      } else {
        this.scheduleProcessing();
      }
    }
  }

  // Returns whether or not we can process a request right now. Mutates state.
  canProcess() {
    const currentRequestTime = window.performance.now();
    const timeSinceLastRequest = currentRequestTime - this.lastRequestTime;
    return timeSinceLastRequest >= this.timeLimit && this.count === 0;
  }
}

const limiters: RateLimiterQueue[] = [];

export function addLimiter(queue: RateLimiterQueue) {
  limiters.push(queue);
}

/**
 * Produce a version of "fetch" that respects global rate limiting rules.
 */
export function rateLimitedFetch(fetcher: typeof fetch): typeof fetch {
  return (request: RequestInfo | URL, options?: RequestInit) => {
    const url = request instanceof Request ? request.url : request.toString();
    let limiter;
    for (const possibleLimiter of limiters) {
      if (possibleLimiter.matches(url)) {
        limiter = possibleLimiter;
        break;
      }
    }

    if (limiter) {
      return limiter.add(fetcher, request, options);
    } else {
      return fetcher(request, options);
    }
  };
}
