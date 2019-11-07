import { t } from 'i18next';
import { VendorDrop, VendorDropType, VendorDropXyz, toVendorDrop } from './vendorDrops';

export class VendorEngramsXyzService {
  refreshInterval: number = 1000 * 60 * 15;
  cachedResponse: VendorDrop[];
  lastUpdated: number = 0;
  refreshPromise?: Promise<VendorDropXyz[]>;

  handleVendorEngramsErrors(response: Response): Promise<VendorDropXyz[]> {
    if (response.status !== 200) {
      throw new Error(t('VendorEngramsXyz.ServiceCallFailed'));
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
      }
    });

    return Promise.resolve(fetch(request));
  }

  async getAllVendorDrops(): Promise<VendorDrop[]> {
    if (this.cachedResponse && !this.cacheExpired()) {
      return this.cachedResponse;
    }

    this.refreshPromise =
      this.refreshPromise ||
      this.vendorEngramsFetch('https://api.vendorengrams.xyz/getVendorDrops?source=DIM').then(
        this.handleVendorEngramsErrors,
        this.handleVendorEngramsErrors
      );

    const xyzResponse = await this.refreshPromise;

    if (xyzResponse) {
      this.cachedResponse = xyzResponse.map(toVendorDrop);
    }

    this.lastUpdated = Date.now();
    this.refreshPromise = undefined;

    return this.cachedResponse;
  }
}

export function getVendorDropsForVendor(
  vendorHash: number,
  vendorDrops?: VendorDrop[]
): VendorDrop[] {
  return (
    (vendorDrops && vendorDrops.filter((vd) => vd.display && vd.vendorId === vendorHash)) || []
  );
}

export function powerLevelMatters(powerLevel?: number): boolean {
  return (powerLevel && powerLevel >= 380) || false;
}

export function isVerified380(vendorDrop: VendorDrop): boolean {
  return vendorDrop.drop === VendorDropType.DroppingHigh && vendorDrop.display;
}

export const dimVendorEngramsService = new VendorEngramsXyzService();
