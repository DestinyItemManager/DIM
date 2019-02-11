import * as React from 'react';
import { Subject } from 'rxjs/Subject';

export enum NotificationType {
  Info = 'info',
  Warning = 'warn',
  Error = 'error',
  Progress = 'progress'
}

export interface NotifyInput {
  title: string;
  body: React.ReactNode;
  type?: NotificationType;
  icon?: React.ReactNode;
  requiresInteraction?: boolean;
  /** The notification will show for either the given number of milliseconds, or when the provided promise completes. */
  duration?: Promise<any> | number;
  onClick?(event: React.MouseEvent): void;
  onClose?(): void;
}

export interface Notify {
  id: number;
  type: NotificationType;
  title: string;
  body: React.ReactNode;
  icon?: React.ReactNode;
  requiresInteraction: boolean;
  /** The notification will show for either the given number of milliseconds, or when the provided promise completes. */
  duration: Promise<any> | number;
  onClick?(event: React.MouseEvent): void;
  onClose?(): void;
}

export const notifications$ = new Subject<Notify>();

let notificationId = 0;
export function showNotification(notification: NotifyInput) {
  notifications$.next({
    ...notification,
    requiresInteraction: false,
    id: notificationId++,
    duration: 5000,
    type: NotificationType.Info
  });
}
