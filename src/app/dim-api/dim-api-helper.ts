import { HttpClientConfig } from 'bungie-api-ts/http';
import { stringify } from 'simple-query-string';

/**
 * Call one of the unauthenticated DIM APIs.
 */
export async function unauthenticatedApi<T>(config: HttpClientConfig): Promise<T> {
  let url = `https://api.destinyitemmanager.com${config.url}`;
  if (config.params) {
    url = `${url}?${stringify(config.params)}`;
  }
  const response = await fetch(
    new Request(url, {
      method: config.method,
      body: config.body ? JSON.stringify(config.body) : undefined,
      headers: config.body
        ? {
            // TODO: send an API Key
            // 'X-API-Key': DIM_API_KEY,
            'Content-Type': 'application/json'
          }
        : undefined
    })
  );

  return response.json() as Promise<T>;
}
