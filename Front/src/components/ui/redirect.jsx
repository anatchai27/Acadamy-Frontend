import { useEffect } from 'preact/hooks';
import { route } from 'preact-router';
export const Redirect = ({
  to
}) => {
  useEffect(() => {
    route(to, true);
  }, []);
  return null;
};