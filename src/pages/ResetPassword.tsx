import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bot, KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  const recoveryMessage = useMemo(() => {
    if (!ready) return 'Checking your reset link...';
    if (isRecovery) return 'Enter your new password below.';
    return 'This reset link is invalid or expired. Request a new password reset email from the sign in screen.';
  }, [isRecovery, ready]);

  useEffect(() => {
    const updateRecoveryStateFromHash = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      setIsRecovery(params.get('type') === 'recovery');
      setReady(true);
    };

    updateRecoveryStateFromHash();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Password updated successfully');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || 'Could not update password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-1">{recoveryMessage}</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="pb-0" />
          <CardContent>
            {isRecovery ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
                  <KeyRound className="w-4 h-4 mr-2" />
                  {submitting ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            ) : (
              <Button type="button" className="w-full" variant="outline" onClick={() => navigate('/')}>
                Back to Sign In
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;