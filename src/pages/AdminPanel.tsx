import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Activity, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminPanel = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) { navigate('/dashboard'); return; }
    loadData();
  }, [isAdmin, adminLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    const [p, pt, s] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('patients').select('*'),
      supabase.from('sessions').select('*, patients(name)'),
    ]);
    setProfiles(p.data || []);
    setPatients(pt.data || []);
    setSessions(s.data || []);
    setLoading(false);
  };

  const handleDeletePatient = async (id: string) => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Patient deleted'); loadData(); }
  };

  const handleDeleteSession = async (id: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Session deleted'); loadData(); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === 'admin') {
      const { error } = await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' as any });
      if (error) toast.error('Failed to update role');
      else toast.success('Role updated to admin');
    } else {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin' as any);
      toast.success('Admin role removed');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This permanently removes their account, patients and sessions.`)) return;
    const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { user_id: userId } });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Failed to delete user');
      return;
    }
    toast.success('User deleted');
    loadData();
  };

  if (adminLoading || loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-secondary" />
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card"><CardContent className="pt-6 text-center"><Users className="w-8 h-8 mx-auto text-secondary mb-2" /><p className="text-2xl font-bold">{profiles.length}</p><p className="text-sm text-muted-foreground">Users</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6 text-center"><Users className="w-8 h-8 mx-auto text-info mb-2" /><p className="text-2xl font-bold">{patients.length}</p><p className="text-sm text-muted-foreground">Patients</p></CardContent></Card>
        <Card className="shadow-card"><CardContent className="pt-6 text-center"><Activity className="w-8 h-8 mx-auto text-warning mb-2" /><p className="text-2xl font-bold">{sessions.length}</p><p className="text-sm text-muted-foreground">Sessions</p></CardContent></Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="shadow-card">
            <CardHeader><CardTitle>All Users</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="pb-3 text-left font-medium text-muted-foreground">Name</th><th className="pb-3 text-left font-medium text-muted-foreground">Role</th><th className="pb-3 text-left font-medium text-muted-foreground">Hospital</th><th className="pb-3 text-left font-medium text-muted-foreground">Actions</th></tr></thead>
                  <tbody>
                    {profiles.map(p => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3">{p.full_name || '—'}</td>
                        <td className="py-3"><Badge variant="secondary">{p.role || 'User'}</Badge></td>
                        <td className="py-3 text-muted-foreground">{p.hospital || '—'}</td>
                        <td className="py-3">
                          <Select defaultValue="user" onValueChange={v => handleRoleChange(p.user_id, v)}>
                            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card className="shadow-card">
            <CardHeader><CardTitle>All Patients</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="pb-3 text-left font-medium text-muted-foreground">Name</th><th className="pb-3 text-left font-medium text-muted-foreground">Age</th><th className="pb-3 text-left font-medium text-muted-foreground">Diagnosis</th><th className="pb-3 text-left font-medium text-muted-foreground">Actions</th></tr></thead>
                  <tbody>
                    {patients.map(p => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{p.name}</td>
                        <td className="py-3">{p.age}</td>
                        <td className="py-3 text-muted-foreground">{p.diagnosis}</td>
                        <td className="py-3"><Button variant="ghost" size="sm" onClick={() => handleDeletePatient(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card className="shadow-card">
            <CardHeader><CardTitle>All Sessions</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="pb-3 text-left font-medium text-muted-foreground">Patient</th><th className="pb-3 text-left font-medium text-muted-foreground">Date</th><th className="pb-3 text-left font-medium text-muted-foreground">Emotion</th><th className="pb-3 text-left font-medium text-muted-foreground">Status</th><th className="pb-3 text-left font-medium text-muted-foreground">Actions</th></tr></thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{(s.patients as any)?.name || '—'}</td>
                        <td className="py-3 text-muted-foreground">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="py-3"><Badge variant="secondary">{s.dominant_emotion || '—'}</Badge></td>
                        <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'SAFE' ? 'status-safe' : s.status === 'CAUTION' ? 'status-caution' : 'status-pause'}`}>{s.status}</span></td>
                        <td className="py-3"><Button variant="ghost" size="sm" onClick={() => handleDeleteSession(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
