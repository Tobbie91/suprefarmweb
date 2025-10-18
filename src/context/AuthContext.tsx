
// import React, { createContext, useContext, useState, ReactNode } from 'react';

// interface AuthContextType {
//   isAuthenticated: boolean;
//   isAdmin: boolean;
//   login: (role: string) => void;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(false);

//   const login = (role: string) => {
//     setIsAuthenticated(true);
//     if (role === 'admin') {
//       setIsAdmin(true);
//     }
//   };

//   const logout = () => {
//     setIsAuthenticated(false);
//     setIsAdmin(false);
//   };

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, isAdmin, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// src/context/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react'
import { supabase } from '../supabase'
import { useSupabaseSession } from './SupabaseSessionProvider'

interface AuthContextType {
  isAuthenticated: boolean
  isAdmin: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useSupabaseSession()
  const isAuthenticated = !!user

  // however you detect admins (e.g., app_metadata.role === 'admin')
  const isAdmin = (user?.app_metadata?.role === 'admin') ?? false

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
