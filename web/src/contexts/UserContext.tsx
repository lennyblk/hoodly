import { createContext, useContext, useState } from 'react';
import api from '../api/axios';
import type { components } from '../api/types.generated';

type CurrentUser = components['schemas']['User'];

interface UserContextType {
  user: CurrentUser | null;
  fetchMe: () => Promise<void>;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);

  async function fetchMe() {
    const { data } = await api.get<CurrentUser>('/auth/me');
    setUser(data);
  }

  function clearUser() {
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, fetchMe, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
