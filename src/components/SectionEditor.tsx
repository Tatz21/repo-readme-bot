import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Loader2, X } from 'lucide-react';

interface SectionEditorProps {
  sectionTitle: string;
  sectionContent: string;
  repoInfo: { name: string; owner: string; description: string; language: string };
  onUpdate: (newContent: string) => void;
  onClose: () => void;
}

export function SectionEditor({ sectionTitle, sectionContent, repoInfo, onUpdate, onClose }: SectionEditorProps) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const presets = [
    'Make it more concise',
    'Add more examples',
    'Make it more professional',
    'Add code snippets',
    'Simplify the language',
  ];

  const handleEdit = async (prompt: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-section', {
        body: { section: sectionTitle, sectionContent, repoInfo, instruction: prompt },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      onUpdate(data.content);
      toast({ title: 'Section updated!' });
      onClose();
    } catch (error) {
      toast({ title: 'Failed', description: error instanceof Error ? error.message : 'Error', variant: 'destructive' });
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
            <Wand2 className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-bold text-foreground">Edit Section</h2>
              <p className="text-xs text-muted-foreground">{sectionTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => handleEdit(preset)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-secondary-foreground hover:text-foreground transition-all border border-transparent hover:border-primary/30 disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Custom instruction..."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && instruction && handleEdit(instruction)}
              disabled={loading}
            />
            <Button variant="glow" size="sm" onClick={() => handleEdit(instruction)} disabled={!instruction || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
