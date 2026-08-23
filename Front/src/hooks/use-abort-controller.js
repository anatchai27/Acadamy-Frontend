import { useEffect, useRef, useCallback } from 'preact/hooks';

export const useAbortController = () => {
  const controllerRef = useRef(null);

  const getSignal = useCallback(() => {
    controllerRef.current ? controllerRef.current.abort() : null;
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current ? controllerRef.current.abort() : null;
    };
  }, []);

  return getSignal;
};
