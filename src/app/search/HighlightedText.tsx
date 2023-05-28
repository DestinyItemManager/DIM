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
}) {
  const start = text.slice(0, startIndex);
  const middle = text.slice(startIndex, endIndex);
  const end = text.slice(endIndex);

  if (!middle) {
    return <>{text}</>;
  }

  return (
    <>
      {start}
      <span className={className}>{middle}</span>
      {end}
    </>
  );
}
