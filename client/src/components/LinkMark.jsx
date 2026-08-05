// The LinkWork chain-link mark — circular badge with a gradient + inset highlight for depth.
//
// Glyph geometry is the original pre-rebrand mark, unchanged. Only the plate
// recoloured, green -> blue, via .brand-mark in styles.css.
//
// The three paths carry animation classes so the draw-in can treat them the way
// BRANDING.md section 4 describes: the two hooks are the links and draw first,
// then the connecting bar strokes in. Each hook's path runs inner -> outer arc
// -> inner, so its midpoint sits on the outer bend; the dash grows outward from
// there, which is what makes them draw in from their outer ends. pathLength="1"
// normalises each path so the animation needs no measurement.
export default function LinkMark({ size = 42, sealed = false }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          className="lk-notch" pathLength="1" d="M9.5 14.5 14.5 9.5"
          stroke={sealed ? 'var(--seal)' : '#fff'} strokeWidth="2.4" strokeLinecap="round"
        />
        <path
          className="lk-link-b" pathLength="1" d="M11 6.5 12.8 4.7a4 4 0 0 1 5.7 5.7L16.6 12.2"
          stroke="#fff" strokeWidth="2.4" strokeLinecap="round"
        />
        <path
          className="lk-link-a" pathLength="1" d="M13 17.5 11.2 19.3a4 4 0 0 1-5.7-5.7l1.9-1.8"
          stroke="#fff" strokeWidth="2.4" strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
