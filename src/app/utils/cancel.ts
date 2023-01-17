/**
 * A CancelToken should be passed to cancelable functions. Those functions should then check the state of the
 * token and return early, or use checkCanceled to throw a CanceledError if the token has been canceled. Callers
 * of cancelable functions should catch CanceledError.
 */
export interface CancelToken {
  readonly canceled: boolean;
  checkCanceled: () => void;
}

/**
 * Indicates that the function was canceled by a call to the cancellation token's cancel function.
 */
export class CanceledError extends Error {
  constructor() {
    super('canceled');
    this.name = 'CanceledError';
  }
}

/**
 * Returns a cancel token and a cancellation function. The token can be passed to functions and checked
 * to see whether it has been canceled. The function can be called to cancel the token.
 */
export function withCancel(): [CancelToken, () => void] {
  let isCanceled = false;
  return [
    {
      get canceled() {
        return isCanceled;
      },
      checkCanceled() {
        if (isCanceled) {
          throw new CanceledError();
        }
      },
    },
    () => (isCanceled = true),
  ];
}

export const neverCanceled = {
  get canceled() {
    return false;
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  checkCanceled() {},
};
