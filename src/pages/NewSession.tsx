import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const NewSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', age: '', gender: '', diagnosis: '', limb: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.diagnosis) {
      toast.error('Please fill in required fields');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      // Create or find patient
      const { data: patient, error: patientErr } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: form.name,
          age: parseInt(form.age),
          gender: form.gender || null,
          diagnosis: form.diagnosis,
          affected_limb: form.limb || null,
          notes: form.notes || null,
        })
        .select()
        .single();

      if (patientErr) throw patientErr;

      // Create session
      const { data: session, error: sessionErr } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          patient_id: patient.id,
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;

      toast.success('Session started — initializing camera & ML pipeline');
      navigate('/live-session', { state: { patient, sessionId: session.id } });
    } catch (err: any) {
      toast.error(err.message || 'Failed to start session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Session</h1>
        <p className="text-muted-foreground text-sm">Register patient and begin rehabilitation session</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle>Patient Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Patient Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
              <div><Label>Age *</Label><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Years" /></div>
              <div><Label>Gender</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Affected Limb</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, limb: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left">Left</SelectItem>
                    <SelectItem value="Right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Diagnosis *</Label><Input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="e.g., Post-stroke hemiparesis" /></div>
            <div><Label>Session Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={3} /></div>
            <Button type="submit" disabled={submitting} className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
              <Play className="w-4 h-4 mr-2" /> {submitting ? 'Starting...' : 'Start Session'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewSession;
