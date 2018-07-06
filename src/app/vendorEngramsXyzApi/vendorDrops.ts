export interface VendorDrop {
  id: number;
  vendor: VendorEngramVendor;
  type: VendorDropType;
  verified: boolean;
  enabled: boolean;
}

export enum VendorDropType {
  Dropping375 = 0,
  Dropping376To379 = 1,
  Possibly380 = 2,
  Likely380 = 3,
  NeedMoreData = 4
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
  AnaBray =	19,
  IKELOS_HC_V1_0_1 = 20,
  BraytechRWPMk_II = 21
}
