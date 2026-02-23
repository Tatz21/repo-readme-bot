import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, X, Loader2 } from 'lucide-react';

interface BrandingSettingsProps {
  onClose: () => void;
  onSave: (branding: { logo_url: string; footer: string }) => void;
}

export function BrandingSettings({ onClose, onSave }: BrandingSettingsProps) {
  const [logoUrl, setLogoUrl] = useState('');
  const [footer, setFooter] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('custom_logo_url, custom_footer').eq('user_id', user.id).single();
      if (data) {
        setLogoUrl(data.custom_logo_url || '');
        setFooter(data.custom_footer || '');
      }
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to save branding');

      const { error } = await supabase.from('profiles').update({
        custom_logo_url: logoUrl || null,
        custom_footer: footer || null,
      }).eq('user_id', user.id);

      if (error) throw error;
      onSave({ logo_url: logoUrl, footer });
      toast({ title: 'Branding saved!' });
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Paintbrush className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Custom Branding</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Logo URL</label>
            <Input placeholder="https://example.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">Image URL for your logo in shared READMEs</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Custom Footer</label>
            <Input placeholder="Built with ❤️ by MyCompany" value={footer} onChange={(e) => setFooter(e.target.value)} />
            <p className="text-xs text-muted-foreground">Appears at the bottom of shared READMEs</p>
          </div>

          {logoUrl && (
            <div className="p-3 rounded-lg bg-secondary/50 flex items-center justify-center">
              <img src={logoUrl} alt="Preview" className="max-h-12 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}

          <Button variant="glow" className="w-full" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Branding
          </Button>
        </div>
      </div>
    </div>
  );
}
