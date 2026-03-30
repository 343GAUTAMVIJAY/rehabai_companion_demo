import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EMOTIONS } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SessionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('sessions').select('*, patients(name)').eq('user_id', user.id).order('date', { ascending: false })
      .then(({ data }) => setSessions(data || []));
  }, [user]);

  const filtered = sessions.filter(s => {
    const matchSearch = ((s.patients as any)?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchEmotion = emotionFilter === 'all' || s.dominant_emotion === emotionFilter;
    return matchSearch && matchEmotion;
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Session History</h1>
        <p className="text-muted-foreground text-sm">View and filter past rehabilitation sessions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by patient name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={emotionFilter} onValueChange={setEmotionFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter emotion" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emotions</SelectItem>
            {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No sessions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Patient</th>
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-muted-foreground">Duration</th>
                    <th className="pb-3 font-medium text-muted-foreground">Emotion</th>
                    <th className="pb-3 font-medium text-muted-foreground">Avg Grip</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-medium">{(s.patients as any)?.name || 'Unknown'}</td>
                      <td className="py-3 text-muted-foreground">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="py-3 text-muted-foreground">{formatDuration(s.duration_seconds)}</td>
                      <td className="py-3"><Badge variant="secondary">{s.dominant_emotion || '—'}</Badge></td>
                      <td className="py-3 font-mono">{s.avg_grip_force ? `${Number(s.avg_grip_force).toFixed(1)} N` : '—'}</td>
                      <td className="py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === 'SAFE' ? 'status-safe' : s.status === 'CAUTION' ? 'status-caution' : 'status-pause'}`}>{s.status}</span>
                      </td>
                      <td className="py-3"><Button size="sm" variant="ghost" onClick={() => navigate(`/report/${s.id}`)}>View Report</Button></td>
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

export default SessionHistory;
