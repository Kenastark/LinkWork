function cx(...parts) { return parts.filter(Boolean).join(' '); }

export default function Card({ className, ...props }) {
  return <div className={cx('card', className)} {...props} />;
}
