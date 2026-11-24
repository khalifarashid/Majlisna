import { useEffect, useState } from 'react';
import { hasAiKey } from './key';

/** Re-renders when the viewer adds or removes their Claude key in Settings. */
export function useAiKey(): boolean {
  const [has, setHas] = useState(hasAiKey);
  useEffect(() => {
    const update = () => setHas(hasAiKey());
    window.addEventListener('majlisna-ai-key', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('majlisna-ai-key', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return has;
}
