import { Subscription } from 'rxjs';

/** A helper for managing multiple RxJS subscriptions. */
export class Subscriptions {
  private subscriptions: Subscription[] = [];

  add(...subscriptions: Subscription[]) {
    this.subscriptions.push(...subscriptions);
  }

  unsubscribe() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }
}
