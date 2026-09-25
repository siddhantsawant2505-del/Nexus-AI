import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  _id: string;
  email: string;
  codename: string;
  lastLogin: string | null;
}

interface Profile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  totalMissions: number;
  totalCalsBurned: number;
  avgSessionMins: number;
  syncPoints: number;
  calibrated: boolean;
  experience: string;
  goals: string[];
  height?: number;
  weight?: number;
  age?: number;
  bodyFat?: number;
  equipment?: string[];
  allergies?: string[];
  attributes: {
    strength: number;
    agility: number;
    endurance: number;
    accuracy: number;
    recovery: number;
    power: number;
  };
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data.success) {
        setProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('nexus_token');
      const savedUser = localStorage.getItem('nexus_user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          await fetchProfile();
        } catch (e) {
          console.error('Failed to parse saved user:', e);
          localStorage.removeItem('nexus_token');
          localStorage.removeItem('nexus_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(userData));
    setUser(userData);
    fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
