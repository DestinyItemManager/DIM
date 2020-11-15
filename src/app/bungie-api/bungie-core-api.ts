import {
  getGlobalAlerts as getGlobalAlertsApi,
  GlobalAlert,
} from 'bungie-api-ts/core';
import { unauthenticatedHttpClient } from './bungie-service-helper';

/**
 * Get global alerts (like maintenance warnings) from Bungie.
 */
export async function getGlobalAlerts(): Promise<GlobalAlert[]> {
  const response = await getGlobalAlertsApi(unauthenticatedHttpClient, {});
  return response.Response;
}
