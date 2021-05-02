import React from 'react';

export default function HighlightedText({
  text,
  startIndex,
  endIndex,
  className,
}: {
  text: string;
  startIndex: number;
  endIndex: number;
  className: string;
}): JSX.Element {
  const start = text.slice(0, startIndex);
  const middle = text.slice(startIndex, endIndex);
  const end = text.slice(endIndex);

  if (!middle) {
    // Returning a string works, but types complain. Not sure how to fix this.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return text as any;
  }

  return (
    <>
      {start}
      <span className={className}>{middle}</span>
      {end}
    </>
  );
}
