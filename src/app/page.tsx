
'use client';
import { Loader2 } from 'lucide-react';
// This page is now just a loading/redirection placeholder.
// AuthContext handles redirecting authenticated users to their correct dashboards
// and unauthenticated users to the login page.
export default function Home() {
  return (
     <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
