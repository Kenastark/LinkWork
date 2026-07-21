function cx(...parts) { return parts.filter(Boolean).join(' '); }

export default function Button({ variant, size, className, ...props }) {
  return <button className={cx('btn', variant, size, className)} {...props} />;
}
