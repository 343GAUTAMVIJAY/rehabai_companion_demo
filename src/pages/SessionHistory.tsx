import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockSessions, EMOTIONS, type Emotion } from '@/lib/mockData';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const SessionHistory = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [emotionFilter, setEmotionFilter] = useState<string>('all');

  const filtered = mockSessions.filter(s => {
    const matchSearch = s.patient.name.toLowerCase().includes(search.toLowerCase());
    const matchEmotion = emotionFilter === 'all' || s.dominantEmotion === emotionFilter;
    return matchSearch && matchEmotion;
  });

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
                    <td className="py-3 font-medium">{s.patient.name}</td>
                    <td className="py-3 text-muted-foreground">{s.date}</td>
                    <td className="py-3 text-muted-foreground">{s.duration}</td>
                    <td className="py-3"><Badge variant="secondary">{s.dominantEmotion}</Badge></td>
                    <td className="py-3 font-mono">{s.avgGripForce.toFixed(1)} N</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === 'SAFE' ? 'status-safe' : s.status === 'CAUTION' ? 'status-caution' : 'status-pause'}`}>{s.status}</span>
                    </td>
                    <td className="py-3"><Button size="sm" variant="ghost" onClick={() => navigate(`/report/${s.id}`)}>View Report</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionHistory;
