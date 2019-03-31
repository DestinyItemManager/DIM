/** We give more weight to ratings with reviews than those without. */
export const dtrTextReviewMultiplier = 10;

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
    timer = setTimeout(() => controller.abort(), 5000);
  }

  return Promise.resolve(fetch(request, { signal })).then((r) => {
    if (controller) {
      clearTimeout(timer);
    }
    return r;
  });
}
