/** We give more weight to ratings with reviews than those without. */
export const dtrTextReviewMultiplier = 10;

export function dtrFetch(url: string, body: object) {
  const request = new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return Promise.resolve(fetch(request));
}
