import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, TrendingUp, Play } from 'lucide-react';
import { mockSessions } from '@/lib/mockData';

const stats = [
  { label: 'Total Sessions', value: '127', icon: Activity, change: '+12 this week' },
  { label: 'Patients Treated', value: '34', icon: Users, change: '+3 new' },
  { label: 'Avg Recovery Score', value: '78%', icon: TrendingUp, change: '+5% from last month' },
  { label: 'Active Sessions', value: '2', icon: Play, change: 'In progress' },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, Dr. Mitchell</p>
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
                {mockSessions.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 font-medium">{s.patient.name}</td>
                    <td className="py-3 text-muted-foreground">{s.date}</td>
                    <td className="py-3"><Badge variant="secondary">{s.dominantEmotion}</Badge></td>
                    <td className="py-3">{s.avgGripForce.toFixed(1)} N</td>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
