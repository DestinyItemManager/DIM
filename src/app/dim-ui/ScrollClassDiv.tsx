import React, { useEffect, useRef } from 'react';

export default React.memo(function ScrollClassDiv({
  scrollClass,
  hideClass,
  children,
  ...divProps
}: React.HTMLAttributes<HTMLDivElement> & {
  scrollClass: string;
  hideClass?: string;
}) {
  const rafTimer = useRef<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stickyHeader = () => {
      const scrolled = Boolean(
        document.body.scrollTop > 0 || document.documentElement?.scrollTop > 0
      );
      if (ref.current) {
        ref.current.classList.toggle(scrollClass, scrolled);

        if (hideClass) {
          ref.current.classList.toggle(hideClass, window.innerHeight < 500);
        }
      }
    };

    const scrollHandler = () => {
      cancelAnimationFrame(rafTimer.current);
      rafTimer.current = requestAnimationFrame(stickyHeader);
    };

    document.addEventListener('scroll', scrollHandler, false);
    return () => document.removeEventListener('scroll', scrollHandler);
  }, [scrollClass, hideClass]);

  return (
    <div ref={ref} {...divProps}>
      {children}
    </div>
  );
});
