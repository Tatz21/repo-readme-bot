import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, X, Wand2 } from 'lucide-react';

interface ImportReadmeProps {
  onImport: (readme: string) => void;
  onClose: () => void;
}

export function ImportReadme({ onImport, onClose }: ImportReadmeProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleImprove = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-readme', {
        body: { readme: content },
      });
      if (error) throw error;
      onImport(data.content);
      toast({ title: 'README improved!', description: 'The improved version is ready' });
      onClose();
    } catch (error) {
      toast({ title: 'Failed', description: error instanceof Error ? error.message : 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUseAsIs = () => {
    onImport(content);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Import README</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">Paste an existing README and let AI improve it while keeping the structure.</p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-48 p-3 bg-secondary rounded-lg text-sm font-mono text-foreground border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary scrollbar-thin"
            placeholder="# My Project&#10;&#10;Paste your existing README.md here..."
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleUseAsIs} disabled={!content.trim()}>
              Use As-Is
            </Button>
            <Button variant="glow" className="flex-1" onClick={handleImprove} disabled={!content.trim() || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              AI Improve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
