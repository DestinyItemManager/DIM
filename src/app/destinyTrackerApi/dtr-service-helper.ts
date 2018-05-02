export function dtrFetch(url: string, body: object) {
  const request = new Request(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      },
    });

  return Promise.resolve(fetch(request));
}
