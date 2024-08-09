import { useEffect, useRef } from 'react';

export default function ItemListExpander({ onExpand }: { onExpand: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elem = ref.current;
    if (!elem) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onExpand();
          }
        }
      },
      {
        root: null,
        rootMargin: '16px',
        threshold: 0,
      },
    );

    observer.observe(elem);
    return () => observer.unobserve(elem);
  }, [onExpand]);

  return <div ref={ref} />;
}
