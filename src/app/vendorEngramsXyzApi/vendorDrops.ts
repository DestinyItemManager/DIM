/** The API's actual type */
export interface VendorDropXyz {
  vendorID: string;
  display: string;
  drop: VendorDropTypeXyz;
  shorthand: string;
  interval: number;
  nextRefresh: string;
}

export const enum VendorDropTypeXyz {
  NoData = '0',
  DroppingLow = '1',
  DroppingHigh = '2'
}

export const enum VendorDropType {
  NoData = 0,
  DroppingLow = 1,
  DroppingHigh = 2
}

export function toVendorDrop(vendorDropXyz: VendorDropXyz): VendorDrop {
  let dropType = VendorDropType.NoData;

  if (vendorDropXyz.drop === VendorDropTypeXyz.DroppingHigh) {
    dropType = VendorDropType.DroppingHigh;
  } else if (vendorDropXyz.drop === VendorDropTypeXyz.DroppingLow) {
    dropType = VendorDropType.DroppingLow;
  }

  return {
    vendorId: Number(vendorDropXyz.vendorID),
    display: vendorDropXyz.display === '1',
    shorthand: vendorDropXyz.shorthand,
    nextRefresh: new Date(vendorDropXyz.nextRefresh),
    drop: dropType,
    interval: Number(vendorDropXyz.interval)
  };
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
