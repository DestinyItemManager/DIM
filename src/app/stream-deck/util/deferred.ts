export class DeferredPromise {
  promise?: Promise<any>;
  public _resolve?: (v?: any) => any;

  constructor() {
    this.reset();
  }

  resolve() {
    this._resolve?.();
    this.reset();
  }

  reset() {
    this.promise = new Promise((resolve) => {
      this._resolve = resolve;
    });
  }
}
