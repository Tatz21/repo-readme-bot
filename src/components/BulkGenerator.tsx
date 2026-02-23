import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Layers, Loader2, Check, X, Download } from 'lucide-react';

interface BulkGeneratorProps {
  onClose: () => void;
  options: any;
}

interface BulkItem {
  url: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  readme?: string;
  error?: string;
}

export function BulkGenerator({ onClose, options }: BulkGeneratorProps) {
  const [urls, setUrls] = useState('');
  const [items, setItems] = useState<BulkItem[]>([]);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const handleStart = async () => {
    const parsed = urls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    if (parsed.length === 0) return;

    const bulkItems: BulkItem[] = parsed.map(url => ({ url, status: 'pending' }));
    setItems(bulkItems);
    setRunning(true);

    for (let i = 0; i < bulkItems.length; i++) {
      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'generating' } : item));

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-readme`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ repoUrl: bulkItems[i].url, options }),
          }
        );

        if (!response.ok) throw new Error('Failed');
        if (!response.body) throw new Error('No body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let content = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === 'content') content += parsed.text;
            } catch {}
          }
        }

        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'done', readme: content } : item));
      } catch (error) {
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', error: 'Failed to generate' } : item));
      }
    }
    setRunning(false);
    toast({ title: 'Bulk generation complete!' });
  };

  const downloadAll = () => {
    items.filter(i => i.status === 'done' && i.readme).forEach((item) => {
      const repoName = item.url.split('/').pop() || 'readme';
      const blob = new Blob([item.readme!], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repoName}-README.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const statusIcon = (s: BulkItem['status']) => {
    if (s === 'generating') return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    if (s === 'done') return <Check className="w-4 h-4 text-terminal-green" />;
    if (s === 'error') return <X className="w-4 h-4 text-destructive" />;
    return <div className="w-4 h-4 rounded-full border-2 border-border" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Bulk Generate</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {items.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">Paste one GitHub URL per line:</p>
              <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="w-full h-32 p-3 bg-secondary rounded-lg text-sm font-mono text-foreground border border-border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="https://github.com/user/repo1&#10;https://github.com/user/repo2&#10;https://github.com/user/repo3"
              />
              <Button variant="glow" className="w-full" onClick={handleStart} disabled={!urls.trim()}>
                <Layers className="w-4 h-4" />
                Generate All
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    {statusIcon(item.status)}
                    <span className="text-sm text-foreground font-mono truncate flex-1">{item.url.replace('https://github.com/', '')}</span>
                  </div>
                ))}
              </div>
              {!running && items.some(i => i.status === 'done') && (
                <Button variant="glow" className="w-full" onClick={downloadAll}>
                  <Download className="w-4 h-4" />
                  Download All READMEs
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
