import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AppLayout = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name').eq('user_id', user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const initials = (profile?.full_name || user?.email || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const displayName = profile?.full_name || user?.email || '';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{initials}</div>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{displayName}</span>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
