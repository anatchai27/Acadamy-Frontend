import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';

export function Redirect({ to }) {
  useEffect(() => {
    route(to, true);
  }, []);
  return null;
}
