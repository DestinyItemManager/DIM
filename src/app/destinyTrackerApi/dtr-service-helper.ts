import CircuitBreaker from 'circuit-breaker-js';

/** We give more weight to ratings with reviews than those without. */
export const dtrTextReviewMultiplier = 10;

export const dtrD2ReviewsEndpoint = 'https://api.tracker.gg/api/v1/destiny-2/db/reviews';

const TIMEOUT = 3000;
const HTTP_503_TIMEOUT = 10 * 60 * 1000;

const circuitBreaker = new CircuitBreaker({
  timeoutDuration: TIMEOUT,
  windowDuration: 1 * 60 * 1000, // 1 minute
  volumeThreshold: 2
});

let lastFiveOhThreeCaught: Date | null;

function fiveOhThreeCaughtRecently(): boolean {
  if (!lastFiveOhThreeCaught) {
    return false;
  }

  return Date.now() - lastFiveOhThreeCaught.getTime() <= HTTP_503_TIMEOUT;
}

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
    if (fiveOhThreeCaughtRecently()) {
      reject(new Error('Waiting due to HTTP 503'));
    } else {
      circuitBreaker.run(
        (success, failure) => {
          Promise.resolve(fetch(request, { signal }))
            .finally(() => {
              if (controller) {
                clearTimeout(timer);
              }
            })
            .then((r) => {
              if (r.status === 503) {
                lastFiveOhThreeCaught = new Date();
                failure();
                reject(new Error('HTTP 503 returned'));
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
    }
  });
}
