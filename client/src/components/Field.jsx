export default function Field({ label, hint, children, ...props }) {
  return (
    <label className="field" {...props}>
      {label} {hint && <span className="hint">{hint}</span>}
      {children}
    </label>
  );
}
