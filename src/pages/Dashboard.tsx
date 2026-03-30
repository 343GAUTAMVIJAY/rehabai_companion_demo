import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, TrendingUp, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;

    supabase.from('profiles').select('full_name').eq('user_id', user.id).single()
      .then(({ data }) => setProfile(data));

    supabase.from('sessions').select('*, patients(name)').eq('user_id', user.id).order('date', { ascending: false }).limit(10)
      .then(({ data }) => setSessions(data || []));

    supabase.from('patients').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setPatientCount(count || 0));
  }, [user]);

  const stats = [
    { label: 'Total Sessions', value: String(sessions.length), icon: Activity, change: 'All time' },
    { label: 'Patients Treated', value: String(patientCount), icon: Users, change: 'Unique patients' },
    { label: 'Avg Grip Force', value: sessions.length > 0 ? `${(sessions.reduce((s, x) => s + (Number(x.avg_grip_force) || 0), 0) / sessions.length).toFixed(1)} N` : '—', icon: TrendingUp, change: 'Across sessions' },
    { label: 'Active Sessions', value: String(sessions.filter(s => !s.duration_seconds).length), icon: Play, change: 'In progress' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, {profile?.full_name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-xs text-secondary mt-1">{s.change}</p>
                </div>
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Recent Sessions</CardTitle></CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No sessions yet. Start a new session to see data here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Patient</th>
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Emotion</th>
                    <th className="pb-3 font-medium text-muted-foreground">Grip Force</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-medium">{(s.patients as any)?.name || 'Unknown'}</td>
                      <td className="py-3 text-muted-foreground">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="py-3"><Badge variant="secondary">{s.dominant_emotion || '—'}</Badge></td>
                      <td className="py-3">{s.avg_grip_force ? `${Number(s.avg_grip_force).toFixed(1)} N` : '—'}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === 'SAFE' ? 'status-safe' : s.status === 'CAUTION' ? 'status-caution' : 'status-pause'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
