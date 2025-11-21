
"use client";
import type { ReactNode } from 'react';
import React from 'react';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, WashingMachine, LogOut } from 'lucide-react';
import { MainNavigation } from './MainNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AppLayout({ children, newServicesCount = 0 }: { children: ReactNode, newServicesCount?: number }) {
  const { open: sidebarOpen, isMobile, state: sidebarState } = useSidebar();
  const { isAuthenticated, employee, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const sidebarIsEffectivelyOpen = isMobile ? sidebarOpen : sidebarState === 'expanded';
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If we are on the login page, render only the children (the login form itself)
  if (pathname.startsWith('/login')) {
      return <>{children}</>;
  }

  // If we are not on login and not authenticated, we're in a redirect state.
  // Show a loader to prevent layout flicker.
  if (!isAuthenticated) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // For regular employees on their dedicated layout
  const isEmployeeOnlyPage = pathname.startsWith('/employee') && employee?.username !== 'admin';
  if (isEmployeeOnlyPage) {
    return <>{children}</>;
  }
  
  // For the main manager layout
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarHeader className="p-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <WashingMachine className="h-8 w-8 text-primary shrink-0" />
            {sidebarIsEffectivelyOpen && <h1 className="font-headline text-xl font-semibold text-sidebar-foreground truncate">АвтомойкаПро</h1>}
          </Link>
          {!isMobile && sidebarState === 'collapsed' && (
             <div className="w-8"></div>
          )}
        </SidebarHeader>
        <ScrollArea className="flex-grow">
          <SidebarContent>
            <MainNavigation onLogout={logout} newServicesCount={newServicesCount} />
          </SidebarContent>
        </ScrollArea>
      </Sidebar>
      <SidebarInset className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-sm md:px-6">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1">
            {/* Breadcrumbs or dynamic page title could go here */}
          </div>
          <div>
            {/* User menu, notifications, etc. */}
            <Button variant="ghost" size="icon" aria-label="Настройки">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
