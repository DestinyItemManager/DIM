import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import Dialog, { DialogRef } from './Dialog';

// Redecalare forwardRef
declare module 'react' {
  function forwardRef<T, P = {}>(
    render: (props: P, ref: Ref<T>) => ReactElement | null
  ): (props: P & RefAttributes<T>) => ReactElement | null;
}

export interface PromptRef {
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

const Prompt = forwardRef(function Prompt(_props, ref: React.ForwardedRef<PromptRef>) {
  const dialogRef =
    useRef<DialogRef<{ message: string; defaultValue?: string }, string | null>>(null);

  useImperativeHandle(
    ref,
    () => ({
      prompt: (message, defaultValue) => dialogRef.current!.showDialog({ message, defaultValue }),
    }),
    [dialogRef]
  );

  // TODO: reverse buttons on windows?

  const [value, setValue] = useState<string>();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value);

  return (
    <Dialog ref={dialogRef}>
      {(args, close) => (
        <div>
          Title: {args.message}
          <input type="text" value={value ?? args.defaultValue ?? ''} onChange={handleChange} />
          <button type="button" onClick={() => close(value ?? args.defaultValue ?? '')}>
            OK
          </button>
          <button type="button" onClick={() => close(null)}>
            Cancel
          </button>
        </div>
      )}
    </Dialog>
  );
});

/**
 * Replacement for window.prompt, returns an element you need to render, and a
 * confirm function you can use to show prompt dialogs.
 */
export default function usePrompt(): [
  element: React.ReactNode,
  prompt: (message: string, defaultValue?: string) => Promise<string | null>
] {
  const ref = useRef<PromptRef>(null);
  const prompt = useCallback(
    (message: string, defaultValue?: string) => ref.current!.prompt(message, defaultValue),
    []
  );
  // eslint-disable-next-line react/jsx-key
  return [<Prompt ref={ref} />, prompt];
}
