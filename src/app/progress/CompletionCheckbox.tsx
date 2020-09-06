import clsx from 'clsx';
import React from 'react';

export default function CompletionCheckbox({ completed }: { completed: boolean }) {
  const classes = clsx('objective-checkbox', {
    'objective-complete': completed,
  });

  return <div className={classes} />;
}
