import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { LinkProps, Link } from 'react-router-dom';

function isModifiedEvent(event) {
  return Boolean(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

const LinkButtonComponent = forwardRef<HTMLButtonElement>(
  (
    { navigate, onClick, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { navigate: any },
    forwardedRef
  ) => {
    const props = {
      ...rest,
      onClick: (event) => {
        try {
          if (onClick) onClick(event);
        } catch (ex) {
          event.preventDefault();
          throw ex;
        }

        if (
          !event.defaultPrevented && // onClick prevented default
          event.button === 0 && // ignore everything but left clicks
          !isModifiedEvent(event) // ignore clicks with modifier keys
        ) {
          event.preventDefault();
          navigate();
        }
      }
    };

    return <button ref={forwardedRef} {...props} />;
  }
);

export default function LinkButton(props: LinkProps) {
  return <Link component={LinkButtonComponent} {...props} />;
}
