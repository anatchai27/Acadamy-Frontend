import { useEffect, useRef, useCallback } from 'preact/hooks';

export function useAbortController() {
  const controllerRef = useRef(null);

  const getSignal = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  }, []);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  return getSignal;
}
