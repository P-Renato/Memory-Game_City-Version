// hooks/useCurrentRoomId.ts
import { useLocation } from 'react-router-dom';

export function useCurrentRoomId() {
  const location = useLocation();
  const path = location.pathname;
  const match = path.match(/\/game\/([^/]+)/);
  return match ? match[1] : null;
}