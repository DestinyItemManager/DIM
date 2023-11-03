import { EventBus } from 'app/utils/observable';
import React from 'react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'progress';

export interface NotifyInput {
  title: string;
  body?: React.ReactNode;
  type?: NotificationType;
  /** Some content to show to the left of the notification */
  icon?: React.ReactNode;
  /** Some content to show to the right of the notification */
  trailer?: React.ReactNode;
  /** The notification will stay up while the promise is not complete, and for a duration afterwards. Throw NotificationError to customize the error screen. */
  promise?: Promise<unknown>;
  /** The notification will show for the given number of milliseconds. */
  duration?: number;
  /** Return false to not close the notification on click. */
  onClick?: (event: React.MouseEvent) => boolean | void;
  onCancel?: () => void;
}

export interface Notify {
  id: number;
  type: NotificationType;
  title: string;
  body?: React.ReactNode;
  icon?: React.ReactNode;
  trailer?: React.ReactNode;
  promise?: Promise<unknown>;
  /** The notification will show for either the given number of milliseconds, or when the provided promise completes. */
  duration: number;
  onClick?: (event: React.MouseEvent) => boolean | void;
  onCancel?: () => void;
}

/**
 * An error that allows setting the properties of the notification. Throw this from your promise
 * to transform the notification into an error.
 */
export class NotificationError extends Error {
  title?: string;
  body?: React.ReactNode;
  type?: NotificationType;
  icon?: React.ReactNode;
  trailer?: React.ReactNode;

  constructor(
    message: string,
    {
      title,
      body,
      type,
      icon,
      trailer,
    }: {
      title?: string;
      body?: React.ReactNode;
      type?: NotificationType;
      icon?: React.ReactNode;
      trailer?: React.ReactNode;
    },
  ) {
    super(message);
    this.name = 'NotificationError';
    this.title = title;
    this.body = body || message;
    this.type = type || 'error';
    this.icon = icon;
    this.trailer = trailer;
  }
}

export const notifications$ = new EventBus<Notify>();

let notificationId = 0;
export function showNotification(notification: NotifyInput) {
  notifications$.next({
    id: notificationId++,
    duration: 5000,
    type: 'info',
    ...notification,
  });
}
