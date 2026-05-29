import React, { createContext, useContext, useEffect, useState } from 'react';
import { getProfile, saveProfile, generateDefaultProfile } from '../services/profile';

interface Profile {
  pseudo: string;
  color: string;
  avatar: string;
}

interface UserContextType {
  profile: Profile | null;
  ready: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      let p = await getProfile();
      if (!p) {
        p = generateDefaultProfile();
        await saveProfile(p);
      }
      setProfile(p);
      setReady(true);
    })();
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    const merged = { ...profile, ...updates } as Profile;
    await saveProfile(merged);
    setProfile(merged);
  };

  return (
    <UserContext.Provider value={{ profile, ready, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
