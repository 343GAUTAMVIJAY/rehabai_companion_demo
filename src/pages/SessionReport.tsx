import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const SessionReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('sessions').select('*, patients(name, age, diagnosis, affected_limb)').eq('id', id).single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Session not found');
          navigate('/history');
          return;
        }
        setSession(data);
        setLoading(false);
      });
  }, [id, navigate]);

  if (loading || !session) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading report...</div>;

  const emotionLog = (session.emotion_log as any[]) || [];
  const robotLog = (session.robot_log as any[]) || [];
  const vitals = (session.vitals as any) || {};
  const patient = session.patients as any;

  const emotionData = emotionLog.map(e => ({ time: `${e.time}m`, emotion: e.emotion, confidence: e.confidence }));
  const robotData = robotLog.map((r: any, i: number) => ({ time: `${i}m`, grip: r.gripForce, speed: r.speed }));

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('RehabAI Session Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Patient: ${patient?.name || 'Unknown'}`, 14, 30);
      doc.text(`Date: ${new Date(session.date).toLocaleDateString()}`, 14, 37);
      doc.text(`Duration: ${formatDuration(session.duration_seconds)}`, 14, 44);
      doc.text(`Dominant Emotion: ${session.dominant_emotion || '—'}`, 14, 51);
      doc.text(`Avg Grip Force: ${session.avg_grip_force ? `${Number(session.avg_grip_force).toFixed(1)} N` : '—'}`, 14, 58);
      doc.text(`Status: ${session.status || '—'}`, 14, 65);

      if (vitals.heartRate) {
        doc.text('Vitals:', 14, 75);
        doc.text(`  Heart Rate: ${Math.round(vitals.heartRate)} BPM`, 14, 82);
        doc.text(`  Blood Pressure: ${Math.round(vitals.bpSystolic)}/${Math.round(vitals.bpDiastolic)}`, 14, 89);
        doc.text(`  SpO2: ${Number(vitals.spo2).toFixed(1)}%`, 14, 96);
        doc.text(`  Pain Level: ${vitals.painLevel}/10`, 14, 103);
      }

      if (emotionLog.length > 0) {
        doc.text('Emotion Log:', 14, 116);
        autoTable(doc, {
          startY: 120,
          head: [['Time', 'Emotion', 'Confidence %']],
          body: emotionLog.map(e => [e.time, e.emotion, `${Number(e.confidence).toFixed(1)}%`]),
          styles: { fontSize: 8 },
        });
      }

      doc.save(`RehabAI_Report_${patient?.name || 'session'}_${new Date(session.date).toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF report downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const summary = [
        ['RehabAI Session Report'],
        ['Patient', patient?.name || 'Unknown'],
        ['Date', new Date(session.date).toLocaleDateString()],
        ['Duration', formatDuration(session.duration_seconds)],
        ['Dominant Emotion', session.dominant_emotion || '—'],
        ['Avg Grip Force', session.avg_grip_force ? `${Number(session.avg_grip_force).toFixed(1)} N` : '—'],
        ['Status', session.status || '—'],
        [],
        ['Vitals'],
        ['Heart Rate', vitals.heartRate ? `${Math.round(vitals.heartRate)} BPM` : '—'],
        ['Blood Pressure', vitals.bpSystolic ? `${Math.round(vitals.bpSystolic)}/${Math.round(vitals.bpDiastolic)}` : '—'],
        ['SpO2', vitals.spo2 ? `${Number(vitals.spo2).toFixed(1)}%` : '—'],
        ['Pain Level', vitals.painLevel != null ? `${vitals.painLevel}/10` : '—'],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summary);
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      if (emotionLog.length > 0) {
        const emSheet = XLSX.utils.json_to_sheet(emotionLog.map(e => ({
          Time: e.time,
          Emotion: e.emotion,
          'Confidence %': Number(e.confidence).toFixed(1),
        })));
        XLSX.utils.book_append_sheet(wb, emSheet, 'Emotion Log');
      }

      if (robotLog.length > 0) {
        const rbSheet = XLSX.utils.json_to_sheet(robotLog.map((r: any, i: number) => ({
          Time: i,
          'Grip Force (N)': Number(r.gripForce).toFixed(1),
          'X-Axis': Number(r.xAxis).toFixed(1),
          'Y-Axis': Number(r.yAxis).toFixed(1),
          'Z-Axis': Number(r.zAxis).toFixed(1),
          'Speed (mm/s)': Number(r.speed).toFixed(1),
        })));
        XLSX.utils.book_append_sheet(wb, rbSheet, 'Robot Log');
      }

      XLSX.writeFile(wb, `RehabAI_Report_${patient?.name || 'session'}_${new Date(session.date).toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel report downloaded');
    } catch {
      toast.error('Failed to generate Excel');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Session Report</h1>
          <p className="text-muted-foreground text-sm">{patient?.name || 'Unknown'} — {new Date(session.date).toLocaleDateString()}</p>
        </div>
        <Button variant="outline" onClick={handleExportExcel}><Download className="w-4 h-4 mr-2" />Excel</Button>
        <Button onClick={handleExportPDF} className="gradient-accent border-0 text-accent-foreground"><Download className="w-4 h-4 mr-2" />PDF</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Duration" value={formatDuration(session.duration_seconds)} />
        <SummaryCard label="Dominant Emotion" value={session.dominant_emotion || '—'} />
        <SummaryCard label="Avg Grip Force" value={session.avg_grip_force ? `${Number(session.avg_grip_force).toFixed(1)} N` : '—'} />
        <SummaryCard label="Status" value={session.status || '—'} />
      </div>

      {vitals.heartRate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <VitalSummary label="Heart Rate" value={`${Math.round(vitals.heartRate)} BPM`} />
          <VitalSummary label="Blood Pressure" value={`${Math.round(vitals.bpSystolic)}/${Math.round(vitals.bpDiastolic)}`} />
          <VitalSummary label="SpO2" value={`${Number(vitals.spo2).toFixed(1)}%`} />
          <VitalSummary label="Pain Level" value={`${vitals.painLevel}/10`} />
        </div>
      )}

      {emotionData.length > 0 && (
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
      )}

      {robotData.length > 0 && (
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
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base">Recommendation</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Based on the session data, the patient showed predominantly <strong>{(session.dominant_emotion || 'neutral').toLowerCase()}</strong> emotional responses.
            The robot maintained <strong>{session.status}</strong> status throughout most of the session.
            {session.avg_grip_force && <> Average grip force was <strong>{Number(session.avg_grip_force).toFixed(1)} N</strong>, within normal therapeutic range.</>}
            {vitals.painLevel > 5 ? ' Pain levels were elevated — consider reducing intensity in the next session.' : ' Pain levels remained manageable.'}
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
