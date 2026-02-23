import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Loader2, Check, AlertTriangle, X } from 'lucide-react';

interface ReadmeScoreProps {
  readme: string;
  repoName: string;
  onClose: () => void;
}

interface ScoreResult {
  score: number;
  suggestions: string[];
  breakdown: { category: string; score: number; max: number; notes: string }[];
}

export function ReadmeScore({ readme, repoName, onClose }: ReadmeScoreProps) {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('score-readme', {
        body: { readme, repoName },
      });
      if (error) throw error;
      setResult(data);
    } catch (error) {
      toast({ title: 'Analysis failed', description: error instanceof Error ? error.message : 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-terminal-green';
    if (score >= 60) return 'text-primary';
    return 'text-destructive';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">README Score</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {!result ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Analyze your README for completeness, quality, and best practices.</p>
              <Button variant="glow" onClick={analyze} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                Analyze README
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className={`text-5xl font-bold ${scoreColor(result.score)}`}>{result.score}</div>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
              </div>

              <div className="space-y-2">
                {result.breakdown.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                    <span className="text-sm font-medium text-foreground">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(item.score / item.max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{item.score}/{item.max}</span>
                    </div>
                  </div>
                ))}
              </div>

              {result.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Suggestions</h3>
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
