import { VendorDrop, VendorEngramVendor, VendorDropType, ManifestVendor } from "./vendorDrops";
import { loadingTracker } from "../ngimport-more";
import { t } from 'i18next';

export class VendorEngramsXyzService {
  vendorMap: { [k: number]: VendorEngramVendor[] };
  cachedResponse: VendorDrop[] | null;
  lastUpdated: Date | null;

  constructor() {
    this.vendorMap = {};
    this.vendorMap[ManifestVendor.AnaBray] = [VendorEngramVendor.AnaBray,
      VendorEngramVendor.BraytechRWPMk_II,
      VendorEngramVendor.IKELOS_HC_V1_0_1];
    this.vendorMap[ManifestVendor.ArachJalaal] = [VendorEngramVendor.ArachJalaal];
    this.vendorMap[ManifestVendor.AsherMir] = [VendorEngramVendor.AsherMir,
      VendorEngramVendor.ManOWar];
    this.vendorMap[ManifestVendor.Banshee44] = [VendorEngramVendor.Banshee44];
    this.vendorMap[ManifestVendor.Benedict9940] = [VendorEngramVendor.Benedict9940];
    this.vendorMap[ManifestVendor.CommanderZavala] = [VendorEngramVendor.CommanderZavala];
    this.vendorMap[ManifestVendor.DevrimKay] = [VendorEngramVendor.DevrimKay,
      VendorEngramVendor.MidaMiniTool];
    this.vendorMap[ManifestVendor.TyraKarn] = [VendorEngramVendor.Drang];
    this.vendorMap[ManifestVendor.ExecutorHideo] = [VendorEngramVendor.ExecutorHideo];
    this.vendorMap[ManifestVendor.Failsafe] = [VendorEngramVendor.Failsafe];
    this.vendorMap[ManifestVendor.IkoraRey] = [VendorEngramVendor.IkoraRey];
    this.vendorMap[ManifestVendor.Lakshmi2] = [VendorEngramVendor.Lakshmi2];
    this.vendorMap[ManifestVendor.LordSaladin] = [VendorEngramVendor.LordSaladin];
    this.vendorMap[ManifestVendor.LordShaxx] = [VendorEngramVendor.LordShaxx];
    this.vendorMap[ManifestVendor.Sloane] = [VendorEngramVendor.Sloane];
    this.vendorMap[ManifestVendor.TheEmissary_TRIALS0] = [VendorEngramVendor.TheEmissary];
    this.vendorMap[ManifestVendor.TheEmissary_TRIALS1] = [VendorEngramVendor.TheEmissary];
    this.vendorMap[ManifestVendor.TheEmissary_TRIALS2] = [VendorEngramVendor.TheEmissary];
    this.vendorMap[ManifestVendor.TheEmissary_TRIALS3] = [VendorEngramVendor.TheEmissary];
    this.vendorMap[ManifestVendor.TheEmissary_TRIALS4] = [VendorEngramVendor.TheEmissary];
  }

  handleVendorEngramsErrors(response: Response) {
    if (response.status !== 200) {
      throw new Error(t('VendorEngramsXyz.ServiceCallError'));
    }

    return response.json();
  }

  lastUpdatedInPastFifteenMinutes(): boolean {
    if (!this.lastUpdated) {
      return false;
    }

    const now = new Date();
    const lastToNow = Math.abs(now.getTime() - this.lastUpdated.getTime());

    const difference = Math.floor((lastToNow / 1000) / 60);

    return (difference > 15);
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

  async fetchVendorDrops(): Promise<this> {
    if (this.cachedResponse && this.lastUpdatedInPastFifteenMinutes()) {
      return this;
    }

    const promise = this.vendorEngramsFetch('https://api.vendorengrams.xyz/getVendorDrops')
      .then(this.handleVendorEngramsErrors, this.handleVendorEngramsErrors);

    loadingTracker.addPromise(promise);

    this.cachedResponse = await promise;
    this.lastUpdated = new Date();

    return this;
  }

  async getAllVendorDrops(): Promise<VendorDrop[] | null> {
    await this.fetchVendorDrops();

    return this.cachedResponse;
  }

  async getVendorDrops(vendorHash: number): Promise<VendorDrop[] | undefined> {
    if (!this.cachedResponse) {
      await this.fetchVendorDrops();
    }

    if (!this.cachedResponse) {
      return undefined;
    }

    const matchedValues = this.vendorMap[vendorHash];

    if (!matchedValues) {
      return undefined;
    }

    return this
      .cachedResponse
      .filter((vd) => matchedValues.some((vev) => vev === vd.vendor));
  }
}

export function powerLevelMatters(powerLevel?: number): boolean {
  return (powerLevel && powerLevel >= 380) || false;
}

export function isVerified380(vendorDrop: VendorDrop): boolean {
  return vendorDrop.type === VendorDropType.Likely380 &&
    vendorDrop.verified;
}

export const dimVendorEngramsService = new VendorEngramsXyzService();
