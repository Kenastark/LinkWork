import { useEffect } from 'react';

// Traps Tab inside the container while active, closes on Escape, and returns
// focus to whatever opened it. Shared by the nav sheet and the reject modal.
export default function useFocusTrap(active, containerRef, onClose) {
  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;
    const opener = document.activeElement;
    const SEL = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(el.querySelectorAll(SEL)).filter(n => n.offsetParent !== null);

    focusables()[0]?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [active, containerRef, onClose]);
}
