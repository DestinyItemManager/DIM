import {
  CoreSettingsConfiguration,
  getCommonSettings,
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

/**
 * Get Bungie.net settings, which includes constants about Destiny 2.
 */
export async function getBungieNetSettings(): Promise<CoreSettingsConfiguration> {
  const response = await getCommonSettings(unauthenticatedHttpClient);
  return response.Response;
}
