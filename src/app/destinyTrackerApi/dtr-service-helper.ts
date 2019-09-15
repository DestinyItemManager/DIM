import CircuitBreaker from 'circuit-breaker-js';

/** We give more weight to ratings with reviews than those without. */
export const dtrTextReviewMultiplier = 10;

const TIMEOUT = 3000;

const circuitBreaker = new CircuitBreaker({
  timeoutDuration: TIMEOUT,
  windowDuration: 1 * 60 * 1000, // 1 minute
  volumeThreshold: 2
});

export function dtrFetch(url: string, body: object) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const signal = controller && controller.signal;

  const request = new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  let timer;
  if (controller) {
    timer = setTimeout(() => controller.abort(), TIMEOUT);
  }

  return new Promise((resolve, reject) => {
    circuitBreaker.run(
      (success, failure) => {
        Promise.resolve(fetch(request, { signal }))
          .then((r) => {
            if (controller) {
              clearTimeout(timer);
            }
            return r;
          })
          .then(
            (v) => {
              success();
              resolve(v);
            },
            (e) => {
              failure();
              reject(e);
            }
          );
      },
      () => reject(new Error('Circuit breaker open'))
    );
  });
}
