import React from 'react';
import { Subject } from 'rxjs';
import { DimItem } from '../inventory/item-types';
import { TagValue } from '../inventory/dim-item-info';
import { NotifButtonType } from './NotificationButton';
import { DestinyAccount } from '../accounts/destiny-account.service';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'progress';
export type ChangeList = { item: DimItem; setTag: TagValue | 'clear' | 'lock' | 'unlock' }[];

export interface NotifyInput {
  title: string;
  type?: NotificationType | NotifButtonType;
  body?: React.ReactNode;
  icon?: React.ReactNode;
  account?: DestinyAccount;
  buttonEffect?: ChangeList;
  /** The notification will show for either the given number of milliseconds, or when the provided promise completes. */
  duration?: Promise<any> | number;
  onClick?(event: React.MouseEvent): void;
}

export interface Notify {
  id: number;
  title: string;
  type: NotificationType | NotifButtonType;
  body?: React.ReactNode;
  icon?: React.ReactNode;
  account?: DestinyAccount;
  buttonEffect?: ChangeList;
  /** The notification will show for either the given number of milliseconds, or when the provided promise completes. */
  duration: Promise<any> | number;
  onClick?(event: React.MouseEvent): void;
}

export const notifications$ = new Subject<Notify>();

let notificationId = 0;
export function showNotification(notification: NotifyInput) {
  notifications$.next({
    id: notificationId++,
    type: 'info',
    duration: 5000,
    ...notification
  });
}
