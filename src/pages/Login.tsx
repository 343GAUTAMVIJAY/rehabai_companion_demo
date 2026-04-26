import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Bot, Eye, EyeOff, KeyRound, Shield, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  // Signup
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // OTP verification
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const mapError = (err: any): string => {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('invalid login') || msg.includes('invalid credentials')) return 'Invalid email or password';
    if (msg.includes('email not confirmed')) return 'Please verify your email first';
    if (msg.includes('failed to fetch') || msg.includes('network')) return 'Connection failed, try again';
    return err?.message || 'Authentication failed';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('');

    if (!EMAIL_RE.test(email)) return toast.error('Enter a valid email address');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');

    if (mode === 'signup') {
      if (!fullName.trim()) return toast.error('Name is required');
      if (password !== confirmPassword) return toast.error('Passwords do not match');
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in successfully');
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Email verification is disabled — users get a session immediately.
        if (data.session) {
          toast.success('Account created! Welcome.');
          navigate('/dashboard');
        } else {
          // Fallback: try direct sign-in
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
          toast.success('Account created!');
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      toast.error(mapError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const sendOtp = async (targetEmail: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const handleResendOtp = async () => {
    if (resendIn > 0) return;
    try {
      await sendOtp(otpEmail);
      setResendIn(30);
      toast.success('A new code was sent');
    } catch (err: any) {
      toast.error(mapError(err));
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== 6) return toast.error('Enter the 6-digit code');
    setOtpSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: otpEmail, token, type: 'email' });
      if (error) throw error;
      toast.success('Email verified');
      setOtpOpen(false);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message?.toLowerCase().includes('invalid') ? 'Wrong code, try again' : mapError(err));
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(forgotEmail)) return toast.error('Enter a valid email');
    setForgotSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Reset link sent. Check your inbox and spam folder.');
      setForgotOpen(false);
      setForgotEmail('');
    } catch (err: any) {
      toast.error(mapError(err));
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthMessage('');
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (error) toast.error('Google sign-in failed');
  };

  if (loading) return null;

  const isLogin = mode === 'login';

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
              <Button type="button" variant={isLogin ? 'default' : 'ghost'} className="flex-1" size="sm" onClick={() => { setMode('login'); setAuthMessage(''); }}>Sign In</Button>
              <Button type="button" variant={!isLogin ? 'default' : 'ghost'} className="flex-1" size="sm" onClick={() => { setMode('signup'); setAuthMessage(''); }}>Create Account</Button>
            </div>
          </CardHeader>
          <CardContent>
            {authMessage && <div className="mb-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{authMessage}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. John Smith" required />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="doctor@hospital.com" required />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input id="confirm" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
              )}

              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <Checkbox checked={remember} onCheckedChange={(c) => setRemember(!!c)} />
                    Remember me
                  </label>
                  <Button type="button" variant="link" className="h-auto px-0 text-sm" onClick={() => { setForgotEmail(email); setForgotOpen(true); }}>
                    Forgot password?
                  </Button>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
                <Shield className="w-4 h-4 mr-2" />
                {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <div>
                  <div className="font-medium text-foreground">Demo credentials</div>
                  <div>Email: <span className="font-mono">admin@rehabai.com</span></div>
                  <div>Password: <span className="font-mono">admin123</span></div>
                </div>
              </div>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </Button>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">HIPAA Compliant • AES-256 Encrypted • SOC 2 Certified</p>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Reset your password</DialogTitle>
            <DialogDescription>Enter the email associated with your account and we'll send you a reset link.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={forgotSubmitting}>{forgotSubmitting ? 'Sending...' : 'Send Reset Link'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
            <DialogDescription>Enter the 6-digit code we sent to <span className="font-medium text-foreground">{otpEmail}</span>.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-2">
            {otp.map((d, i) => (
              <Input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                value={d}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={handleOtpPaste}
                inputMode="numeric"
                maxLength={1}
                className="w-12 h-12 text-center text-lg font-semibold"
              />
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {resendIn > 0 ? (
              <>Resend code in <span className="font-medium text-foreground">{resendIn}s</span></>
            ) : (
              <Button type="button" variant="link" className="h-auto p-0" onClick={handleResendOtp}>Resend code</Button>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOtpOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleVerifyOtp} disabled={otpSubmitting}>{otpSubmitting ? 'Verifying...' : 'Verify & Continue'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
