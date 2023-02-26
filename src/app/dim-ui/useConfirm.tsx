import { t } from 'i18next';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import Dialog, { Buttons, DialogRef, Title } from './Dialog';

// Redecalare forwardRef
declare module 'react' {
  function forwardRef<T, P = {}>(
    render: (props: P, ref: Ref<T>) => ReactElement | null
  ): (props: P & RefAttributes<T>) => ReactElement | null;
}

export interface ConfirmOpts {
  okLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
}

export interface ConfirmRef {
  confirm: (message: React.ReactNode, opts?: ConfirmOpts) => Promise<boolean>;
}

const Confirm = forwardRef(function Confirm(_props, ref: React.ForwardedRef<ConfirmRef>) {
  const dialogRef = useRef<
    DialogRef<
      ConfirmOpts & {
        message: React.ReactNode;
      },
      boolean
    >
  >(null);

  useImperativeHandle(
    ref,
    () => ({ confirm: (message, opts) => dialogRef.current!.showDialog({ message, ...opts }) }),
    [dialogRef]
  );

  return (
    <Dialog ref={dialogRef}>
      {(args, close) => (
        <>
          <Title>
            <h2>{args.message}</h2>
          </Title>
          <Buttons>
            <button className="dim-button" type="button" onClick={() => close(true)}>
              {args.okLabel ?? t('Notification.OK')}
            </button>
            <button className="dim-button" type="button" onClick={() => close(false)}>
              {args.cancelLabel ?? t('Notification.Cancel')}
            </button>
          </Buttons>
        </>
      )}
    </Dialog>
  );
});

/**
 * Replacement for window.confirm, returns an element you need to render, and a
 * confirm function you can use to show confirm dialogs.
 */
export default function useConfirm(): [element: React.ReactNode, confirm: ConfirmRef['confirm']] {
  const ref = useRef<ConfirmRef>(null);
  const confirm = useCallback(
    (message: React.ReactNode, opts?: ConfirmOpts) => ref.current!.confirm(message, opts),
    []
  );
  // eslint-disable-next-line react/jsx-key
  return [<Confirm ref={ref} />, confirm];
}
