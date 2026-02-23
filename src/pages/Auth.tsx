import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileText, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'Password reset link sent' });
        setMode('login');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: 'Check your email', description: 'Verify your email to continue' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex items-center justify-center p-4">
      <div className="fixed top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-lg bg-gradient-primary flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">README<span className="text-gradient">.gen</span></h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? 'Sign in to save your READMEs' : mode === 'signup' ? 'Create an account' : 'Reset your password'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 bg-card border border-border rounded-xl p-6">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            )}
          </div>

          <Button type="submit" variant="glow" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            {mode === 'login' ? (
              <>
                <button type="button" onClick={() => setMode('forgot')} className="text-primary hover:underline">Forgot password?</button>
                <button type="button" onClick={() => setMode('signup')} className="text-primary hover:underline">Create account</button>
              </>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to login
              </button>
            )}
          </div>
        </form>

        <button onClick={() => navigate('/')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          Continue without account →
        </button>
      </div>
    </div>
  );
}
