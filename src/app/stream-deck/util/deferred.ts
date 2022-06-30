// This is a promise that is resolved from external
// (used in showSelectionNotification streamDeckSelectItem, and streamDeckSelectLoadout
// to show a notification that still stays visible until the user cancel it or the related action is completed
// (ex. select an item/loadout or cancel the request)
export class DeferredPromise {
  promise?: Promise<any>;
  public _resolve?: (v?: any) => any;
  public _reject?: (e?: any) => any;

  constructor() {
    this.reset();
  }

  resolve() {
    this._resolve?.();
    this.reset();
  }

  reject(message?: string) {
    this._reject?.(message);
    this.reset();
  }

  reset() {
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }
}
