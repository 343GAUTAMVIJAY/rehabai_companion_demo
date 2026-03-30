import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const Profile = () => {
  const handleSave = () => toast.success('Profile updated');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">SM</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Dr. Sarah Mitchell</CardTitle>
              <p className="text-sm text-muted-foreground">Rehabilitation Specialist</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input defaultValue="Dr. Sarah Mitchell" /></div>
            <div><Label>Role</Label><Input defaultValue="Doctor" disabled /></div>
            <div><Label>Hospital</Label><Input defaultValue="Metro General Hospital" /></div>
            <div><Label>Department</Label><Input defaultValue="Physical Rehabilitation" /></div>
            <div><Label>Email</Label><Input defaultValue="s.mitchell@metrogeneral.com" /></div>
            <div><Label>Phone</Label><Input defaultValue="+1 (555) 012-3456" /></div>
          </div>
          <Button onClick={handleSave} className="gradient-accent border-0 text-accent-foreground">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
