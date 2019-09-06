import React from 'react';
import classNames from 'classnames';

export default function CompletionCheckbox({ completed }: { completed: boolean }) {
  const classes = classNames('objective-checkbox', {
    'objective-complete': completed
  });

  return <div className={classes} />;
}
