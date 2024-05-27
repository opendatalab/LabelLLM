import { useRef, useCallback } from 'react';

function useLockFn<P extends any[] = any[], V = any>(fn: (...args: P) => Promise<V>) {
  const lockRef = useRef(false);

  return useCallback(
    async (...args: P) => {
      if (lockRef.current) return;
      lockRef.current = true;
      try {
        return await fn(...args);
      } finally {
        lockRef.current = false;
      }
    },
    [fn],
  );
}

export default useLockFn;
