import { Subscription } from 'rxjs/Subscription';

/** A helper for managing multiple subscriptions. */
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
