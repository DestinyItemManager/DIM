import React from 'react';
import clsx from 'clsx';

export default function CompletionCheckbox({ completed }: { completed: boolean }) {
  const classes = clsx('objective-checkbox', {
    'objective-complete': completed
  });

  return <div className={classes} />;
}
