import { useEffect } from 'react';

export default function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside, active]);
}
