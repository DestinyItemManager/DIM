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
  private _subscriptions = new Set<Subscription<T>>();

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
  private _event = new EventBus<T>();

  constructor(initialValue: T) {
    this._value = initialValue;
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
   * This needs to be an arrow function so it is bound to the instance since use-subscription uses it that way.
   */
  getCurrentValue = (): T => this._value;

  /**
   * Add a subscription to value changes. Returns a function that can be used to unsubscribe.
   * The subscription is not called until the value changes - if you want the value at subscription
   * time call getCurrentValue().
   * This needs to be an arrow function so it is bound to the instance since use-subscription uses it that way.
   */
  subscribe = (callback: Subscription<T>): Unsubscribe => this._event.subscribe(callback);
}
