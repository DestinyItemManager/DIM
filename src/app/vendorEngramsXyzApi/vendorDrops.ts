export interface VendorDrop {
  id: number;
  vendor: VendorEngramVendor;
  type: VendorDropType;
  verified: number;
  enabled: number;
}

export enum VendorDropType {
  Dropping375 = 0,
  Dropping376To379,
  Possibly380,
  Likely380,
  NeedMoreData
}

export enum VendorEngramVendor {
  DevrimKay =	0,
  MidaMiniTool = 1,
  Sloane = 2,
  Failsafe = 3,
  AsherMir = 4,
  ManOWar =	5,
  Drang =	7,
  CommanderZavala =	8,
  LordShaxx =	9,
  Banshee44 =	10,
  IkoraRey = 11,
  Benedict9940 = 12,
  Lakshmi2 = 13,
  ExecutorHideo =	14,
  ArachJalaal =	15,
  TheEmissary =	16,
  LordSaladin =	17,
  BrotherVance = 18,
  AnaBray =	19,
  IKELOS_HC_V1_0_1 = 20,
  BraytechRWPMk_II = 21
}

export enum ManifestVendor {
  AnaBray = 1735426333,
  ArachJalaal = 3354631265,
  AsherMir = 3982706173,
  Banshee44 = 672118013,
  Benedict9940 = 1265988377,
  BrotherVance = 2398407866,
  CommanderZavala = 69482069,
  DevrimKay = 396892126,
  ExecutorHideo = 3819664660,
  Failsafe = 1576276905,
  IkoraRey = 1976548992,
  Lakshmi2 = 2260557667,
  LordSaladin = 895295461,
  LordShaxx = 3603221665,
  Sloane = 1062861569,
  TheEmissary_TRIALS0 = 3190557730,
  TheEmissary_TRIALS1 = 3190557731,
  TheEmissary_TRIALS2 = 3190557728,
  TheEmissary_TRIALS3 = 3190557729,
  TheEmissary_TRIALS4 = 3190557734,
  TyraKarn = 1748437699
}

export const vendorHashToVendorEngramVendor: { [k: number]: VendorEngramVendor[] | undefined } = {
  [ManifestVendor.AsherMir]: [VendorEngramVendor.AsherMir,
    VendorEngramVendor.ManOWar],
  [ManifestVendor.AnaBray]: [VendorEngramVendor.AnaBray, VendorEngramVendor.BraytechRWPMk_II, VendorEngramVendor.IKELOS_HC_V1_0_1],
  [ManifestVendor.Banshee44]: [VendorEngramVendor.Banshee44],
  [ManifestVendor.Benedict9940]: [VendorEngramVendor.Benedict9940],
  [ManifestVendor.BrotherVance]: [VendorEngramVendor.BrotherVance],
  [ManifestVendor.CommanderZavala]: [VendorEngramVendor.CommanderZavala],
  [ManifestVendor.DevrimKay]: [VendorEngramVendor.DevrimKay,
    VendorEngramVendor.MidaMiniTool],
  [ManifestVendor.TyraKarn]: [VendorEngramVendor.Drang],
  [ManifestVendor.ExecutorHideo]: [VendorEngramVendor.ExecutorHideo],
  [ManifestVendor.Failsafe]: [VendorEngramVendor.Failsafe],
  [ManifestVendor.IkoraRey]: [VendorEngramVendor.IkoraRey],
  [ManifestVendor.Lakshmi2]: [VendorEngramVendor.Lakshmi2],
  [ManifestVendor.LordSaladin]: [VendorEngramVendor.LordSaladin],
  [ManifestVendor.LordShaxx]: [VendorEngramVendor.LordShaxx],
  [ManifestVendor.Sloane]: [VendorEngramVendor.Sloane],
  [ManifestVendor.TheEmissary_TRIALS0]: [VendorEngramVendor.TheEmissary],
  [ManifestVendor.TheEmissary_TRIALS1]: [VendorEngramVendor.TheEmissary],
  [ManifestVendor.TheEmissary_TRIALS2]: [VendorEngramVendor.TheEmissary],
  [ManifestVendor.TheEmissary_TRIALS3]: [VendorEngramVendor.TheEmissary],
  [ManifestVendor.TheEmissary_TRIALS4]: [VendorEngramVendor.TheEmissary]
};
