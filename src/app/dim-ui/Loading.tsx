import { AnimatePresence, Transition, Variants, motion } from 'motion/react';
import * as styles from './Loading.m.scss';

const containerAnimateVariants: Variants = {
  initial: { opacity: 0 },
  open: { opacity: 1 },
};
const containerAnimateTransition: Transition<number> = {
  duration: 0.5,
  delay: 1,
};

const messageAnimateVariants: Variants = {
  initial: { y: -16, opacity: 0 },
  open: { y: 0, opacity: 1 },
  leave: { y: 16, opacity: 0 },
};
const messageAnimateTransition: Transition<number> = {
  duration: 0.2,
  ease: 'easeOut',
};

export function Loading({ message }: { message?: string }) {
  return (
    <section className={styles.loading}>
      <div className={styles.container}>
        {Array.from({ length: 16 }, (_, n) => (
          <div key={n} className={styles.square} />
        ))}
      </div>

      <motion.div
        className={styles.textContainer}
        initial="initial"
        animate="open"
        variants={containerAnimateVariants}
        transition={containerAnimateTransition}
      >
        <AnimatePresence>
          {message && (
            <motion.div
              key={message}
              className={styles.text}
              initial="initial"
              animate="open"
              exit="leave"
              variants={messageAnimateVariants}
              transition={messageAnimateTransition}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
