import styles from './useDialog.m.scss';

import { Portal } from 'app/utils/temp-container';
import clsx from 'clsx';
import { useCallback, useImperativeHandle, useRef, useState } from 'react';
import ClickOutsideRoot from './ClickOutsideRoot';

export class DialogError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'DialogError';
  }
}

export interface DialogRef<Args, Result> {
  showDialog: (args: Args) => Promise<Result>;
}

/**
 * A generic dialog component that uses the system native dialog component.
 */
function Dialog<Args = [], Result = void>({
  children,
  ref,
}: {
  children: (args: Args, close: (result: Result) => void) => React.ReactNode;
  ref?: React.Ref<DialogRef<Args, Result>>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogState, setDialogState] = useState<{
    args: Args;
    promise: Promise<Result>;
    resolve: (value: Result) => void;
    reject: (err: Error) => void;
  }>();

  const handleCloseEvent = () => {
    if (dialogState) {
      dialogState.reject(new DialogError('canceled'));
      setDialogState(undefined);
    }
  };

  const close = (result: Result) => {
    if (dialogState) {
      dialogState.resolve(result);
      setDialogState(undefined);
      dialogRef.current?.close();
    }
  };

  const showDialog = useCallback(
    (args: Args) => {
      if (dialogState) {
        dialogState.reject(new DialogError('another dialog shown while this one is open'));
      }
      let resolve: (value: Result) => void | undefined;
      let reject: (err: Error) => void | undefined;
      const promise = new Promise<Result>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      setDialogState({
        args,
        promise,
        resolve: resolve!,
        reject: reject!,
      });
      dialogRef.current!.showModal();
      return promise;
    },
    [dialogState],
  );

  useImperativeHandle(ref, () => ({ showDialog }), [showDialog]);

  // We block click event propagation or else it'll trigger click handlers of the parent.
  return (
    <Portal>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        className={styles.dialog}
        ref={dialogRef}
        onClose={handleCloseEvent}
        onClick={(e) => e.stopPropagation()}
      >
        <ClickOutsideRoot>{dialogState && children(dialogState.args, close)}</ClickOutsideRoot>
      </dialog>
    </Portal>
  );
}

/**
 * A generic dialog component that uses the system native dialog component.
 *
 * Use this hook to get both an element that you should render, and a
 * `showDialog` function that can be used to invoke the dialog. The render
 * function provided to the hook gets called when the dialog is shown, with the
 * args from `showDialog`. Call `close` with the results to resolve the promise
 * from `showDialog`.
 */
export default function useDialog<Args = [], Result = void>(
  children: (args: Args, close: (result: Result) => void) => React.ReactNode,
): [element: React.ReactNode, showDialog: (args: Args) => Promise<Result>] {
  const dialogRef = useRef<DialogRef<Args, Result>>(null);
  const showDialog = useCallback((args: Args) => dialogRef.current!.showDialog(args), []);
  // eslint-disable-next-line @eslint-react/no-missing-key
  return [<Dialog ref={dialogRef}>{children}</Dialog>, showDialog];
}

/**
 * A standardized title area for the dialog. Use H2 for title string.
 */
export function Title({ children }: { children: React.ReactNode }) {
  return <div className={styles.title}>{children}</div>;
}

/**
 * A standardized buttons area for the dialog.
 */
export function Buttons({ children }: { children: React.ReactNode }) {
  return <div className={styles.buttons}>{children}</div>;
}

/**
 * A standardized body for the dialog.
 */
export function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx(styles.body, className)}>{children}</div>;
}
