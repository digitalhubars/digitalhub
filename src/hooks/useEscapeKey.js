import { useEffect } from 'react';

export default function useEscapeKey(onEscape) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onEscape();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape]);
}
