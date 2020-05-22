import React from 'react';
import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'progress';

export interface NotifyInput {
  title: string;
  body?: React.ReactNode;
  type?: NotificationType;
  icon?: React.ReactNode;
  trailer?: React.ReactNode;
  /** The notification will stay up while the promise is not complete, and for a duration afterwards. */
  promise?: Promise<any>;
  /** The notification will show for the given number of milliseconds. */
  duration?: number;
  /** Return false to not close the notification on click. */
  onClick?(event: React.MouseEvent): boolean | void;
}

export interface Notify {
  id: number;
  type: NotificationType;
  title: string;
  body?: React.ReactNode;
  icon?: React.ReactNode;
  trailer?: React.ReactNode;
  promise?: Promise<any>;
  /** The notification will show for either the given number of milliseconds, or when the provided promise completes. */
  duration: number;
  onClick?(event: React.MouseEvent): boolean | void;
}

export const notifications$ = new Subject<Notify>();

let notificationId = 0;
export function showNotification(notification: NotifyInput) {
  notifications$.next({
    id: notificationId++,
    duration: 5000,
    type: 'info',
    ...notification,
  });
}
