/** The API's actual type */
export interface VendorDropXyz {
  vendorId: string;
  display: string;
  drop: VendorDropTypeXyz;
  shorthand: string;
  interval: number;
  nextRefresh: string;
}

export enum VendorDropTypeXyz {
  NoData = '0',
  DroppingLow = '1',
  DroppingHigh = '2'
}

/** Mapped from the string types to something more concrete. */
export interface VendorDrop {
  vendorId: number;
  display: boolean;
  drop: VendorDropType;
  shorthand: string;
  interval: number;
  nextRefresh: Date;
}

export enum VendorDropType {
  NoData = 0,
  DroppingLow = 1,
  DroppingHigh = 2
}
