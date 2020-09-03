import { PlatformErrorCodes } from 'bungie-api-ts/common';

/**
 * an error indicating the Bungie API sent back a parseable response,
 * and that response indicated the request was not successful
 */
export class DimError extends Error {
  code?: string | PlatformErrorCodes;
  constructor(message: string, code?: string | PlatformErrorCodes) {
    super(message);
    this.name = 'DimError';
    this.code = code;
  }
}
