import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockSessions, EMOTION_COLORS } from '@/lib/mockData';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SessionReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = mockSessions.find(s => s.id === id) || mockSessions[0];

  const emotionData = session.emotionLog.map(e => ({ time: `${e.time}m`, emotion: e.emotion, confidence: e.confidence }));
  const robotData = session.robotLog.map((r, i) => ({ time: `${i}m`, grip: r.gripForce, speed: r.speed }));

  const handleExport = (type: 'pdf' | 'excel') => {
    toast.success(`${type.toUpperCase()} report exported successfully`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Session Report</h1>
          <p className="text-muted-foreground text-sm">{session.patient.name} — {session.date}</p>
        </div>
        <Button variant="outline" onClick={() => handleExport('excel')}><Download className="w-4 h-4 mr-2" />Excel</Button>
        <Button onClick={() => handleExport('pdf')} className="gradient-accent border-0 text-accent-foreground"><Download className="w-4 h-4 mr-2" />PDF</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Duration" value={session.duration} />
        <SummaryCard label="Dominant Emotion" value={session.dominantEmotion} />
        <SummaryCard label="Avg Grip Force" value={`${session.avgGripForce.toFixed(1)} N`} />
        <SummaryCard label="Status" value={session.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <VitalSummary label="Heart Rate" value={`${session.vitals.heartRate} BPM`} />
        <VitalSummary label="Blood Pressure" value={`${session.vitals.bpSystolic}/${session.vitals.bpDiastolic}`} />
        <VitalSummary label="SpO2" value={`${session.vitals.spo2.toFixed(1)}%`} />
        <VitalSummary label="Pain Level" value={`${session.vitals.painLevel}/10`} />
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Emotion Timeline</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={emotionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} label={{ value: 'Confidence %', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
              <Tooltip />
              <Line type="monotone" dataKey="confidence" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Robot Parameters Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={robotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="grip" fill="hsl(var(--secondary))" name="Grip Force (N)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="speed" fill="hsl(var(--primary))" name="Speed (mm/s)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Recommendation</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on the session data, the patient showed predominantly <strong>{session.dominantEmotion.toLowerCase()}</strong> emotional responses. 
            The robot maintained <strong>{session.status}</strong> status throughout most of the session. 
            Average grip force was <strong>{session.avgGripForce.toFixed(1)} N</strong>, within normal therapeutic range.
            {session.vitals.painLevel > 5 ? ' Pain levels were elevated — consider reducing intensity in the next session.' : ' Pain levels remained manageable.'}
            {' '}Continue current rehabilitation protocol with minor adjustments based on emotional feedback patterns.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <Card className="shadow-card"><CardContent className="pt-4 pb-4 text-center"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-bold">{value}</p></CardContent></Card>
);

const VitalSummary = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">{label}</p><p className="font-mono font-semibold">{value}</p></div>
);

export default SessionReport;
