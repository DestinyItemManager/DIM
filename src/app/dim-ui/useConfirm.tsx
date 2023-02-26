import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import Dialog, { DialogRef } from './Dialog';

// Redecalare forwardRef
declare module 'react' {
  function forwardRef<T, P = {}>(
    render: (props: P, ref: Ref<T>) => ReactElement | null
  ): (props: P & RefAttributes<T>) => ReactElement | null;
}

export interface ConfirmRef {
  confirm: (message: string) => Promise<boolean>;
}

const Confirm = forwardRef(function Confirm(_props, ref: React.ForwardedRef<ConfirmRef>) {
  const dialogRef = useRef<DialogRef<string, boolean>>(null);

  useImperativeHandle(
    ref,
    () => ({ confirm: (message) => dialogRef.current!.showDialog(message) }),
    [dialogRef]
  );

  return (
    <Dialog ref={dialogRef}>
      {(args, close) => (
        <div>
          Title: {args}
          <button type="button" onClick={() => close(true)}>
            OK
          </button>
          <button type="button" onClick={() => close(false)}>
            Cancel
          </button>
        </div>
      )}
    </Dialog>
  );
});

/**
 * Replacement for window.confirm, returns an element you need to render, and a
 * confirm function you can use to show confirm dialogs.
 */
export default function useConfirm(): [
  element: React.ReactNode,
  confirm: (message: string) => Promise<boolean>
] {
  const ref = useRef<ConfirmRef>(null);
  const confirm = useCallback((message: string) => ref.current!.confirm(message), []);
  // eslint-disable-next-line react/jsx-key
  return [<Confirm ref={ref} />, confirm];
}
