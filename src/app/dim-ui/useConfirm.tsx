import { t } from 'app/i18next-t';
import { isWindows } from 'app/utils/browsers';
import { useCallback } from 'react';
import useDialog, { Buttons, Title } from './useDialog';

export interface ConfirmOpts {
  okLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
}

/**
 * Replacement for window.confirm, returns an element you need to render, and a
 * confirm function you can use to show confirm dialogs.
 */
export default function useConfirm(): [
  element: React.ReactNode,
  confirm: (message: React.ReactNode, opts?: ConfirmOpts) => Promise<boolean>,
] {
  const [dialog, showDialog] = useDialog<
    ConfirmOpts & {
      message: React.ReactNode;
    },
    boolean
  >((args, close) => (
    <ConfirmDialog
      message={args.message}
      okLabel={args.okLabel}
      cancelLabel={args.cancelLabel}
      close={close}
    />
  ));

  const confirm = (message: React.ReactNode, opts?: ConfirmOpts) =>
    showDialog({ message, ...opts });

  return [dialog, confirm];
}

function ConfirmDialog({
  message,
  okLabel,
  cancelLabel,
  close,
}: {
  message: React.ReactNode;
  okLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  close: (result: boolean) => void;
}) {
  const cancel = useCallback(() => close(false), [close]);
  const ok = useCallback(() => close(true), [close]);

  const okButton = (
    <button className="dim-button dim-button-primary" type="button" onClick={ok} autoFocus>
      {okLabel ?? t('Dialog.OK')}
    </button>
  );

  const cancelButton = (
    <button className="dim-button" type="button" onClick={cancel}>
      {cancelLabel ?? t('Dialog.Cancel')}
    </button>
  );

  return (
    <>
      <Title>{message}</Title>
      <Buttons>
        {isWindows() ? (
          <>
            {cancelButton}
            {okButton}
          </>
        ) : (
          <>
            {okButton}
            {cancelButton}
          </>
        )}
      </Buttons>
    </>
  );
}
