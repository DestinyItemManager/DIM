export default function EmptySubclass({ border }: { border?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
      <rect
        transform="rotate(-45)"
        y="17.470564"
        x="-16.470564"
        height="32.941124"
        width="32.941124"
        fill="rgba(255, 255, 255, 0.05)"
        strokeWidth="1"
        strokeMiterlimit="4"
        stroke={border ? 'white' : undefined}
      />
    </svg>
  );
}
