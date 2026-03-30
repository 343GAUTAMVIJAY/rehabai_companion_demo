import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Shield } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rehabai_user', JSON.stringify({ name: 'Dr. Sarah Mitchell', role: 'Doctor', hospital: 'Metro General Hospital' }));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">RehabAI</h1>
          <p className="text-muted-foreground text-sm mt-1">Emotion-Aware Rehabilitation Robot Control</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <div className="flex gap-2">
              <Button variant={isLogin ? 'default' : 'ghost'} className="flex-1" size="sm" onClick={() => setIsLogin(true)}>Sign In</Button>
              <Button variant={!isLogin ? 'default' : 'ghost'} className="flex-1" size="sm" onClick={() => setIsLogin(false)}>Create Account</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div><Label>Full Name</Label><Input placeholder="Dr. John Smith" /></div>
                  <div><Label>Role</Label>
                    <Select defaultValue="doctor">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="therapist">Therapist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div><Label>Email</Label><Input type="email" placeholder="doctor@hospital.com" /></div>
              <div><Label>Password</Label><Input type="password" placeholder="••••••••" /></div>
              <Button type="submit" className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
                <Shield className="w-4 h-4 mr-2" />
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">HIPAA Compliant • AES-256 Encrypted • SOC 2 Certified</p>
      </div>
    </div>
  );
};

export default Login;
