import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Check, Loader2, X, Link2 } from 'lucide-react';

interface ShareDialogProps {
  readme: string;
  repoName: string;
  repoUrl: string;
  branding?: { logo_url?: string; footer?: string };
  onClose: () => void;
}

export function ShareDialog({ readme, repoName, repoUrl, branding, onClose }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const slug = `${repoName}-${Date.now().toString(36)}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      const { error } = await supabase.from('shared_readmes').insert({
        slug,
        user_id: user?.id || null,
        repo_url: repoUrl,
        repo_name: repoName,
        readme_content: readme,
        branding: branding || {},
      });

      if (error) throw error;
      const url = `${window.location.origin}/s/${slug}`;
      setShareUrl(url);
    } catch (error) {
      toast({ title: 'Failed to share', description: error instanceof Error ? error.message : 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Share README</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {!shareUrl ? (
            <>
              <p className="text-sm text-muted-foreground">Generate a shareable link for this README. Anyone with the link can view it.</p>
              <Button variant="glow" className="w-full" onClick={handleShare} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                Generate Share Link
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Your README is live! Share this link:</p>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
