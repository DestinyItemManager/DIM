import { RootState } from 'app/store/types';
import clsx from 'clsx';
import { Transition, Variants, motion } from 'motion/react';
import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { Loading } from './Loading';
import * as styles from './PageLoading.m.scss';

const messageSelector = (state: RootState) => state.shell.loadingMessages.at(-1);

const animateVariants: Variants = {
  initial: { opacity: 0 },
  open: { opacity: 1 },
};
const animateTransition: Transition<number> = {
  duration: 0.1,
  delay: 0.5,
  ease: 'easeIn',
};

/**
 * This displays the page-level loading screen.
 */
export default function PageLoading() {
  const message = useSelector(messageSelector);
  const nodeRef = useRef<HTMLDivElement>(null);
  return (
    Boolean(message) && (
      <motion.div
        ref={nodeRef}
        className={clsx('dim-page', styles.pageLoading)}
        initial="initial"
        animate="open"
        variants={animateVariants}
        transition={animateTransition}
      >
        <Loading message={message} />
      </motion.div>
    )
  );
}
