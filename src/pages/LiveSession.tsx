import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EMOTIONS, EMOTION_COLORS, getEmotionRobotParams, getStressIndex, type Emotion, type RobotStatus } from '@/lib/mockData';
import { Camera, Square, AlertTriangle, Heart, Droplets, Wind, Gauge, Edit3, Lock } from 'lucide-react';
import { toast } from 'sonner';
import RobotArm3D from '@/components/RobotArm3D';
import { supabase } from '@/integrations/supabase/client';

const LiveSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.state?.sessionId as string | undefined;
  const patient = location.state?.patient;

  const [running, setRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [emotion, setEmotion] = useState<Emotion>('Neutral');
  const [confidence, setConfidence] = useState(92);
  const [manualVitals, setManualVitals] = useState(false);
  const [vitals, setVitals] = useState({ heartRate: 72, bpSystolic: 120, bpDiastolic: 80, spo2: 98, painLevel: 3 });
  const [robotParams, setRobotParams] = useState({ gripForce: 15, xAxis: 0, yAxis: 0, zAxis: 0, speed: 50, status: 'SAFE' as RobotStatus });
  const [pauseCount, setPauseCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emotionLogRef = useRef<any[]>([]);
  const robotLogRef = useRef<any[]>([]);

  const stressIndex = getStressIndex(emotion, vitals.painLevel);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('Camera access denied — using simulated feed');
    }
  }, []);

  const drawFaceBox = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bx = canvas.width * 0.25, by = canvas.height * 0.1, bw = canvas.width * 0.5, bh = canvas.height * 0.75;
    ctx.strokeStyle = EMOTION_COLORS[emotion];
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = EMOTION_COLORS[emotion];
    ctx.fillRect(bx, by - 28, ctx.measureText(`${emotion} ${confidence.toFixed(0)}%`).width + 16, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`${emotion} ${confidence.toFixed(0)}%`, bx + 8, by - 8);
  }, [emotion, confidence]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      // Weighted emotion selection for more realistic distribution
      const weights = [0.25, 0.1, 0.05, 0.08, 0.35, 0.05, 0.12]; // Happy, Sad, Angry, Fear, Neutral, Disgust, Surprise
      const r = Math.random();
      let cumulative = 0;
      let selectedIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (r <= cumulative) { selectedIdx = i; break; }
      }
      const newEmotion = EMOTIONS[selectedIdx];
      const newConf = 72 + Math.random() * 26; // 72-98% range for more realistic confidence
      setEmotion(newEmotion);
      setConfidence(newConf);
      const params = getEmotionRobotParams(newEmotion, newConf);
      setRobotParams(params);

      emotionLogRef.current.push({ time: emotionLogRef.current.length, emotion: newEmotion, confidence: newConf });
      robotLogRef.current.push({ gripForce: params.gripForce, xAxis: params.xAxis, yAxis: params.yAxis, zAxis: params.zAxis, speed: params.speed });

      if (params.status === 'PAUSE') {
        setPauseCount(c => {
          const next = c + 1;
          if (next >= 3) toast.warning('⚠️ PAUSE triggered 3+ times — therapist attention required!');
          return next;
        });
      }

      // Auto-simulate vitals only if not in manual mode
      if (!manualVitals) {
        setVitals(v => ({
          heartRate: Math.max(55, Math.min(120, v.heartRate + (Math.random() * 4 - 2))),
          bpSystolic: Math.max(95, Math.min(160, v.bpSystolic + (Math.random() * 3 - 1.5))),
          bpDiastolic: Math.max(55, Math.min(100, v.bpDiastolic + (Math.random() * 3 - 1.5))),
          spo2: Math.max(92, Math.min(100, v.spo2 + (Math.random() * 0.4 - 0.2))),
          painLevel: v.painLevel,
        }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [running, manualVitals]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => { if (running) drawFaceBox(); }, [running, emotion, confidence, drawFaceBox]);

  const handleStart = () => { setRunning(true); startCamera(); toast.success('Session started'); };

  const handleStop = async () => {
    setRunning(false);
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }

    const emotionCounts: Record<string, number> = {};
    emotionLogRef.current.forEach(e => { emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1; });
    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
    const avgGrip = robotLogRef.current.length > 0
      ? robotLogRef.current.reduce((s, r) => s + r.gripForce, 0) / robotLogRef.current.length
      : 0;

    if (sessionId) {
      await supabase.from('sessions').update({
        duration_seconds: timer,
        dominant_emotion: dominantEmotion,
        avg_grip_force: avgGrip,
        status: robotParams.status,
        emotion_log: emotionLogRef.current,
        vitals: vitals,
        robot_log: robotLogRef.current,
      }).eq('id', sessionId);
    }

    toast.info('Session ended and saved');
    navigate(`/report/${sessionId}`);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const updateVital = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) setVitals(v => ({ ...v, [key]: num }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Session</h1>
          <p className="text-muted-foreground text-sm">
            {patient ? `Patient: ${patient.name}` : 'Real-time emotion detection & robot control'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {running && (
            <>
              <Badge variant="outline" className="text-base font-mono">{formatTime(timer)}</Badge>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${robotParams.status === 'SAFE' ? 'status-safe' : robotParams.status === 'CAUTION' ? 'status-caution' : 'status-pause animate-pulse-glow'}`}>
                {robotParams.status}
              </span>
            </>
          )}
          {!running ? (
            <Button onClick={handleStart} className="gradient-accent border-0 text-accent-foreground"><Camera className="w-4 h-4 mr-2" />Start Session</Button>
          ) : (
            <Button onClick={handleStop} variant="destructive"><Square className="w-4 h-4 mr-2" />End Session</Button>
          )}
        </div>
      </div>

      {pauseCount >= 3 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <span className="text-sm font-medium text-destructive">Warning: PAUSE triggered {pauseCount} times — immediate therapist review required</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Camera Feed — Emotion Detection</CardTitle></CardHeader>
          <CardContent>
            <div className="relative bg-foreground/5 rounded-lg overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
              {!running && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">Camera feed will appear here</div>}
            </div>
            {running && (
              <div className="mt-3 flex items-center gap-4">
                <span className="text-sm font-medium">Detected:</span>
                <Badge style={{ backgroundColor: EMOTION_COLORS[emotion] }} className="text-accent-foreground text-sm border-0">{emotion}</Badge>
                <div className="flex-1"><Progress value={confidence} className="h-2" /></div>
                <span className="text-sm font-mono text-muted-foreground">{confidence.toFixed(1)}%</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Vital Signs</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setManualVitals(!manualVitals)} className="text-xs gap-1">
                {manualVitals ? <Lock className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                {manualVitals ? 'Auto' : 'Manual'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {manualVitals ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Heart Rate (BPM)</Label>
                    <Input type="number" value={Math.round(vitals.heartRate)} onChange={e => updateVital('heartRate', e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">SpO2 (%)</Label>
                    <Input type="number" value={vitals.spo2.toFixed(1)} onChange={e => updateVital('spo2', e.target.value)} className="h-8 text-sm" step="0.1" />
                  </div>
                  <div>
                    <Label className="text-xs">BP Systolic</Label>
                    <Input type="number" value={Math.round(vitals.bpSystolic)} onChange={e => updateVital('bpSystolic', e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">BP Diastolic</Label>
                    <Input type="number" value={Math.round(vitals.bpDiastolic)} onChange={e => updateVital('bpDiastolic', e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Pain Level</span><span className="font-mono">{vitals.painLevel}/10</span></div>
                  <Slider value={[vitals.painLevel]} min={1} max={10} step={1} onValueChange={([v]) => setVitals(prev => ({ ...prev, painLevel: v }))} />
                </div>
              </>
            ) : (
              <>
                <VitalItem icon={Heart} label="Heart Rate" value={`${Math.round(vitals.heartRate)} BPM`} color="text-destructive" />
                <VitalItem icon={Gauge} label="Blood Pressure" value={`${Math.round(vitals.bpSystolic)}/${Math.round(vitals.bpDiastolic)}`} color="text-info" />
                <VitalItem icon={Droplets} label="SpO2" value={`${vitals.spo2.toFixed(1)}%`} color="text-secondary" />
                <VitalItem icon={Wind} label="Stress Index" value={`${stressIndex}/100`} color="text-warning" />
                <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Pain Level</span><span className="font-mono">{vitals.painLevel}/10</span></div>
                  <Slider value={[vitals.painLevel]} min={1} max={10} step={1} onValueChange={([v]) => setVitals(prev => ({ ...prev, painLevel: v }))} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Robot Adjustment Panel</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <ParamCard label="Grip Force" value={`${robotParams.gripForce.toFixed(1)} N`} />
              <ParamCard label="Speed" value={`${robotParams.speed.toFixed(1)} mm/s`} />
              <ParamCard label="X-Axis" value={`${robotParams.xAxis.toFixed(1)} mm`} />
              <ParamCard label="Y-Axis" value={`${robotParams.yAxis.toFixed(1)} mm`} />
              <ParamCard label="Z-Axis" value={`${robotParams.zAxis.toFixed(1)} mm`} />
              <ParamCard label="Status" value={robotParams.status} highlight={robotParams.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Robot Arm Visualization</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 rounded-lg overflow-hidden bg-foreground/5">
              <RobotArm3D gripForce={robotParams.gripForce} xAxis={robotParams.xAxis} yAxis={robotParams.yAxis} zAxis={robotParams.zAxis} status={robotParams.status} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const VitalItem = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${color}`} /><span className="text-sm text-muted-foreground">{label}</span></div>
    <span className="font-mono text-sm font-semibold">{value}</span>
  </div>
);

const ParamCard = ({ label, value, highlight }: { label: string; value: string; highlight?: string }) => (
  <div className={`p-3 rounded-lg ${highlight === 'PAUSE' ? 'bg-destructive/10 border border-destructive/20' : highlight === 'CAUTION' ? 'bg-warning/10 border border-warning/20' : 'bg-muted'}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-bold font-mono">{value}</p>
  </div>
);

export default LiveSession;
