import { useEffect, useRef, useState } from 'react';

export function useRevealCountdown(
  revealEndsAt: number | null,
  revealed: boolean,
  onComplete: () => void,
) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!revealEndsAt || revealed) {
      setSeconds(null);
      return;
    }

    let completed = false;
    const tick = () => {
      const leftMs = revealEndsAt - Date.now();
      if (leftMs <= 0) {
        setSeconds(0);
        if (!completed) {
          completed = true;
          onCompleteRef.current();
        }
        return false;
      }
      setSeconds(Math.max(1, Math.ceil(leftMs / 1000)));
      return true;
    };

    if (!tick()) return;
    const id = window.setInterval(() => {
      if (!tick()) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, [revealEndsAt, revealed]);

  return seconds;
}
