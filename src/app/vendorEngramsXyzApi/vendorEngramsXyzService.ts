import { VendorDrop, VendorDropType, vendorHashToVendorEngramVendor } from "./vendorDrops";
import { loadingTracker } from "../ngimport-more";
import { t } from 'i18next';

export class VendorEngramsXyzService {
  refreshInterval: number = 1000 * 60 * 15;
  cachedResponse: VendorDrop[];
  lastUpdated: number = 0;
  refreshPromise?: Promise<VendorDrop[]>;

  handleVendorEngramsErrors(response: Response): Promise<VendorDrop[]> {
    if (response.status !== 200) {
      throw new Error(t('VendorEngramsXyz.ServiceCallError'));
    }

    return response.json() || [];
  }

  cacheExpired(): boolean {
    if (!this.lastUpdated) {
      return true;
    }

    return Date.now() - this.lastUpdated >= this.refreshInterval;
  }

  vendorEngramsFetch(url: string) {
    const request = new Request(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json'
        },
      });

    return Promise.resolve(fetch(request));
  }

  async getAllVendorDrops(): Promise<VendorDrop[]> {
    if (this.cachedResponse && !this.cacheExpired()) {
      return this.cachedResponse;
    }

    this.refreshPromise = this.refreshPromise || this.vendorEngramsFetch('https://api.vendorengrams.xyz/getVendorDrops?source=DIM')
      .then(this.handleVendorEngramsErrors, this.handleVendorEngramsErrors);

    loadingTracker.addPromise(this.refreshPromise);

    this.cachedResponse = await this.refreshPromise;
    this.lastUpdated = Date.now();
    this.refreshPromise = undefined;

    return this.cachedResponse;
  }
}

export function getVendorDropsForVendor(vendorHash: number, vendorDrops?: VendorDrop[]): VendorDrop[] {
  const matchedValues = vendorHashToVendorEngramVendor[vendorHash];

  if (!matchedValues) {
    return [];
  }

  return (vendorDrops && vendorDrops.filter((vd) => vd.enabled === 1 && matchedValues.includes(vd.vendor))) || [];
}

export function powerLevelMatters(powerLevel?: number): boolean {
  return (powerLevel && powerLevel >= 380) || false;
}

export function isVerified380(vendorDrop: VendorDrop): boolean {
  return vendorDrop.type === VendorDropType.Likely380 &&
    vendorDrop.verified === 1;
}

export const dimVendorEngramsService = new VendorEngramsXyzService();
