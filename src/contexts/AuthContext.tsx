
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Employee } from '@/types';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  employee: Employee | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<Employee>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = () => {
      try {
        const cookieValue = getCookie('employee_auth_sim');
        if (cookieValue) {
          const user = JSON.parse(decodeURIComponent(cookieValue));
          setEmployee(user);
        } else {
          setEmployee(null);
        }
      } catch (error) {
        console.error("Failed to parse user from cookie", error);
        setEmployee(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (isLoading) {
      return; // Do nothing while loading
    }
    
    const isAuthPage = pathname.startsWith('/login');

    if (employee && isAuthPage) {
        if (employee.username === 'admin') {
            router.push('/dashboard');
        } else {
            router.push('/employee/workstation');
        }
    } else if (!employee && !isAuthPage) {
      router.push('/login');
    }
    
  }, [employee, isLoading, pathname, router]);

  const login = async (username: string, password: string): Promise<Employee> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка входа');
    }

    const { employee: loggedInEmployee } = await response.json();
    // This state update is crucial and will trigger the useEffect above
    setEmployee(loggedInEmployee);
    return loggedInEmployee;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setEmployee(null);
      router.push('/login');
    }
  };
  
  const isAuthenticated = !!employee;

  return (
    <AuthContext.Provider value={{ isAuthenticated, employee, isLoading, login, logout }}>
      {isLoading ? (
        <div className="flex h-screen w-full items-center justify-center">
            {/* You can replace this with a more sophisticated loader */}
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
