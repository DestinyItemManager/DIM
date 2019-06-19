import React from 'react';
import classNames from 'classnames';

/**
 * a Raid Phase, described in strings as an "Encounter", is a segment of a Raid
 * which offers loot 1x per week, whose completion is tracked by the game & API.
 * this element basically returns a checkbox indicating Phase completion
 */
export default function Phase({ completed }: { completed: boolean }) {
  const classes = classNames('objective-checkbox', {
    'objective-complete': completed
  });

  return (
    <div className={classes}>
      <div />
    </div>
  );
}
