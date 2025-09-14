declare module 'data/d2/special-vendors-strings.json' {
  export interface VendorFailureString {
    vendorHash: number;
    index: number;
  }
  const value: Record<string, VendorFailureString>;
  export default value;
}
