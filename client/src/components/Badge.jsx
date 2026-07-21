function cx(...parts) { return parts.filter(Boolean).join(' '); }

export default function Badge({ variant, className, children, ...props }) {
  return <span className={cx('badge', variant, className)} {...props}>{children}</span>;
}
