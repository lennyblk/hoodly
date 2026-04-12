import { createContext, useState } from 'react';
import api from '../api/axios';
import type { components } from '../api/types.generated';

type CurrentUser = components['schemas']['User'];

interface UserContextType {
  user: CurrentUser | null;
  fetchMe: () => Promise<void>;
  clearUser: () => void;
}

export const UserContext = createContext<UserContextType | null>(null);

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

