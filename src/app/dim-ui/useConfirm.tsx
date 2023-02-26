import { t } from 'i18next';
import { Buttons, default as useDialog, Title } from './useDialog';

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
  confirm: (message: React.ReactNode, opts?: ConfirmOpts) => Promise<boolean>
] {
  const [dialog, showDialog] = useDialog<
    ConfirmOpts & {
      message: React.ReactNode;
    },
    boolean
  >((args, close) => (
    <>
      <Title>
        <h2>{args.message}</h2>
      </Title>
      <Buttons>
        <button className="dim-button" type="button" onClick={() => close(true)}>
          {args.okLabel ?? t('Dialog.OK')}
        </button>
        <button className="dim-button" type="button" onClick={() => close(false)}>
          {args.cancelLabel ?? t('Dialog.Cancel')}
        </button>
      </Buttons>
    </>
  ));

  const confirm = (message: React.ReactNode, opts?: ConfirmOpts) =>
    showDialog({ message, ...opts });

  return [dialog, confirm];
}
