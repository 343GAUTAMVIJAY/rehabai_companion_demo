import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', role: '', hospital: '', department: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) setProfile({
          full_name: data.full_name || '',
          role: data.role || '',
          hospital: data.hospital || '',
          department: data.department || '',
          phone: data.phone || '',
        });
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      hospital: profile.hospital,
      department: profile.department,
      phone: profile.phone,
    }).eq('user_id', user.id);
    setSaving(false);
    if (error) toast.error('Failed to save');
    else toast.success('Profile updated');
  };

  const initials = (profile.full_name || user?.email || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile.full_name || user?.email}</CardTitle>
              <p className="text-sm text-muted-foreground">{profile.role || 'Therapist'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div><Label>Role</Label><Input value={profile.role} disabled /></div>
            <div><Label>Hospital</Label><Input value={profile.hospital} onChange={e => setProfile(p => ({ ...p, hospital: e.target.value }))} /></div>
            <div><Label>Department</Label><Input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
            <div><Label>Phone</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gradient-accent border-0 text-accent-foreground">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
