import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dist/dialog-polyfill.css';
import styles from './useDialog.m.scss';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Redecalare forwardRef
declare module 'react' {
  function forwardRef<T, P = {}>(
    render: (props: P, ref: Ref<T>) => ReactElement | null
  ): (props: P & RefAttributes<T>) => ReactElement | null;
}

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
const Dialog = forwardRef(function Dialog<Args = [], Result = void>(
  {
    children,
  }: {
    children: (args: Args, close: (result: Result) => void) => React.ReactNode;
  },
  ref: React.ForwardedRef<DialogRef<Args, Result>>
) {
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
    [dialogState]
  );

  useImperativeHandle(ref, () => ({ showDialog }), [showDialog]);

  // Need to polyfill dialog, which only arrived in Safari 15.4
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialogPolyfill.registerDialog(dialog);
    }
  }, [dialogRef]);

  return (
    <dialog className={styles.dialog} ref={dialogRef} onClose={handleCloseEvent}>
      {dialogState && children(dialogState.args, close)}
    </dialog>
  );
});

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
  children: (args: Args, close: (result: Result) => void) => React.ReactNode
): [element: React.ReactNode, showDialog: (args: Args) => Promise<Result>] {
  const dialogRef = useRef<DialogRef<Args, Result>>(null);
  const showDialog = useCallback((args: Args) => dialogRef.current!.showDialog(args), []);
  // eslint-disable-next-line react/jsx-key
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
export function Body({ children }: { children: React.ReactNode }) {
  return <div className={styles.body}>{children}</div>;
}
