import React from 'react';
/**
 * an independent element fed into showNotification({body:
 * attach your own functionality to its onClick when creating it.
 * jsx children are the button's label
 */
export default function NotificationButton({
  children,
  onClick
}: {
  children: React.ReactNode[];
  onClick(): void;
}) {
  return (
    <span className="notif-button" onClick={onClick}>
      {children}
    </span>
  );
}
