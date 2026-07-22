// The LinkWork chain-link mark — circular badge with a gradient + inset highlight for depth
export default function LinkMark({ size = 42 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9.5 14.5 14.5 9.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M11 6.5 12.8 4.7a4 4 0 0 1 5.7 5.7L16.6 12.2" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M13 17.5 11.2 19.3a4 4 0 0 1-5.7-5.7l1.9-1.8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}
