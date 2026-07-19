import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useUser } from './useUser';

interface SocketContextType {
  socket: Socket | null;
  onlineIds: Set<string>;
}

const SocketContext = createContext<SocketContextType>({ socket: null, onlineIds: new Set() });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!user?._id) return;

    const socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000');
    socketRef.current = socket;
    forceUpdate((n) => n + 1);

    socket.emit('register', user._id);
    socket.on('onlineUsers', (ids: string[]) => setOnlineIds(new Set(ids)));
    socket.on('userOnline', ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => new Set(prev).add(userId)),
    );
    socket.on('userOffline', ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      }),
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
      forceUpdate((n) => n + 1);
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineIds }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
