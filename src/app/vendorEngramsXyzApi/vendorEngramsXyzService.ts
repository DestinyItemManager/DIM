import { VendorDrop, VendorEngramVendor } from "./vendorDrops";
import { loadingTracker } from "../ngimport-more";
import { t } from 'i18next';

export class VendorEngramsXyzService {
  vendorMap: {};
  cachedResponse: Promise<VendorDrop[]> | null;
  lastUpdated: Date | null;

  constructor() {
    this.vendorMap = {};
    this.vendorMap[VendorEngramVendor.AnaBray] = 1735426333;
    this.vendorMap[VendorEngramVendor.ArachJalaal] = 3354631265;
    this.vendorMap[VendorEngramVendor.AsherMir] = 3982706173;
    this.vendorMap[VendorEngramVendor.Banshee44] = 672118013;
    this.vendorMap[VendorEngramVendor.Benedict9940] = 1265988377;
    this.vendorMap[VendorEngramVendor.BraytechRWPMk_II] = -1;  // braytech package? Ana Bray?
    this.vendorMap[VendorEngramVendor.CommanderZavala] = 69482069;
    this.vendorMap[VendorEngramVendor.DevrimKay] = 396892126;
    this.vendorMap[VendorEngramVendor.Drang] = -2; // not sure
    this.vendorMap[VendorEngramVendor.ExecutorHideo] = 3819664660;
    this.vendorMap[VendorEngramVendor.Failsafe] = 1576276905;
    this.vendorMap[VendorEngramVendor.IKELOS_HC_V1_0_1] = -3; // uhh
    this.vendorMap[VendorEngramVendor.IkoraRey] = 1976548992;
    this.vendorMap[VendorEngramVendor.Lakshmi2] = 2260557667;
    this.vendorMap[VendorEngramVendor.LordSaladin] = 895295461;
    this.vendorMap[VendorEngramVendor.LordShaxx] = 3603221665;
    this.vendorMap[VendorEngramVendor.ManOWar] = -4; // uhhh
    this.vendorMap[VendorEngramVendor.MidaMiniTool] = -5; // sure
    this.vendorMap[VendorEngramVendor.Sloane] = 1062861569;
    this.vendorMap[VendorEngramVendor.TheEmissary] = 3190557728; // there's 5 emissaries?
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
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

    return Promise.resolve(fetch(request));
  }

  async getVendorDrops(): Promise<VendorDrop[]> {
    if (this.cachedResponse && this.lastUpdatedInPastFifteenMinutes()) {
      return this.cachedResponse;
    }

    const promise = this.vendorEngramsFetch('https://api.vendorengrams.xyz/getVendorDrops')
      .then(this.handleVendorEngramsErrors, this.handleVendorEngramsErrors);

    loadingTracker.addPromise(promise);

    this.cachedResponse = promise;
    this.lastUpdated = new Date();

    return promise;
  }

  async getVendorDrop(vendorHash: number): Promise<VendorDrop | undefined> {
    if (!this.cachedResponse) {
      await this.getVendorDrops();
    }

    if (!this.cachedResponse) {
      return undefined;
    }

    const matchedValue = Number(Object.keys(this.vendorMap).find((o) => this.vendorMap[o] === vendorHash));

    return this
      .cachedResponse
      .then((vds) => vds.find((vd) => vd.vendor === matchedValue));
  }

  getVendorHash(vendorDrop: VendorDrop): number {
    return this.vendorMap[vendorDrop.vendor];
  }
}
