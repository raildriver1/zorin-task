
"use client";
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from './AppLayout';

export function AppProviders({ children, newServicesCount }: { children: ReactNode, newServicesCount?: number }) {
  return (
    <AuthProvider>
      <SidebarProvider defaultOpen={true}>
        <AppLayout newServicesCount={newServicesCount}>
           {children}
        </AppLayout>
        <Toaster />
      </SidebarProvider>
    </AuthProvider>
  );
}
