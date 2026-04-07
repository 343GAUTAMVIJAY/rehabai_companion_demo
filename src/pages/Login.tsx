import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, KeyRound, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [submitting, setSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const isLogin = mode === 'login';
  const isForgotPassword = mode === 'forgot';

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthMessage('');

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        setMode('login');
        setAuthMessage('We sent a password reset link to your email. Check your inbox and spam folder.');
        toast.success('Password reset link sent');
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in successfully');
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        const alreadyRegistered = !!data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;

        if (alreadyRegistered) {
          setMode('login');
          setAuthMessage('This email is already registered or still waiting for confirmation. Try signing in or resend the confirmation email.');
          toast.error('Email already registered. Try signing in or resend confirmation.');
          return;
        }

        setAuthMessage('Account created. Check your inbox and spam folder to confirm your email.');
        toast.success('Account created! Check your email to confirm.');
      }
    } catch (err: any) {
      const message = err?.message || 'Authentication failed';

      if (message.toLowerCase().includes('email not confirmed')) {
        setAuthMessage('Your email is not confirmed yet. Use resend confirmation below, then check your inbox or spam folder.');
        toast.error('Email not confirmed yet');
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setAuthMessage('A fresh confirmation email was sent. Check your inbox and spam folder.');
      toast.success('Confirmation email sent again');
    } catch (err: any) {
      toast.error(err?.message || 'Could not resend confirmation email');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthMessage('');
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error('Google sign-in failed');
  };

  if (loading) return null;

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
            {isForgotPassword ? (
              <Button type="button" variant="ghost" size="sm" className="w-fit px-0" onClick={() => { setMode('login'); setAuthMessage(''); }}>
                Back to Sign In
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant={isLogin ? 'default' : 'ghost'} className="flex-1" size="sm" onClick={() => { setMode('login'); setAuthMessage(''); }}>Sign In</Button>
                <Button type="button" variant={!isLogin ? 'default' : 'ghost'} className="flex-1" size="sm" onClick={() => { setMode('signup'); setAuthMessage(''); }}>Create Account</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {authMessage && <div className="mb-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{authMessage}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isForgotPassword && (
                <>
                  <div><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. John Smith" required /></div>
                  <div><Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Doctor">Doctor</SelectItem>
                        <SelectItem value="Therapist">Therapist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@hospital.com" required /></div>
              {!isForgotPassword && <div><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></div>}
              <Button type="submit" disabled={submitting} className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
                {isForgotPassword ? <KeyRound className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                {submitting ? 'Please wait...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
            {isLogin && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="link" className="h-auto justify-start px-0 text-sm" onClick={() => { setMode('forgot'); setAuthMessage(''); }}>
                  Forgot password?
                </Button>
                <Button type="button" variant="link" className="h-auto justify-start px-0 text-sm" onClick={handleResendConfirmation} disabled={submitting}>
                  Resend confirmation email
                </Button>
              </div>
            )}
            {!isForgotPassword && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">HIPAA Compliant • AES-256 Encrypted • SOC 2 Certified</p>
      </div>
    </div>
  );
};

export default Login;
