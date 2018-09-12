export class RateLimiterQueue {
  pattern: RegExp;
  requestLimit: number;
  timeLimit: number;
  queue: {
    fetcher: typeof fetch;
    request: Request | string;
    options?: RequestInit;
    resolver();
    rejecter();
  }[] = [];
  /** number of requests in the current period */
  count = 0;
  lastRequestTime = window.performance.now();
  timer?: number;

  constructor(pattern: RegExp, requestLimit: number, timeLimit: number) {
    this.pattern = pattern;
    this.requestLimit = requestLimit;
    this.timeLimit = timeLimit || 1000;
  }

  matches(url: string) {
    return url.match(this.pattern);
  }

  // Add a request to the queue, acting on it immediately if possible
  add<T>(fetcher: typeof fetch, request: Request | string, options?: RequestInit): Promise<T> {
    let resolver;
    let rejecter;
    const promise = new Promise<T>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    this.queue.push({
      fetcher,
      request,
      options,
      resolver,
      rejecter
    });
    this.processQueue();

    return promise;
  }

  // Schedule processing the queue at the next soonest time.
  scheduleProcessing() {
    if (!this.timer) {
      const nextTryIn = Math.max(
        0,
        this.timeLimit - (window.performance.now() - this.lastRequestTime)
      );
      this.timer = window.setTimeout(() => {
        this.timer = undefined;
        this.processQueue();
      }, nextTryIn);
    }
  }

  processQueue() {
    while (this.queue.length) {
      if (this.canProcess()) {
        const config = this.queue.shift()!;
        config.fetcher(config.request, config.options).then(config.resolver, config.rejecter);
      } else {
        this.scheduleProcessing();
        return;
      }
    }
  }

  // Returns whether or not we can process a request right now. Mutates state.
  canProcess() {
    const currentRequestTime = window.performance.now();

    const timeSinceLastRequest = currentRequestTime - this.lastRequestTime;
    if (timeSinceLastRequest >= this.timeLimit) {
      this.lastRequestTime = currentRequestTime;
      this.count = 0;
    }

    if (this.count < this.requestLimit) {
      this.count++;
      return true;
    } else {
      return false;
    }
  }
}

export const RateLimiterConfig = {
  limiters: [] as RateLimiterQueue[],

  addLimiter(queue: RateLimiterQueue) {
    this.limiters.push(queue);
  }
};

/**
 * Produce a version of "fetch" that respects global rate limiting rules.
 */
export function rateLimitedFetch(fetcher: typeof fetch): typeof fetch {
  return (request: Request | string, options?: RequestInit) => {
    const url = typeof request === 'string' ? request : request.url;
    let limiter;
    for (const possibleLimiter of RateLimiterConfig.limiters) {
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
