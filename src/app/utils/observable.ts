type Subscription<T> = (value: T) => void;
type Unsubscribe = () => void;

/**
 * A minimal event emitter, as a replacement for RxJS Subject. Any type can be
 * an event. Use this when you want to subscribe to things that happen but don't
 * care about current/previous values. Supports multiple subscriptions to new
 * events. NOT compatible with use-subscription. Awkward name chosen to not conflict
 * with other existing types.
 */
export class EventBus<T> {
  private _subscriptions: Set<Subscription<T>>;

  constructor() {
    this._subscriptions = new Set();
  }

  /**
   * Notify all subscribers of an event.
   */
  next(value: T) {
    for (const subscription of this._subscriptions) {
      subscription(value);
    }
  }

  /**
   * Add a subscription to events. Returns a function that can be used to unsubscribe.
   */
  subscribe(callback: Subscription<T>): Unsubscribe {
    this._subscriptions.add(callback);
    return () => this._subscriptions.delete(callback);
  }
}

/**
 * A minimal Observable value, as a replacement for RxJS BehaviorSubject.
 * Supports multiple subscriptions to value changes and getting the last/current value.
 * Compatible with use-subscription: https://github.com/facebook/react/tree/master/packages/use-subscription
 */
export class Observable<T> {
  private _value: T;
  private _event: EventBus<T>;

  constructor(initialValue: T) {
    this._value = initialValue;
    this._event = new EventBus();
  }

  /**
   * Update the value of this observable and notify all subscribers.
   */
  next(value: T) {
    this._value = value;
    this._event.next(value);
  }

  /**
   * Get the last value that was set for this observable.
   */
  getCurrentValue(): T {
    return this._value;
  }

  /**
   * Add a subscription to value changes. Returns a function that can be used to unsubscribe.
   * The subscription is not called until the value changes - if you want the value at subscription
   * time call getCurrentValue().
   */
  subscribe(callback: Subscription<T>): Unsubscribe {
    return this._event.subscribe(callback);
  }
}
