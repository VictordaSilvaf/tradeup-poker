import { useRef, useState } from 'react';
export function useAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { run, busy, error, setError, clearError: () => setError('') };
}
